#!/usr/bin/env python3
"""Parse and statically validate the generated WP4 AMXD artifact."""

from __future__ import annotations

import argparse
import json
import struct
import sys
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from m4l_builder.freeze import extract_frozen_amxd  # noqa: E402

from build.max_objects import (  # noqa: E402
    FORBIDDEN_OBJECTS,
    FORBIDDEN_PREFIXES,
    WP4_ALLOWED_MAXCLASSES,
    WP4_ALLOWED_NEWOBJS,
    WP4_EMBEDDED_RUNTIME_FILES,
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
    embedded_files: dict[str, bytes]


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
    raw_payload = data[payload_start:payload_end]
    embedded_files: dict[str, bytes] = {}
    if raw_payload.startswith(b"mx@c"):
        try:
            embedded_files = extract_frozen_amxd(data)
        except ValueError as exc:
            raise AmxdValidationError(f"{artifact}: invalid frozen payload: {exc}") from exc
        device_entries = [
            content for name, content in embedded_files.items() if name.lower().endswith(".amxd")
        ]
        if len(device_entries) != 1:
            raise AmxdValidationError(
                f"{artifact}: expected one embedded device JSON, found {len(device_entries)}"
            )
        payload = device_entries[0].rstrip(b"\x00\n")
    else:
        payload = raw_payload.rstrip(b"\x00\n")
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
        embedded_files=embedded_files,
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
    """Return all WP4 policy violations for a parsed document."""
    errors: list[str] = []
    if document.version != AMXD_VERSION:
        errors.append(f"container version is {document.version}, expected {AMXD_VERSION}")
    if document.type_code != MIDI_EFFECT_CODE:
        errors.append(f"type code is {document.type_code!r}, expected {MIDI_EFFECT_CODE!r}")
    frozen_marker = (
        struct.unpack("<I", document.metadata)[0] if len(document.metadata) == 4 else None
    )
    if frozen_marker != 7:
        errors.append("WP4 artifact is not frozen/self-contained")

    try:
        patcher = _root_patcher(document)
    except AmxdValidationError as exc:
        return [str(exc)]

    project_type = patcher.get("project", {}).get("amxdtype")
    if project_type != MIDI_EFFECT_PROJECT_TYPE:
        errors.append(f"project amxdtype is {project_type!r}, expected {MIDI_EFFECT_PROJECT_TYPE}")

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
        if maxclass not in WP4_ALLOWED_MAXCLASSES:
            errors.append(f"undeclared WP4 maxclass: {maxclass}")
        if maxclass == "newobj" and name not in WP4_ALLOWED_NEWOBJS:
            errors.append(f"undeclared WP4 newobj: {name}")

    dependencies = patcher.get("dependency_cache", [])
    declared_dependencies = {
        str(dependency.get("name")) for dependency in dependencies if dependency.get("name")
    }
    embedded_dependencies = {
        name for name in document.embedded_files if not name.lower().endswith(".amxd")
    }
    if declared_dependencies != WP4_EMBEDDED_RUNTIME_FILES:
        errors.append(
            "WP4 dependency cache does not exactly declare the integrated runtime: "
            f"{sorted(declared_dependencies)}"
        )
    if embedded_dependencies != WP4_EMBEDDED_RUNTIME_FILES:
        errors.append(
            "WP4 frozen payload does not exactly embed the integrated runtime: "
            f"{sorted(embedded_dependencies)}"
        )
    external_dependencies = declared_dependencies - embedded_dependencies
    if external_dependencies:
        errors.append(f"unembedded runtime dependencies: {sorted(external_dependencies)}")

    ids_by_text: dict[str, list[str]] = {}
    for box in root_boxes:
        if box.get("maxclass") == "newobj":
            ids_by_text.setdefault(str(box.get("text", "")), []).append(str(box.get("id")))
    actual_newobjs = Counter(
        str(box.get("text", "")) for box in root_boxes if box.get("maxclass") == "newobj"
    )
    expected_newobjs = Counter(
        {
            "deferlow": 3,
            "js live-scale-adapter.js": 1,
            "js push-grid-adapter.js": 1,
            "js runtime-adapter.js": 1,
            "live.thisdevice": 1,
            "midiformat 1": 1,
            "midiin": 1,
            "midiout": 1,
            "midiparse": 1,
            "p push-native-adapter": 1,
            "prepend base_octave": 1,
            "prepend enabled": 1,
            "prepend initialized": 1,
            "prepend pad_velocity": 1,
            "prepend reload": 1,
            "prepend set": 4,
            "sel 1": 1,
            "t b b": 1,
        }
    )
    if actual_newobjs != expected_newobjs:
        errors.append(f"unexpected WP4 newobj graph: {dict(sorted(actual_newobjs.items()))}")

    lines = [entry.get("patchline", {}) for entry in patcher.get("lines", [])]
    for line in lines:
        source = line.get("source", [None])[0]
        destination = line.get("destination", [None])[0]
        if source not in root_ids:
            errors.append(f"patchline has unknown source: {source!r}")
        if destination not in root_ids:
            errors.append(f"patchline has unknown destination: {destination!r}")

    def one_id(text: str) -> str | None:
        matches = ids_by_text.get(text, [])
        return matches[0] if len(matches) == 1 else None

    expected_midi_line = {
        "source": [one_id("midiin"), 0],
        "destination": [one_id("midiout"), 0],
    }
    parameter_id = next(
        (str(box.get("id")) for box in root_boxes if box.get("varname") == "Base Octave"),
        None,
    )
    expected_parameter_line = {
        "source": [parameter_id, 0],
        "destination": [one_id("prepend base_octave"), 0],
    }
    normalized_lines = [
        {"source": line.get("source"), "destination": line.get("destination")} for line in lines
    ]
    if (
        expected_parameter_line not in normalized_lines
        or expected_midi_line not in normalized_lines
    ):
        errors.append("WP4 graph does not preserve parameter input and raw MIDI passthrough")

    required_edges = {
        ("device-lifecycle", 0, "prepend-initialized", 0),
        ("prepend-initialized", 0, "defer-initialized", 0),
        ("defer-initialized", 0, "push-grid-adapter", 0),
        ("defer-initialized", 0, "live-scale-adapter", 0),
        ("device-lifecycle", 0, "push-native-adapter", 0),
        ("device-lifecycle", 1, "prepend-enabled", 0),
        ("device-lifecycle", 1, "enabled-select", 0),
        ("prepend-enabled", 0, "defer-enabled", 0),
        ("defer-enabled", 0, "push-grid-adapter", 0),
        ("enabled-select", 0, "defer-grid-discovery", 0),
        ("reload-grid-button", 0, "reload-trigger", 0),
        ("reload-trigger", 1, "prepend-reload", 0),
        ("prepend-reload", 0, "push-grid-adapter", 0),
        ("reload-trigger", 0, "defer-grid-discovery", 0),
        ("defer-grid-discovery", 0, "push-native-adapter", 0),
        ("push-grid-adapter", 0, "prepend-pad-set", 0),
        ("prepend-pad-set", 0, "last-pad-display", 0),
        ("push-grid-adapter", 1, "prepend-status-set", 0),
        ("prepend-status-set", 0, "matrix-status-display", 0),
        ("push-grid-adapter", 2, "push-native-adapter", 1),
        ("push-grid-adapter", 3, "runtime-adapter", 0),
        ("push-grid-adapter", 4, "runtime-adapter", 0),
        ("push-native-adapter", 0, "push-grid-adapter", 0),
        ("thru_midiin", 0, "push-midi-parse", 0),
        ("push-midi-parse", 0, "prepend-pad-velocity", 0),
        ("prepend-pad-velocity", 0, "push-grid-adapter", 0),
        ("live-scale-adapter", 0, "runtime-adapter", 0),
        ("runtime-adapter", 0, "generated-midi-format", 0),
        ("runtime-adapter", 1, "generated-midi-format", 2),
        ("generated-midi-format", 0, "thru_midiout", 0),
        ("runtime-adapter", 2, "prepend-selection-set", 0),
        ("runtime-adapter", 3, "push-native-adapter", 2),
        ("runtime-adapter", 4, "prepend-feedback-set", 0),
        ("prepend-selection-set", 0, "selection-display", 0),
        ("prepend-feedback-set", 0, "feedback-display", 0),
        ("base-octave", 0, "prepend-base-octave", 0),
        ("prepend-base-octave", 0, "runtime-adapter", 0),
    }
    actual_edges = {
        (
            str(line.get("source", [None, None])[0]),
            line.get("source", [None, None])[1],
            str(line.get("destination", [None, None])[0]),
            line.get("destination", [None, None])[1],
        )
        for line in lines
    }
    if not required_edges.issubset(actual_edges):
        errors.append("WP4 scale/grid/MIDI/lifecycle graph is incomplete")
    if len(lines) != 38:
        errors.append(f"WP4 root graph has {len(lines)} patchlines, expected 38")

    reload_buttons = [
        box
        for box in root_boxes
        if box.get("id") == "reload-grid-button" and box.get("maxclass") == "textbutton"
    ]
    if len(reload_buttons) != 1 or reload_buttons[0].get("text") != "Reload Grid":
        errors.append("WP4 device does not expose exactly one Reload Grid button")

    comments = {
        str(box.get("id")): str(box.get("text"))
        for box in root_boxes
        if box.get("maxclass") == "live.comment"
    }
    expected_comments = {
        "last-pad-display": "Pad: --",
        "matrix-status-display": "Status: waiting for Live",
        "selection-display": "Scale C Major | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -",
        "feedback-display": "Last: --",
    }
    if comments != expected_comments:
        errors.append(f"WP4 status displays are unexpected: {comments!r}")

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
    declared_dependencies = {
        str(dependency.get("name"))
        for dependency in patcher.get("dependency_cache", [])
        if dependency.get("name")
    }
    embedded_dependencies = {
        name for name in document.embedded_files if not name.lower().endswith(".amxd")
    }
    return {
        "path": str(document.path),
        "container_version": document.version,
        "type_code": document.type_code.decode("ascii", errors="replace"),
        "object_names": sorted(object_name(box) for box in boxes),
        "patchline_count": len(patcher.get("lines", [])),
        "embedded_runtime_files": sorted(embedded_dependencies),
        "runtime_dependencies": sorted(declared_dependencies - embedded_dependencies),
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
        print(f"valid WP4 AMXD: {args.artifact}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
