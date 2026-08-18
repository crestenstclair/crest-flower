from __future__ import annotations

from pathlib import Path

from build.build_device import build_device
from tools.inspect_amxd import read_amxd, validate_document


def test_only_integrated_runtime_files_are_declared_and_embedded(tmp_path: Path) -> None:
    document = read_amxd(build_device(tmp_path / "device.amxd"))
    assert sorted(entry["name"] for entry in document.patcher["patcher"]["dependency_cache"]) == [
        "active-notes.js",
        "harmony.js",
        "live-scale-adapter.js",
        "push-grid-adapter.js",
        "runtime-adapter.js",
        "state.js",
    ]
    assert sorted(document.embedded_files) == [
        "Push Chord Grid.amxd",
        "active-notes.js",
        "harmony.js",
        "live-scale-adapter.js",
        "push-grid-adapter.js",
        "runtime-adapter.js",
        "state.js",
    ]
    assert validate_document(document) == []


def test_forbidden_object_is_rejected(tmp_path: Path) -> None:
    document = read_amxd(build_device(tmp_path / "device.amxd"))
    document.patcher["patcher"]["boxes"].append(
        {
            "box": {
                "id": "forbidden-node",
                "maxclass": "newobj",
                "text": "node.script server.js",
                "numinlets": 1,
                "numoutlets": 1,
            }
        }
    )

    errors = validate_document(document)
    assert "forbidden runtime object: node.script" in errors
    assert "undeclared WP4 newobj: node.script" in errors


def test_declared_external_dependency_is_rejected(tmp_path: Path) -> None:
    document = read_amxd(build_device(tmp_path / "device.amxd"))
    document.patcher["patcher"]["dependency_cache"].append({"name": "external.mxo", "type": "iLaX"})

    errors = validate_document(document)
    assert any(
        error.startswith("WP4 dependency cache does not exactly declare") for error in errors
    )
    assert "unembedded runtime dependencies: ['external.mxo']" in errors


def test_generator_is_pinned_to_exact_commit() -> None:
    lockfile = Path("requirements-dev.lock").read_text(encoding="utf-8")
    assert (
        "m4l-builder @ git+https://github.com/alaarab/m4l-builder.git"
        "@6c602b2861bf628d14fd39854d984b12de3cebff"
    ) in lockfile
