#!/usr/bin/env python3
"""Create the deterministic Push Chord Grid v0.6.0 release-candidate bundle."""

from __future__ import annotations

import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "tools") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools"))

from validate_release import validate_release  # noqa: E402

ARCHIVE_ROOT = "PushChordGrid-v0.6.0-RC"
DEFAULT_LIVE_SET = (
    ROOT
    / "release"
    / "PushChordGrid-v0.6.0-RC Project"
    / "PushChordGrid-v0.6.0-RC.als"
)
FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)


def _zip_info(name: str) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(f"{ARCHIVE_ROOT}/{name}", FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    info.create_system = 3
    return info


def _checksum_bytes(path: Path) -> bytes:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return f"{digest}  {path.name}\n".encode("ascii")


def package_release(
    artifact: Path,
    manifest: Path,
    output: Path,
    *,
    live_set: Path = DEFAULT_LIVE_SET,
    artifact_checksum: Path | None = None,
    package_checksum: Path | None = None,
) -> Path:
    validate_release(artifact, manifest, live_set=live_set)
    files = [
        (artifact.name, artifact.read_bytes()),
        ("PushChordGrid-v0.6.0-RC.als", live_set.read_bytes()),
        ("manifest.json", manifest.read_bytes()),
        ("HARDWARE_TESTS.md", (ROOT / "docs/HARDWARE_TESTS.md").read_bytes()),
        ("ORCHID_ADAPTATION.md", (ROOT / "docs/ORCHID_ADAPTATION.md").read_bytes()),
        ("USAGE_GUIDE.html", (ROOT / "docs/USAGE_GUIDE.html").read_bytes()),
        ("CHANGELOG.md", (ROOT / "CHANGELOG.md").read_bytes()),
        ("README.md", (ROOT / "README.md").read_bytes()),
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w") as archive:
        for name, data in sorted(files):
            archive.writestr(_zip_info(name), data)
    artifact_checksum = artifact_checksum or artifact.with_name(f"{artifact.name}.sha256")
    package_checksum = package_checksum or output.with_name(f"{output.name}.sha256")
    artifact_checksum.write_bytes(_checksum_bytes(artifact))
    package_checksum.write_bytes(_checksum_bytes(output))
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--live-set", type=Path, default=DEFAULT_LIVE_SET)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--artifact-checksum", type=Path)
    parser.add_argument("--package-checksum", type=Path)
    args = parser.parse_args()
    print(
        package_release(
            args.artifact,
            args.manifest,
            args.output,
            live_set=args.live_set,
            artifact_checksum=args.artifact_checksum,
            package_checksum=args.package_checksum,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
