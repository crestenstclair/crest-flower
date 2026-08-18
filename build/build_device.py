#!/usr/bin/env python3
"""Generate the WP1 Push Chord Grid Max for Live MIDI Effect."""

from __future__ import annotations

import argparse
from pathlib import Path

from m4l_builder import MidiEffect
from m4l_builder.amxd import apply_validation_policy
from m4l_builder.constants import MIDI_EFFECT
from m4l_builder.container import build_amxd
from m4l_builder.dsp import midi_thru

DEVICE_NAME = "Push Chord Grid"
DEFAULT_OUTPUT = Path("dist/PushChordGrid.amxd")
REPRODUCIBLE_TIMESTAMP = 946684800


def create_device() -> MidiEffect:
    """Return the complete WP1 device graph."""
    device = MidiEffect(DEVICE_NAME, width=100, height=88)
    device.add_panel(
        "background",
        [0, 0, 100, 88],
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
        info="Stored parameter used only to validate the generated-device path in WP1.",
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
    output.write_bytes(build_amxd(patcher, MIDI_EFFECT))
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
