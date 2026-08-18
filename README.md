# Push Chord Grid

Push Chord Grid is a generated Max for Live MIDI Effect targeting Ableton Live 12 and
Push 3 Standalone. WP1 and WP2 are accepted. The WP2 build dynamically discovers Push,
owns its 8×8 pad matrix only while this device's track is selected, and reports every
pad as an A1–H8 coordinate.

WP2 does not generate chords or notes. Incoming track MIDI still passes through
unchanged, while grabbed Push pad events are shown on the device face for the hardware
gate. Push Standalone testing remains deferred to WP6 by user decision.

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

Outputs:

- `dist/PushChordGrid.amxd` — self-contained WP2 matrix-spike device
- `dist/manifest.json` — deterministic artifact metadata and checksum
- `dist/PushChordGrid-WP2.zip` — ready-to-test bundle

## WP2 hardware test

1. In Live 12 with Push in Control Mode, load the device and select its track. Expect
   `Status: matrix acquired` on the device.
2. Press the four physical corner pads. Expect bottom-left A1, bottom-right H1,
   top-left A8, and top-right H8; releases report velocity 0.
3. Complete the focus, disable/re-enable, and Set-reload checks in
   `docs/HARDWARE_TESTS.md`.

Record the exact result in `docs/HARDWARE_TESTS.md`. Do not edit the device in Max.

## Status

WP2 was accepted on 2026-08-17. Its automated gate covers all 64 coordinate mappings,
ownership-state logic, container and patch graph, embedded JavaScript completeness,
forbidden-object policy, manifest checksum, and byte-for-byte reproducibility. The
connected Push 3 hardware gate confirmed A1, H1, A8, and H8 plus lifecycle reacquisition.
