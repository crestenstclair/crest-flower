# Push Chord Grid

Push Chord Grid is a generated Max for Live MIDI Effect for Ableton Live 12 and Push
3. The v0.6.0 release candidate adds the Secret Chord layer to the accepted musical surface for ordinary
Live use while preserving Push 3 Standalone compatibility for the deferred WP6 gate.

The lower four rows are four octave-spaced chord keyboards. A–H play scale degrees
1–8, and Live's current root and scale determine each chord automatically. The upper
controls provide momentary Major/Minor/Dim/Sus and Augmented/Power/Quartal/Dominant qualities,
contextual 6/7/9 extensions,
manual or nearest inversion, and an optional root bass. Physical pad velocity drives
every newly sounding chord voice. Strum and Arp intentionally remain downstream
Ableton MIDI-device jobs.

Push's first device bank shows **Base Octave** and a device-owned **Playing**
value. Playing identifies the newest held chord with its resolved quality and complete
6/7/9 stack with the resolved d7/m7/M7 identity, falls back to the previous chord during overlapping holds, and
returns to `--` after the final release or lifecycle cleanup. Quality and extension
changes always transform sounding chords atomically; there is no Hold Mode and
retained/shared pitches do not retrigger.

Held pads retain exact pitch snapshots, shared pitches are reference-counted, and
focus/disable/reload/deletion/Set-close lifecycles release every active note plus
CC123. LEDs show all playable/control roles, active state, and held chords; reserved
pads stay dark. **Reload Grid** safely reacquires and repaints after a hardware or
control-surface cycle.

WP5 adds deterministic duplicate-instance arbitration. Only the first eligible Push
Chord Grid device in the selected track's device order owns the matrix and generates
grid music; other copies report `Status: duplicate standby`. Reordering, disabling,
deleting, or changing focus transfers ownership only after the outgoing instance
flushes notes, clears LEDs, and releases its lease.

## Download and install

Use the generated [PushChordGrid.amxd](dist/PushChordGrid.amxd) or
[release bundle](dist/PushChordGrid-v0.6.0-RC.zip), then drag the device onto a MIDI track in Ableton Live 12. Put an instrument after the device
or route the track's Post-FX MIDI to an instrument track, select the source track, and
play from Push's Session grid. The release ZIP also includes the prepared Live Set,
offline usage guide, hardware acceptance card, manifest, changelog, and checksums.

This release changes muscle memory: A8–D8 are Major/Minor/Dim/Sus; A7–D7 are
Augmented/Power/Quartal/Dominant; Voice −/0/+ and Nearest move to A6–D6. E8/F8/H8
are 6/7/9 and G8 is reserved. The 7 modifier uses the press-time scale seventh in
Auto, +11 for Major/Augmented, +9 for Diminished, and +10 for other manual qualities.
Quartal/Dominant already include +10, so 7 changes feedback without extra MIDI.

This is a release candidate. Consult the [acceptance card](docs/HARDWARE_TESTS.md)
for current evidence and remaining physical observations. Push 3 Standalone transfer
and cold-boot acceptance remain deferred to WP6.

## Build

Requirements: Python 3.11+, Node 23.11.0, Git, and network access for the one-time
bootstrap.

```bash
make bootstrap
make test
make build
make validate
make package
```

Generated outputs:

- `dist/PushChordGrid.amxd` — self-contained WP5 MIDI effect
- `dist/manifest.json` — artifact and release-Set metadata, hashes, and dependency closure
- `dist/PushChordGrid.amxd.sha256` — install-artifact checksum
- `dist/PushChordGrid-v0.6.0-RC.zip` — deterministic release-candidate bundle
- `dist/PushChordGrid-v0.6.0-RC.zip.sha256` — bundle checksum

The bundle includes the two-track Live Set saved and reopened in Live 12.4.7 from
`release/PushChordGrid-v0.6.0-RC Project/PushChordGrid-v0.6.0-RC.als`: one Push Chord
Grid source followed by MIDI Monitor and a bypassed Arpeggiator, plus one armed,
Monitor-In Drift destination receiving Post-FX MIDI. It
also includes the offline [usage guide](docs/USAGE_GUIDE.html), exact
[hardware card](docs/HARDWARE_TESTS.md), [Orchid adaptation](docs/ORCHID_ADAPTATION.md),
manifest, README, and changelog.

## Release-candidate evidence

Automated tests cover all 64 coordinate roles, silent controls/reserved pads, exact
golden MIDI vectors, scale changes, velocity, overlapping snapshots, lifecycle
flushes, multi-instance isolation, duplicate arbitration, and a deterministic
30-minute-equivalent sequence with more than 10,000 matched events. Display vectors
cover every enum value, extensions, retriggers, overlap fallback, and lifecycle blanking.
Live-hold vectors cover manual-to-auto restoration, 9ths, per-owner velocity, atomic
shared-pitch transfer, retrigger, Nearest history, and lifecycle cleanup. The deterministic
core retains 100% line, branch, and function coverage. Static validation enforces the
exact generated graph, read-only Push bank, frozen runtime inventory, no undeclared dependency, and
byte-for-byte build/package reproducibility.

The inherited Live 12.4.3 evidence covers duplicate/reorder/disable/focus ownership transfer, C
Major → A Minor scale propagation, stock Drift and temporary External Instrument
routing, exact Session and Arrangement Post-FX recordings, cleanup, and a full Live
quit/reopen of the clean Set. It reopened at C Minor, Base Octave 2, with one matrix
owner, the `Playing` parameter, the downstream MIDI devices, and the Drift route
intact. The v0.6.0 AMXD keeps the two-parameter inventory but expands Playing to 3,121 labels, so no obsolete hold
setting is saved in the release Set.

The v0.6.0 hardware card separately records new Live checks and remaining physical
quality/extension/voicing observations, plus the outstanding 30-minute session. Push 3 Standalone transfer and cold-boot acceptance remain
WP6 and have not begun.
