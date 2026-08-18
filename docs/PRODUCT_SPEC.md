# Product specification

The complete product contract is maintained in
[`Push-Chord-Grid-Project-Plan.md`](../Push-Chord-Grid-Project-Plan.md). This file
records the currently implemented slice so future work cannot accidentally cross the
hardware gate.

## Current slice: WP2

The generated artifact is a Max for Live MIDI Effect with:

- raw MIDI passthrough from `midiin` to `midiout`;
- one stored integer parameter named **Base Octave**, defaulting to 3;
- a Push parameter-bank entry for **Base Octave**;
- dynamic discovery of the active Push-family control surface by its public
  `Button_Matrix` capability;
- automatic `Button_Matrix` ownership only while the device is enabled and its track
  is selected;
- clean release on deselection, disable, deletion, or Set close;
- delayed acquire plus a one-second watchdog for reconnect and Set reload;
- physical matrix normalization where bottom-left is A1 and top-right is H8;
- visible last-pad and lifecycle status on the device face;
- no musical transformation.

The adapter maintains a normalized 8×8 velocity state. Its output stops at the status
display in WP2; the musical engine begins in WP3.

## Exit criterion

WP2 exits only when the supplied artifact:

1. reports the four corner pads as A1, H1, A8, and H8;
2. releases and reacquires on track focus changes and device disable/re-enable;
3. reacquires after Set reload without manual Reset; and
4. continues passing incoming track MIDI unchanged.

WP1 and WP2 were accepted on 2026-08-17. The connected Push 3 hardware gate confirmed
the four corner coordinates and lifecycle reacquisition. Push Standalone validation
remains deferred to WP6.
