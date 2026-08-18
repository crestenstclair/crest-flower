#!/usr/bin/env python3
"""Validate a WP2 artifact and its deterministic manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

try:
    from .inspect_amxd import AmxdValidationError, summary, validate_amxd
except ImportError:  # Direct script execution.
    from inspect_amxd import AmxdValidationError, summary, validate_amxd

PROJECT_VERSION = "0.2.0"
BUILD_STAGE = "WP2"
GENERATOR_NAME = "m4l-builder"
GENERATOR_VERSION = "0.8.0"
GENERATOR_COMMIT = "6c602b2861bf628d14fd39854d984b12de3cebff"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def expected_manifest(artifact: Path) -> dict[str, Any]:
    document = validate_amxd(artifact)
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
        "generator": {
            "name": GENERATOR_NAME,
            "version": GENERATOR_VERSION,
            "commit": GENERATOR_COMMIT,
        },
        "embedded_runtime_files": inspection["embedded_runtime_files"],
        "runtime_dependencies": inspection["runtime_dependencies"],
        "stored_parameters": inspection["stored_parameters"],
    }


def manifest_bytes(manifest: dict[str, Any]) -> bytes:
    return (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")


def validate_release(
    artifact: Path,
    manifest_path: Path,
    *,
    write_manifest: bool = False,
) -> dict[str, Any]:
    expected = expected_manifest(artifact)
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
    parser.add_argument("--write-manifest", action="store_true")
    args = parser.parse_args()
    try:
        manifest = validate_release(
            args.artifact,
            args.manifest,
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
