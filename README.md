# Push Chord Grid

Push Chord Grid is a generated Max for Live MIDI Effect for Ableton Live 12 and Push
3. The v0.5.2 release candidate hardens the accepted musical surface for ordinary
Live use while preserving Push 3 Standalone compatibility for the deferred WP6 gate.

The lower four rows are four octave-spaced chord keyboards. A–H play scale degrees
1–8, and Live's current root and scale determine each chord automatically. The upper
controls provide momentary Dim/Min/Maj/Sus quality, additive 6/m7/M7/9 extensions,
manual or nearest inversion, and an optional root bass. Physical pad velocity drives
every newly sounding chord voice. Strum and Arp intentionally remain downstream
Ableton MIDI-device jobs.

Push's first device bank shows **Base Octave** and a device-owned **Playing**
value. Playing identifies the newest held chord with its resolved quality and complete
6/m7/M7/9 stack, falls back to the previous chord during overlapping holds, and
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
- `dist/PushChordGrid-v0.5.2-RC.zip` — deterministic release-candidate bundle
- `dist/PushChordGrid-v0.5.2-RC.zip.sha256` — bundle checksum

The bundle includes the reviewed two-track Live Set from
`release/PushChordGrid-v0.5.2-RC Project/PushChordGrid-v0.5.2-RC.als`: one Push Chord
Grid source followed by MIDI Monitor and Live's Arpeggiator, plus one armed,
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
intact. The v0.5.2 AMXD keeps that exact two-parameter inventory, so no obsolete hold
setting is saved in the release Set.

Only the irreducible physical 30-minute Push performance observation remains pending
on the WP5 hardware card. Push 3 Standalone transfer and cold-boot acceptance remain
WP6 and have not begun.
