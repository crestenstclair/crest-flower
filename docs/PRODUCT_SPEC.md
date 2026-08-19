# Product specification

The complete product contract is maintained in
[`Push-Chord-Grid-Project-Plan.md`](../Push-Chord-Grid-Project-Plan.md). This file
records the currently implemented slice so future work cannot accidentally cross the
hardware gate.

## Current slice: WP5 v0.5.1 release candidate

The proven matrix adapter and pure musical engine are now integrated. The generated
device provides:

- four octave-spaced chord rows, each mapping A–H to degrees 1–8;
- automatic chord quality from the active Live root and scale;
- momentary Dim/Min/Maj/Sus quality overrides;
- independent momentary 6/m7/M7/9 extensions;
- persistent chord voicing and optional root bass with an independent register;
- persistent D7 Nearest mode with bass-independent deterministic inversion scoring;
- exact last-chord identity, inversion, extension, and emitted-pitch feedback;
- visible detected Live root/scale feedback on the current-state line;
- a Push-native `Playing` value for the newest held exact chord snapshot;
- exact input-velocity propagation;
- held-pad pitch snapshots and shared-pitch reference counting;
- exact release plus CC123 flushing for panic and every ownership-loss lifecycle;
- observation of Live's root note, scale intervals, scale name, and scale mode;
- native generated MIDI formatting alongside unchanged external MIDI passthrough; and
- ownership-aware, diff-based Push lighting for controls, chords, and holds.

Golden vectors cover C major, A natural minor, and D Dorian. The test command enforces
100% line, branch, and function coverage for the deterministic core.

Strum and Arp are explicitly outside the device. Any strumming, arpeggiation, rhythmic
patterning, probability, or humanization belongs in downstream Ableton MIDI devices.
Other timed Orchid-style transforms are not proposed unless that Live-native chain
reveals a concrete missing capability. The current harmonic proposals are documented
separately from implemented behavior in [`USAGE_GUIDE.html`](USAGE_GUIDE.html).

WP5 additionally guarantees that duplicate device instances are arbitrated by selected
track and visible device order. Exactly one eligible instance owns the matrix and
generates grid music; standby copies retain isolated musical state and emit neither
matrix LEDs nor grid triggers. Ownership transfer flushes the outgoing instance before
the incoming instance acquires, and stale registrations expire after three seconds.

## Current artifact: WP5

The generated artifact is a Max for Live MIDI Effect with:

- raw MIDI passthrough from `midiin` to `midiout`;
- one stored integer parameter named **Base Octave**, defaulting to 3;
- one inactive, non-mappable enumerated **Playing** display, defaulting to `--`;
- first-bank Push entries for **Base Octave** and **Playing**;
- a momentary **Reload Grid** button for safe manual release, rediscovery,
  reacquisition, and repaint;
- dynamic discovery of the active Push-family control surface by its public
  `Button_Matrix` capability;
- automatic `Button_Matrix` ownership only while the device is enabled and its track
  is selected;
- clean release on deselection, disable, deletion, or Set close;
- delayed acquire, automatic rediscovery after re-enable, and a one-second watchdog
  for focus and Set reload;
- physical matrix normalization where bottom-left is A1 and top-right is H8;
- visible last-pad, lifecycle, current-selection, and last-chord status on the device face;
- 16 silent harmonic/voicing/nearest/bass controls, 16 silent reserved pads, and 32 chord pads
  with exactly one documented role per coordinate;
- a complete LED repaint after acquisition, changed-pad updates during use, and an LED
  clear before matrix release; and
- generated MIDI routed to the device output for downstream instruments and recording.

The adapter maintains a normalized 8×8 velocity state. Control and reserved events are
consumed, while musical events enter the snapshot/reference-count engine.

For chord ranks 1–4, the adapter correlates Push's physical pad note range `36–67`
with the deferred `Button_Matrix` coordinate callback. The raw note velocity replaces
a fixed matrix press value when both describe the same press; otherwise the matrix
value remains the fallback. That exact velocity is applied to every newly sounding
note in the generated chord. The raw external-MIDI path remains unchanged.

## Accepted prerequisites

WP2 exits only when the supplied artifact:

1. reports the four corner pads as A1, H1, A8, and H8;
2. releases and reacquires on track focus changes and device disable/re-enable;
3. reacquires after Set reload without manual Reset; and
4. continues passing incoming track MIDI unchanged.

WP1 and WP2 were accepted on 2026-08-17. The connected Push 3 hardware gate confirmed
the four corner coordinates and lifecycle reacquisition. Push Standalone validation
remains deferred to WP6.

## WP5 exit criterion

WP3 was accepted on 2026-08-17 with all specified musical behavior represented by
exact vectors and complete deterministic-core branch coverage. WP4's automated gate
passes when tests, build, artifact validation, dependency scan, and packaging all pass.
WP4's seven-section hardware card was accepted on 2026-08-17 when the user confirmed
the integrated controls, musical pads, recording, focus behavior, and overlapping
holds work great. Version 0.4.1 added LEDs; version 0.4.2 replaces the split note/chord
area with four automatic diatonic chord octaves. Version 0.4.3 adds Orchid-inspired
quality, extension, inversion, and bass behavior. Version 0.4.4 corrects physical
chord-pad velocity propagation. Version 0.4.5 adds automatic re-enable rediscovery and
manual Reload Grid recovery.
Version 0.4.6 assigns D7 to Nearest voice leading and adds exact emitted-snapshot
feedback.
Version 0.4.7 corrects array-wrapped Live scale observer updates and makes the detected
scale visible.

WP5 automated, dependency, duplicate-instance, routing, recording, cleanup, and Live
restart/reload gates pass for v0.5.0 RC. Version 0.5.1 adds the exact active-chord Push
display without changing that accepted ownership or musical behavior. The reviewed Set contains one Push Chord Grid
source followed by MIDI Monitor and Live's Arpeggiator, plus one armed Monitor-In
Drift destination fed from Post FX. A deterministic
30-minute-equivalent regression produces more than 10,000 exactly matched note events.
Only the physical 30-minute Push performance observation remains pending. WP6
Standalone transfer and acceptance have not begun.
