## Why

Fixed chord inversions make otherwise correct diatonic progressions jump unnecessarily between registers, while the current single-line status does not expose enough detail to explain the generated result. The approved P1 follow-up should make progressions smoother and make every emitted chord legible before Live hardening begins.

## What Changes

- Turn reserved pad D7 into a persistent Nearest Voice Leading toggle for future chord presses.
- When enabled, choose the octave-equivalent chord inversion with the smallest deterministic movement from the previously triggered chord; preserve manual Voice −/0/+ as the baseline register control.
- Keep sounding chord owners as immutable note snapshots, including overlapping/shared-pitch release behavior.
- Reset voice-leading history on mode changes, manual voicing changes, scale/base-octave changes, and lifecycle loss so stale context cannot affect a later performance.
- Show the last chord name, applied quality/extensions, inversion or voice-leading state, and emitted MIDI note names/pitches on the device face.
- Give D7 a documented silent control role and ownership-aware LED state; it never emits a musical trigger.
- Normalize LiveAPI's array-wrapped post-load scale callbacks and expose the detected Live scale on the current-state line.

## Capabilities

### New Capabilities

- `nearest-voice-leading`: Persistent D7 mode, deterministic inversion selection, history invalidation, ownership safety, and LED/control semantics.
- `chord-feedback`: Accurate device-face feedback for the last generated chord and its emitted pitch snapshot.

### Modified Capabilities

None.

## Impact

The deterministic harmony/state core, Live scale adapter, runtime adapter, generated Max device graph, coordinate documentation, automated golden/integration tests, usage guide, hardware acceptance card, version/changelog/manifest, and packaged WP4 artifact are affected. Runtime dependencies and the Push 3 Standalone compatibility boundary remain unchanged.
