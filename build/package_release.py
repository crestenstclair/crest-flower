#!/usr/bin/env python3
"""Create a deterministic ready-to-test WP4 zip bundle."""

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "tools") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools"))

from validate_release import validate_release  # noqa: E402

ARCHIVE_ROOT = "PushChordGrid-WP4"
FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)


def _zip_info(name: str) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(f"{ARCHIVE_ROOT}/{name}", FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    info.create_system = 3
    return info


def package_release(artifact: Path, manifest: Path, output: Path) -> Path:
    validate_release(artifact, manifest)
    files = [
        (artifact.name, artifact.read_bytes()),
        ("manifest.json", manifest.read_bytes()),
        ("HARDWARE_TESTS.md", (ROOT / "docs/HARDWARE_TESTS.md").read_bytes()),
        ("ORCHID_ADAPTATION.md", (ROOT / "docs/ORCHID_ADAPTATION.md").read_bytes()),
        ("USAGE_GUIDE.html", (ROOT / "docs/USAGE_GUIDE.html").read_bytes()),
        ("README.md", (ROOT / "README.md").read_bytes()),
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w") as archive:
        for name, data in sorted(files):
            archive.writestr(_zip_info(name), data)
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print(package_release(args.artifact, args.manifest, args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
