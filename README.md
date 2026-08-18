# Push Chord Grid

Push Chord Grid is a generated Max for Live MIDI Effect targeting Ableton Live 12 and
Push 3 Standalone. WP1 is accepted: the repository builds a minimal raw-MIDI
passthrough device with one stored parameter, and both Live acceptance checks passed.

Chord behavior is intentionally not implemented yet. WP2 begins only on a new user
request. Push Standalone testing is deferred by user decision so the user does not have
to switch repeatedly between modes.

## Build

Requirements: Python 3.11+, Git, and network access for the one-time bootstrap.

```bash
make bootstrap
make test
make build
make validate
make package
```

Outputs:

- `dist/PushChordGrid.amxd` — WP1 load-test device
- `dist/manifest.json` — deterministic artifact metadata and checksum
- `dist/PushChordGrid-WP1.zip` — ready-to-test bundle

## Three-step load test

1. In Live 12, put an instrument after `PushChordGrid.amxd` on a MIDI track and play
   notes. Expect unchanged pitch, velocity, channel, and other MIDI data.
2. Change **Base Octave**, save the Set, close it, and reopen it. Expect the value to
   be restored; it does not alter MIDI in this smoke build.
3. Push Standalone testing is deferred. Preserve compatibility, but do not require a
   mode switch for this infrastructure gate.

Record the exact result in `docs/HARDWARE_TESTS.md`. Do not edit the device in Max.

## Status

Automated validation proves the container type, passthrough graph, parameter storage,
forbidden-object policy, empty dependency cache, manifest checksum, and reproducible
generation. Live loading and MIDI passthrough remain human acceptance checks;
standalone testing is deferred.
