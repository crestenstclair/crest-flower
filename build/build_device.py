#!/usr/bin/env python3
"""Generate the self-contained WP2 Push Chord Grid Max for Live MIDI Effect."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from m4l_builder import MidiEffect, Subpatcher
from m4l_builder.amxd import apply_validation_policy
from m4l_builder.constants import MIDI_EFFECT
from m4l_builder.dsp import midi_thru
from m4l_builder.freeze import assemble_frozen_amxd
from m4l_builder.objects import message

DEVICE_NAME = "Push Chord Grid"
DEFAULT_OUTPUT = Path("dist/PushChordGrid.amxd")
REPRODUCIBLE_TIMESTAMP = 946684800
ROOT = Path(__file__).resolve().parents[1]
PUSH_ADAPTER_NAME = "push-grid-adapter.js"
PUSH_ADAPTER_SOURCE = ROOT / "src" / "max" / PUSH_ADAPTER_NAME


def _port(box_id: str, maxclass: str, x: int) -> dict:
    """Return an inlet/outlet box for the native Push bridge subpatcher."""
    return {
        "box": {
            "id": box_id,
            "maxclass": maxclass,
            "numinlets": 0 if maxclass == "inlet" else 1,
            "numoutlets": 1 if maxclass == "inlet" else 0,
            "patching_rect": [x, 20 if maxclass == "inlet" else 500, 25, 25],
        }
    }


def create_push_native_adapter() -> Subpatcher:
    """Build the native LOM bridge proven to enumerate Push 3 in Live."""
    patch = Subpatcher("push-native-adapter")
    patch.add_box(_port("discover-in", "inlet", 20))
    patch.add_box(_port("ownership-in", "inlet", 620))
    patch.add_box(_port("events-out", "outlet", 360))

    for box_id, text, x, y in (
        ("path-live-app", "path live_app", 20, 60),
        ("observe-surfaces", "property control_surfaces", 90, 140),
        ("get-surface-type", "gettype", 250, 260),
        ("get-button-matrix", "call get_control Button_Matrix", 250, 380),
        ("clear-surface", "push_surface id 0", 500, 180),
        ("clear-matrix", "matrix_id id 0", 500, 210),
        ("grab-matrix", "call grab_control", 620, 420),
        ("release-matrix", "call release_control", 745, 420),
    ):
        patch.add_box(message(box_id, text, patching_rect=[x, y, 150, 22]))

    for box_id, text, inlets, outlets, x, y in (
        ("live-app-path", "live.path", 1, 3, 20, 100),
        ("app-id-trigger", "t b l", 1, 2, 20, 140),
        ("surface-observer", "live.observer", 2, 2, 90, 180),
        ("surface-list-trigger", "t l b", 1, 2, 90, 220),
        ("surface-iterator", "zl iter 2", 2, 2, 90, 260),
        ("candidate-trigger", "t b l", 1, 2, 90, 300),
        ("candidate-store", "zl reg", 2, 2, 170, 340),
        ("surface-object", "live.object", 2, 1, 250, 300),
        ("surface-result-router", "route type get_control", 2, 3, 250, 340),
        ("push-type-select", "sel Push2 Push3", 3, 3, 90, 380),
        ("push-trigger", "t b l l", 1, 3, 90, 420),
        ("surface-event", "prepend push_surface", 1, 1, 360, 420),
        ("matrix-trigger", "t l l l", 1, 3, 250, 420),
        ("matrix-event", "prepend matrix_id", 1, 1, 360, 460),
        ("matrix-command-argument", "prepend set", 1, 1, 620, 460),
        ("matrix-command", "append", 1, 1, 745, 460),
        ("matrix-observer", "live.observer value", 2, 2, 500, 300),
        ("matrix-event-gate", "gate", 2, 1, 500, 340),
        ("matrix-value-event", "prepend matrix_event", 1, 1, 500, 380),
        ("ownership-select", "sel 1 0", 3, 3, 620, 340),
        ("defer-grab", "deferlow", 1, 1, 620, 380),
    ):
        patch.add_newobj(
            box_id,
            text,
            numinlets=inlets,
            numoutlets=outlets,
            patching_rect=[x, y, 150, 22],
        )

    edges = (
        ("discover-in", 0, "path-live-app", 0),
        ("path-live-app", 0, "live-app-path", 0),
        ("live-app-path", 0, "app-id-trigger", 0),
        ("app-id-trigger", 1, "surface-observer", 1),
        ("app-id-trigger", 0, "observe-surfaces", 0),
        ("observe-surfaces", 0, "surface-observer", 0),
        ("surface-observer", 0, "surface-list-trigger", 0),
        ("surface-list-trigger", 1, "clear-surface", 0),
        ("surface-list-trigger", 1, "clear-matrix", 0),
        ("clear-surface", 0, "events-out", 0),
        ("clear-matrix", 0, "events-out", 0),
        ("surface-list-trigger", 0, "surface-iterator", 0),
        ("surface-iterator", 0, "candidate-trigger", 0),
        ("candidate-trigger", 1, "surface-object", 1),
        ("candidate-trigger", 1, "candidate-store", 1),
        ("candidate-trigger", 0, "get-surface-type", 0),
        ("get-surface-type", 0, "surface-object", 0),
        ("surface-object", 0, "surface-result-router", 0),
        ("surface-result-router", 0, "push-type-select", 0),
        ("push-type-select", 0, "candidate-store", 0),
        ("push-type-select", 1, "candidate-store", 0),
        ("candidate-store", 0, "push-trigger", 0),
        ("push-trigger", 2, "surface-object", 1),
        ("push-trigger", 1, "surface-event", 0),
        ("surface-event", 0, "events-out", 0),
        ("push-trigger", 0, "get-button-matrix", 0),
        ("get-button-matrix", 0, "surface-object", 0),
        ("surface-result-router", 1, "matrix-trigger", 0),
        ("matrix-trigger", 2, "matrix-command-argument", 0),
        ("matrix-command-argument", 0, "matrix-command", 0),
        ("matrix-trigger", 1, "matrix-observer", 0),
        ("matrix-trigger", 0, "matrix-event", 0),
        ("matrix-event", 0, "events-out", 0),
        ("matrix-observer", 0, "matrix-event-gate", 1),
        ("matrix-event-gate", 0, "matrix-value-event", 0),
        ("matrix-value-event", 0, "events-out", 0),
        ("ownership-in", 0, "matrix-event-gate", 0),
        ("ownership-in", 0, "ownership-select", 0),
        ("ownership-select", 0, "defer-grab", 0),
        ("defer-grab", 0, "grab-matrix", 0),
        ("grab-matrix", 0, "matrix-command", 0),
        ("ownership-select", 1, "release-matrix", 0),
        ("release-matrix", 0, "matrix-command", 0),
        ("matrix-command", 0, "surface-object", 0),
    )
    for source, outlet, destination, inlet in edges:
        patch.add_line(source, outlet, destination, inlet)
    return patch


def create_device() -> MidiEffect:
    """Return the complete WP2 device graph."""
    device = MidiEffect(DEVICE_NAME, width=300, height=88)
    device.add_panel(
        "background",
        [0, 0, 300, 88],
        bgcolor=[0.10, 0.11, 0.13, 1.0],
        border=0,
    )
    base_octave = device.add_dial(
        "base-octave",
        "Base Octave",
        [12, 9, 78, 68],
        min_val=0,
        max_val=8,
        initial=3,
        steps=9,
        unitstyle=0,
        annotation_name="Base Octave",
        info="Stored base octave retained for the future musical engine.",
    )
    device.assign_parameter_bank(
        base_octave,
        bank=0,
        position=0,
        bank_name="Push Chord Grid",
    )
    device.add_newobj(
        "base-octave-store",
        "s ---pcg-base-octave",
        numinlets=1,
        numoutlets=0,
    )
    device.add_line(base_octave, 0, "base-octave-store", 0)
    device.add_dsp(*midi_thru("thru"))

    adapter_source = PUSH_ADAPTER_SOURCE.read_text(encoding="utf-8")
    device.add_support_file(PUSH_ADAPTER_NAME, adapter_source)
    device.add_newobj(
        "push-grid-adapter",
        f"js {PUSH_ADAPTER_NAME}",
        numinlets=1,
        numoutlets=3,
        patching_rect=[350, 170, 156, 22],
    )
    device.add_subpatcher(
        create_push_native_adapter(),
        "push-native-adapter",
        [620, 170, 150, 22],
        numinlets=2,
        numoutlets=1,
    )
    device.add_newobj(
        "device-lifecycle",
        "live.thisdevice",
        numinlets=1,
        numoutlets=3,
        outlettype=["bang", "int", "int"],
        patching_rect=[350, 20, 91, 22],
    )
    device.add_newobj(
        "prepend-initialized",
        "prepend initialized",
        numinlets=1,
        numoutlets=1,
        patching_rect=[350, 60, 113, 22],
    )
    device.add_newobj(
        "defer-initialized",
        "deferlow",
        numinlets=1,
        numoutlets=1,
        patching_rect=[350, 100, 54, 22],
    )
    device.add_newobj(
        "prepend-enabled",
        "prepend enabled",
        numinlets=1,
        numoutlets=1,
        patching_rect=[480, 60, 99, 22],
    )
    device.add_newobj(
        "defer-enabled",
        "deferlow",
        numinlets=1,
        numoutlets=1,
        patching_rect=[480, 100, 54, 22],
    )
    device.add_newobj(
        "prepend-pad-set",
        "prepend set",
        numinlets=1,
        numoutlets=1,
        patching_rect=[350, 215, 72, 22],
    )
    device.add_newobj(
        "prepend-status-set",
        "prepend set",
        numinlets=1,
        numoutlets=1,
        patching_rect=[480, 215, 72, 22],
    )
    device.add_comment(
        "last-pad-display",
        [105, 12, 183, 22],
        "Pad: --",
        presentation=1,
        presentation_rect=[105, 12, 183, 22],
        textcolor=[0.85, 0.88, 0.92, 1.0],
    )
    device.add_comment(
        "matrix-status-display",
        [105, 44, 183, 22],
        "Status: waiting for Live",
        presentation=1,
        presentation_rect=[105, 44, 183, 22],
        textcolor=[0.85, 0.88, 0.92, 1.0],
    )
    device.add_line("device-lifecycle", 0, "prepend-initialized", 0)
    device.add_line("prepend-initialized", 0, "defer-initialized", 0)
    device.add_line("defer-initialized", 0, "push-grid-adapter", 0)
    device.add_line("device-lifecycle", 0, "push-native-adapter", 0)
    device.add_line("device-lifecycle", 1, "prepend-enabled", 0)
    device.add_line("prepend-enabled", 0, "defer-enabled", 0)
    device.add_line("defer-enabled", 0, "push-grid-adapter", 0)
    device.add_line("push-grid-adapter", 0, "prepend-pad-set", 0)
    device.add_line("prepend-pad-set", 0, "last-pad-display", 0)
    device.add_line("push-grid-adapter", 1, "prepend-status-set", 0)
    device.add_line("prepend-status-set", 0, "matrix-status-display", 0)
    device.add_line("push-grid-adapter", 2, "push-native-adapter", 1)
    device.add_line("push-native-adapter", 0, "push-grid-adapter", 0)
    return device


def build_device(output: Path = DEFAULT_OUTPUT) -> Path:
    """Build a deterministic AMXD artifact at *output*."""
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    device = create_device()
    apply_validation_policy(device, "error")
    patcher = device.to_patcher()
    project = patcher["patcher"]["project"]
    project["creationdate"] = REPRODUCIBLE_TIMESTAMP
    project["modificationdate"] = REPRODUCIBLE_TIMESTAMP
    device_json = json.dumps(patcher, indent="\t").encode("utf-8") + b"\n\x00"
    dependencies = []
    for asset in device.assets():
        content = asset.content
        data = content if isinstance(content, bytes) else content.encode(asset.encoding)
        dependencies.append((asset.filename, data))
    output.write_bytes(
        assemble_frozen_amxd(
            MIDI_EFFECT,
            f"{DEVICE_NAME}.amxd",
            device_json,
            dependencies,
        )
    )
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = build_device(args.output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
