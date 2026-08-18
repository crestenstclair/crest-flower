from __future__ import annotations

import json
import zipfile
from pathlib import Path

from m4l_builder.freeze import extract_frozen_amxd

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
    object_names = summary(document)["object_names"]
    assert object_names.count("live.object") == 1
    assert object_names.count("live.observer") == 2
    assert object_names.count("live.path") == 1
    assert object_names.count("js") == 1
    assert object_names.count("p") == 1
    assert summary(document)["embedded_runtime_files"] == ["push-grid-adapter.js"]
    assert summary(document)["runtime_dependencies"] == []


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


def test_matrix_adapter_is_embedded_exactly_and_artifact_is_frozen(tmp_path: Path) -> None:
    artifact = build_device(tmp_path / "device.amxd")
    document = validate_amxd(artifact)
    embedded = extract_frozen_amxd(artifact.read_bytes())

    assert document.metadata == b"\x07\x00\x00\x00"
    assert sorted(embedded) == ["Push Chord Grid.amxd", "push-grid-adapter.js"]
    assert embedded["push-grid-adapter.js"] == Path(
        "src/max/push-grid-adapter.js"
    ).read_bytes()


def test_lifecycle_graph_initializes_and_tracks_device_enablement(tmp_path: Path) -> None:
    document = validate_amxd(build_device(tmp_path / "device.amxd"))
    patcher = document.patcher["patcher"]
    lines = [entry["patchline"] for entry in patcher["lines"]]

    required = [
        (["device-lifecycle", 0], ["prepend-initialized", 0]),
        (["prepend-initialized", 0], ["defer-initialized", 0]),
        (["defer-initialized", 0], ["push-grid-adapter", 0]),
        (["device-lifecycle", 0], ["push-native-adapter", 0]),
        (["device-lifecycle", 1], ["prepend-enabled", 0]),
        (["prepend-enabled", 0], ["defer-enabled", 0]),
        (["defer-enabled", 0], ["push-grid-adapter", 0]),
        (["push-grid-adapter", 2], ["push-native-adapter", 1]),
        (["push-native-adapter", 0], ["push-grid-adapter", 0]),
    ]
    for source, destination in required:
        assert {"source": source, "destination": destination} in lines


def test_native_push_bridge_matches_the_working_lom_enumeration_pattern(tmp_path: Path) -> None:
    document = validate_amxd(build_device(tmp_path / "device.amxd"))
    root = document.patcher["patcher"]
    bridge = next(
        entry["box"]["patcher"]
        for entry in root["boxes"]
        if entry["box"].get("id") == "push-native-adapter"
    )
    texts = {
        entry["box"].get("id"): entry["box"].get("text")
        for entry in bridge["boxes"]
    }

    assert texts["path-live-app"] == "path live_app"
    assert texts["observe-surfaces"] == "property control_surfaces"
    assert texts["surface-iterator"] == "zl iter 2"
    assert texts["get-surface-type"] == "gettype"
    assert texts["push-type-select"] == "sel Push2 Push3"
    assert texts["get-button-matrix"] == "call get_control Button_Matrix"
    assert texts["grab-matrix"] == "call grab_control"
    assert texts["release-matrix"] == "call release_control"
    assert texts["matrix-command-argument"] == "prepend set"
    assert texts["matrix-command"] == "append"
    assert texts["matrix-observer"] == "live.observer value"


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
    assert manifest["embedded_runtime_files"] == ["push-grid-adapter.js"]
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
            "PushChordGrid-WP2/HARDWARE_TESTS.md",
            "PushChordGrid-WP2/PushChordGrid.amxd",
            "PushChordGrid-WP2/README.md",
            "PushChordGrid-WP2/manifest.json",
        ]
