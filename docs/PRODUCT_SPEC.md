# Product specification

The complete product contract is maintained in
[`Push-Chord-Grid-Project-Plan.md`](../Push-Chord-Grid-Project-Plan.md). This file
records the currently implemented slice so future work cannot accidentally cross the
hardware gate.

## Current slice: WP3

The pure musical engine is implemented and tested independently of Push. It provides:

- Major, Minor, Diminished, and Sus radio selection plus independent 7/add9 toggles;
- scale-degree chord roots with degree 8 fixed at tonic +12;
- three rows of scale notes whose row starts are separated by diatonic fourths;
- exact input-velocity propagation;
- held-pad pitch snapshots and shared-pitch reference counting; and
- exact release plus CC123 flushing for panic and every ownership-loss lifecycle.

Golden vectors cover C major, E natural minor, and D Dorian. The test command enforces
100% line, branch, and function coverage for the deterministic core.

## Current artifact: WP2

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

The adapter maintains a normalized 8×8 velocity state. Its output still stops at the
status display: WP4, not WP3, will embed and connect the pure engine to MIDI output.

## WP2 exit criterion

WP2 exits only when the supplied artifact:

1. reports the four corner pads as A1, H1, A8, and H8;
2. releases and reacquires on track focus changes and device disable/re-enable;
3. reacquires after Set reload without manual Reset; and
4. continues passing incoming track MIDI unchanged.

WP1 and WP2 were accepted on 2026-08-17. The connected Push 3 hardware gate confirmed
the four corner coordinates and lifecycle reacquisition. Push Standalone validation
remains deferred to WP6.

## WP3 exit criterion

WP3 was accepted on 2026-08-17 with all specified musical behavior represented by
exact vectors and complete deterministic-core branch coverage. It has no Push or Live
hardware gate. WP4 requires a separate implementation request.
