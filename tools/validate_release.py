#!/usr/bin/env python3
"""Validate the WP5 artifact, release Set, and deterministic manifest."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

try:
    from .inspect_amxd import AmxdValidationError, summary, validate_amxd
except ImportError:  # Direct script execution.
    from inspect_amxd import AmxdValidationError, summary, validate_amxd

from tools.runtime_metadata import playing_display_labels

PROJECT_VERSION = "0.6.0"
BUILD_STAGE = "WP5"
GENERATOR_NAME = "m4l-builder"
GENERATOR_VERSION = "0.8.0"
GENERATOR_COMMIT = "6c602b2861bf628d14fd39854d984b12de3cebff"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LIVE_SET = (
    ROOT
    / "release"
    / "PushChordGrid-v0.6.0-RC Project"
    / "PushChordGrid-v0.6.0-RC.als"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def expected_manifest(
    artifact: Path,
    live_set: Path = DEFAULT_LIVE_SET,
) -> dict[str, Any]:
    document = validate_amxd(artifact)
    validate_live_set(live_set)
    inspection = summary(document)
    return {
        "schema_version": 1,
        "project": "push-chord-grid",
        "version": PROJECT_VERSION,
        "stage": BUILD_STAGE,
        "artifact": {
            "path": artifact.name,
            "bytes": artifact.stat().st_size,
            "sha256": sha256(artifact),
            "type_code": inspection["type_code"],
        },
        "release_set": {
            "path": live_set.name,
            "bytes": live_set.stat().st_size,
            "sha256": sha256(live_set),
        },
        "generator": {
            "name": GENERATOR_NAME,
            "version": GENERATOR_VERSION,
            "commit": GENERATOR_COMMIT,
        },
        "embedded_runtime_files": inspection["embedded_runtime_files"],
        "runtime_dependencies": inspection["runtime_dependencies"],
        "stored_parameters": inspection["stored_parameters"],
    }


def validate_live_set(live_set: Path) -> None:
    """Reject stale display metadata before packaging an otherwise valid device."""
    try:
        root = ET.fromstring(gzip.decompress(live_set.read_bytes()))
    except (OSError, EOFError, ET.ParseError) as exc:
        raise AmxdValidationError(f"invalid release Set: {live_set}") from exc
    parameters = [
        item for item in root.findall(".//MxDEnumParameter")
        if item.find("Name") is not None and item.find("Name").get("Value") == "Playing"
    ]
    if len(parameters) != 1:
        raise AmxdValidationError("release Set must contain exactly one Playing parameter")
    parameter = parameters[0]
    labels = playing_display_labels()
    names = [entry.get("Value") for entry in parameter.findall("Names/Name/Name")]
    maximum = parameter.find("MaxValue")
    if maximum is None or maximum.get("Value") != str(len(labels) - 1) or names != labels:
        raise AmxdValidationError("release Set Playing metadata does not match the runtime catalog")


def manifest_bytes(manifest: dict[str, Any]) -> bytes:
    return (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")


def validate_release(
    artifact: Path,
    manifest_path: Path,
    *,
    live_set: Path = DEFAULT_LIVE_SET,
    write_manifest: bool = False,
) -> dict[str, Any]:
    expected = expected_manifest(artifact, live_set)
    if write_manifest:
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_bytes(manifest_bytes(expected))
    if not manifest_path.exists():
        raise AmxdValidationError(f"missing manifest: {manifest_path}")
    try:
        actual = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise AmxdValidationError(f"invalid manifest JSON: {exc}") from exc
    if actual != expected:
        raise AmxdValidationError("manifest does not match the generated artifact")
    if actual["runtime_dependencies"]:
        raise AmxdValidationError("manifest declares runtime dependencies")
    return expected


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--manifest", type=Path, default=Path("dist/manifest.json"))
    parser.add_argument("--live-set", type=Path, default=DEFAULT_LIVE_SET)
    parser.add_argument("--write-manifest", action="store_true")
    args = parser.parse_args()
    try:
        manifest = validate_release(
            args.artifact,
            args.manifest,
            live_set=args.live_set,
            write_manifest=args.write_manifest,
        )
    except (OSError, AmxdValidationError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(
        f"valid {manifest['stage']} release: {args.artifact} "
        f"sha256={manifest['artifact']['sha256']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
