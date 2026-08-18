from __future__ import annotations

import json
import zipfile
from pathlib import Path

from build.build_device import REPRODUCIBLE_TIMESTAMP, build_device
from build.package_release import package_release
from tools.inspect_amxd import MIDI_EFFECT_PROJECT_TYPE, read_amxd, summary, validate_amxd
from tools.validate_release import sha256, validate_release


def test_generated_artifact_is_valid_midi_effect(tmp_path: Path) -> None:
    artifact = build_device(tmp_path / "PushChordGrid.amxd")
    document = validate_amxd(artifact)
    patcher = document.patcher["patcher"]

    assert document.type_code == b"mmmm"
    assert patcher["project"]["amxdtype"] == MIDI_EFFECT_PROJECT_TYPE
    assert summary(document)["object_names"] == ["live.dial", "midiin", "midiout", "panel", "s"]


def test_midi_graph_is_raw_byte_passthrough(tmp_path: Path) -> None:
    document = read_amxd(build_device(tmp_path / "device.amxd"))
    patcher = document.patcher["patcher"]
    boxes = {
        box["box"]["text"]: box["box"]["id"]
        for box in patcher["boxes"]
        if "text" in box["box"]
    }

    midi_lines = [
        line
        for line in patcher["lines"]
        if boxes["midiin"] in line["patchline"]["source"]
        or boxes["midiin"] in line["patchline"]["destination"]
        or boxes["midiout"] in line["patchline"]["source"]
        or boxes["midiout"] in line["patchline"]["destination"]
    ]
    assert midi_lines == [
        {
            "patchline": {
                "source": [boxes["midiin"], 0],
                "destination": [boxes["midiout"], 0],
            }
        }
    ]


def test_base_octave_is_stored_and_banked(tmp_path: Path) -> None:
    document = validate_amxd(build_device(tmp_path / "device.amxd"))
    patcher = document.patcher["patcher"]
    parameter = next(
        entry["box"] for entry in patcher["boxes"] if entry["box"].get("parameter_enable") == 1
    )
    valueof = parameter["saved_attribute_attributes"]["valueof"]

    assert parameter["maxclass"] == "live.dial"
    assert parameter["varname"] == "Base Octave"
    assert valueof["parameter_initial"] == [3]
    assert valueof["parameter_mmin"] == 0
    assert valueof["parameter_mmax"] == 8
    assert patcher["parameters"]["parameterbanks"]["0"]["parameters"] == [
        "Base Octave",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
    ]


def test_two_clean_builds_are_byte_identical(tmp_path: Path) -> None:
    first = build_device(tmp_path / "first.amxd")
    second = build_device(tmp_path / "second.amxd")

    assert first.read_bytes() == second.read_bytes()
    assert sha256(first) == sha256(second)


def test_generated_metadata_uses_reproducible_timestamp(tmp_path: Path) -> None:
    document = read_amxd(build_device(tmp_path / "device.amxd"))
    project = document.patcher["patcher"]["project"]

    assert project["creationdate"] == REPRODUCIBLE_TIMESTAMP
    assert project["modificationdate"] == REPRODUCIBLE_TIMESTAMP


def test_manifest_is_deterministic_and_matches_artifact(tmp_path: Path) -> None:
    artifact = build_device(tmp_path / "PushChordGrid.amxd")
    first_manifest = tmp_path / "manifest-a.json"
    second_manifest = tmp_path / "manifest-b.json"

    validate_release(artifact, first_manifest, write_manifest=True)
    validate_release(artifact, second_manifest, write_manifest=True)

    assert first_manifest.read_bytes() == second_manifest.read_bytes()
    manifest = json.loads(first_manifest.read_text(encoding="utf-8"))
    assert manifest["artifact"]["sha256"] == sha256(artifact)
    assert manifest["runtime_dependencies"] == []


def test_release_package_is_reproducible_and_complete(tmp_path: Path) -> None:
    artifact = build_device(tmp_path / "PushChordGrid.amxd")
    manifest = tmp_path / "manifest.json"
    validate_release(artifact, manifest, write_manifest=True)
    first = package_release(artifact, manifest, tmp_path / "first.zip")
    second = package_release(artifact, manifest, tmp_path / "second.zip")

    assert first.read_bytes() == second.read_bytes()
    with zipfile.ZipFile(first) as archive:
        assert archive.namelist() == [
            "PushChordGrid-WP1/HARDWARE_TESTS.md",
            "PushChordGrid-WP1/PushChordGrid.amxd",
            "PushChordGrid-WP1/README.md",
            "PushChordGrid-WP1/manifest.json",
        ]
