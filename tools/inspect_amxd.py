#!/usr/bin/env python3
"""Parse and statically validate the generated WP1 AMXD artifact."""

from __future__ import annotations

import argparse
import json
import struct
import sys
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from build.max_objects import (  # noqa: E402
    FORBIDDEN_OBJECTS,
    FORBIDDEN_PREFIXES,
    WP1_ALLOWED_MAXCLASSES,
    WP1_ALLOWED_NEWOBJS,
)

AMXD_MAGIC = b"ampf"
AMXD_VERSION = 4
MIDI_EFFECT_CODE = b"mmmm"
MIDI_EFFECT_PROJECT_TYPE = 1835887981


class AmxdValidationError(ValueError):
    """Raised when an AMXD fails a deterministic structural check."""


@dataclass(frozen=True)
class AmxdDocument:
    path: Path
    version: int
    type_code: bytes
    metadata: bytes
    patcher: dict[str, Any]


def read_amxd(path: Path | str) -> AmxdDocument:
    """Read an AMXD v4 container without launching Live or Max."""
    artifact = Path(path)
    data = artifact.read_bytes()
    if len(data) < 32:
        raise AmxdValidationError(f"{artifact}: truncated AMXD container")
    if data[:4] != AMXD_MAGIC:
        raise AmxdValidationError(f"{artifact}: expected AMXD magic {AMXD_MAGIC!r}")

    version = struct.unpack_from("<I", data, 4)[0]
    type_code = data[8:12]
    if data[12:16] != b"meta":
        raise AmxdValidationError(f"{artifact}: missing meta section")
    metadata_length = struct.unpack_from("<I", data, 16)[0]
    metadata_start = 20
    metadata_end = metadata_start + metadata_length
    if metadata_end + 8 > len(data):
        raise AmxdValidationError(f"{artifact}: invalid metadata length")
    if data[metadata_end : metadata_end + 4] != b"ptch":
        raise AmxdValidationError(f"{artifact}: missing ptch section")

    payload_length = struct.unpack_from("<I", data, metadata_end + 4)[0]
    payload_start = metadata_end + 8
    payload_end = payload_start + payload_length
    if payload_end != len(data):
        raise AmxdValidationError(
            f"{artifact}: declared payload length ends at {payload_end}, file ends at {len(data)}"
        )
    payload = data[payload_start:payload_end].rstrip(b"\x00\n")
    try:
        patcher = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AmxdValidationError(f"{artifact}: invalid patcher JSON: {exc}") from exc

    return AmxdDocument(
        path=artifact,
        version=version,
        type_code=type_code,
        metadata=data[metadata_start:metadata_end],
        patcher=patcher,
    )


def iter_boxes(node: Any) -> Iterator[dict[str, Any]]:
    """Yield every Max box, including boxes inside nested patchers."""
    if isinstance(node, dict):
        box = node.get("box")
        if isinstance(box, dict) and "maxclass" in box:
            yield box
        for value in node.values():
            yield from iter_boxes(value)
    elif isinstance(node, list):
        for value in node:
            yield from iter_boxes(value)


def object_name(box: dict[str, Any]) -> str:
    if box.get("maxclass") == "newobj":
        return str(box.get("text", "")).strip().split(" ", 1)[0]
    return str(box.get("maxclass", ""))


def _root_patcher(document: AmxdDocument) -> dict[str, Any]:
    patcher = document.patcher.get("patcher")
    if not isinstance(patcher, dict):
        raise AmxdValidationError(f"{document.path}: no root patcher dictionary")
    return patcher


def validate_document(document: AmxdDocument) -> list[str]:
    """Return all WP1 policy violations for a parsed document."""
    errors: list[str] = []
    if document.version != AMXD_VERSION:
        errors.append(f"container version is {document.version}, expected {AMXD_VERSION}")
    if document.type_code != MIDI_EFFECT_CODE:
        errors.append(f"type code is {document.type_code!r}, expected {MIDI_EFFECT_CODE!r}")

    try:
        patcher = _root_patcher(document)
    except AmxdValidationError as exc:
        return [str(exc)]

    project_type = patcher.get("project", {}).get("amxdtype")
    if project_type != MIDI_EFFECT_PROJECT_TYPE:
        errors.append(
            f"project amxdtype is {project_type!r}, expected {MIDI_EFFECT_PROJECT_TYPE}"
        )

    boxes = list(iter_boxes(document.patcher))
    root_boxes = [entry.get("box", {}) for entry in patcher.get("boxes", [])]
    root_ids = [str(box.get("id", "")) for box in root_boxes]
    if len(root_ids) != len(set(root_ids)):
        errors.append("root patcher contains duplicate box ids")

    for box in boxes:
        name = object_name(box)
        maxclass = str(box.get("maxclass", ""))
        if name in FORBIDDEN_OBJECTS or any(
            name.startswith(prefix) for prefix in FORBIDDEN_PREFIXES
        ):
            errors.append(f"forbidden runtime object: {name}")
        if maxclass not in WP1_ALLOWED_MAXCLASSES:
            errors.append(f"undeclared WP1 maxclass: {maxclass}")
        if maxclass == "newobj" and name not in WP1_ALLOWED_NEWOBJS:
            errors.append(f"undeclared WP1 newobj: {name}")

    dependencies = patcher.get("dependency_cache", [])
    if dependencies:
        errors.append(f"runtime dependency cache is not empty: {dependencies!r}")

    by_text = {
        str(box.get("text", "")): str(box.get("id"))
        for box in root_boxes
        if box.get("maxclass") == "newobj"
    }
    expected_newobjs = {"midiin", "midiout", "s ---pcg-base-octave"}
    if set(by_text) != expected_newobjs:
        errors.append(f"unexpected WP1 newobj graph: {sorted(by_text)}")

    lines = [entry.get("patchline", {}) for entry in patcher.get("lines", [])]
    for line in lines:
        source = line.get("source", [None])[0]
        destination = line.get("destination", [None])[0]
        if source not in root_ids:
            errors.append(f"patchline has unknown source: {source!r}")
        if destination not in root_ids:
            errors.append(f"patchline has unknown destination: {destination!r}")
    expected_midi_line = {
        "source": [by_text.get("midiin"), 0],
        "destination": [by_text.get("midiout"), 0],
    }
    parameter_id = next(
        (str(box.get("id")) for box in root_boxes if box.get("varname") == "Base Octave"),
        None,
    )
    expected_parameter_line = {
        "source": [parameter_id, 0],
        "destination": [by_text.get("s ---pcg-base-octave"), 0],
    }
    normalized_lines = [
        {"source": line.get("source"), "destination": line.get("destination")}
        for line in lines
    ]
    expected_lines = [expected_parameter_line, expected_midi_line]
    if normalized_lines != expected_lines:
        errors.append("WP1 graph is not the exact parameter sink plus raw MIDI passthrough graph")

    parameters = [box for box in boxes if box.get("parameter_enable") == 1]
    if len(parameters) != 1:
        errors.append(f"expected one stored parameter, found {len(parameters)}")
    else:
        parameter = parameters[0]
        if parameter.get("maxclass") != "live.dial":
            errors.append("stored parameter is not a live.dial")
        if parameter.get("varname") != "Base Octave":
            errors.append(f"stored parameter name is {parameter.get('varname')!r}")
        valueof = parameter.get("saved_attribute_attributes", {}).get("valueof", {})
        if valueof.get("parameter_initial") != [3]:
            errors.append("Base Octave initial value is not 3")
        if valueof.get("parameter_mmin") != 0 or valueof.get("parameter_mmax") != 8:
            errors.append("Base Octave range is not 0..8")

    bank = patcher.get("parameters", {}).get("parameterbanks", {}).get("0", {})
    bank_parameters = bank.get("parameters", [])
    if bank.get("name") != "Push Chord Grid":
        errors.append("Push parameter bank 0 has the wrong name")
    if len(bank_parameters) != 8 or bank_parameters[0] != "Base Octave":
        errors.append("Base Octave is not in Push parameter bank 0 slot 0")
    if any(value != "-" for value in bank_parameters[1:]):
        errors.append("unused Push parameter bank slots are not empty")

    return errors


def validate_amxd(path: Path | str) -> AmxdDocument:
    document = read_amxd(path)
    errors = validate_document(document)
    if errors:
        raise AmxdValidationError("\n".join(f"- {error}" for error in errors))
    return document


def summary(document: AmxdDocument) -> dict[str, Any]:
    patcher = _root_patcher(document)
    boxes = list(iter_boxes(document.patcher))
    return {
        "path": str(document.path),
        "container_version": document.version,
        "type_code": document.type_code.decode("ascii", errors="replace"),
        "object_names": sorted(object_name(box) for box in boxes),
        "patchline_count": len(patcher.get("lines", [])),
        "runtime_dependencies": patcher.get("dependency_cache", []),
        "stored_parameters": sorted(
            str(box.get("varname")) for box in boxes if box.get("parameter_enable") == 1
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    try:
        document = validate_amxd(args.artifact)
    except (OSError, AmxdValidationError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    result = summary(document)
    if args.as_json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(f"valid WP1 AMXD: {args.artifact}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
