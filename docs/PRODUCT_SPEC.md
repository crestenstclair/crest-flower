# Product specification

The complete product contract is maintained in
[`Push-Chord-Grid-Project-Plan.md`](../Push-Chord-Grid-Project-Plan.md). This file
records the currently implemented slice so future work cannot accidentally cross the
hardware gate.

## Current slice: WP0 and WP1

The generated artifact is a Max for Live MIDI Effect with:

- raw MIDI passthrough from `midiin` to `midiout`;
- one stored integer parameter named **Base Octave**, defaulting to 3;
- a Push parameter-bank entry for **Base Octave**;
- no Push matrix ownership and no musical transformation.

The parameter is deliberately inert during WP1. Its purpose is to prove that generated
parameter metadata loads, displays, stores, and restores correctly.

## Exit criterion

WP1 exits only when the supplied artifact:

1. loads in Live 12 without a missing-object error;
2. passes incoming MIDI unchanged; and
3. restores the stored parameter after Set reload.

The stored-parameter check passed in Live on 2026-08-17. Push Standalone validation is
deferred by user decision to avoid repeated mode switching; standalone compatibility
remains a release constraint.

WP1 was accepted on 2026-08-17 after the generated device loaded in Live, the test clip
produced MIDI activity and a `-7.91 dB` instrument-track peak through the passthrough,
and **Base Octave** persisted at `5` after Set reload.
