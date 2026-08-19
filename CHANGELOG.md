# Changelog

## 0.5.2 — 2026-08-18

- Remove the legacy immutable hold path and expose no Hold Mode setting.
- Atomically retarget every held chord on actual Dim/Min/Maj/Sus and
  6/m7/M7/9 edges while preserving press-time auto harmony, voicing/Nearest, bass, and
  strike velocity.
- Emit only the complete global pitch-count difference, so retained and transferred
  shared notes never retrigger and a newly shared pitch sounds once.
- Keep Live scale, Base Octave, Voice, Nearest, and bass changes future-trigger-only.
- Synchronize Playing, Last, Nearest history, exact release, overlaps, retrigger, and
  every lifecycle cleanup with the committed sounding owner snapshots.
- Extend golden runtime/core vectors, static AMXD checks, documentation, hardware
  checklist, deterministic package, manifest, and checksums for v0.5.2 RC.

## 0.5.1 — 2026-08-18

- Add a device-owned **Playing** enum to Push bank slot 2, beside **Base Octave**.
- Show the exact newest held chord root, resolved quality, and complete 6/m7/M7/9
  extension stack; releasing an overlap reveals the previous immutable snapshot.
- Blank the Push value after the final release and every focus, disable, reload,
  deletion, Set-close, panic, or duplicate-lease cleanup path.
- Keep the display inactive, non-mappable, and disconnected from the musical graph;
  use only generated Max-native objects and the public Live parameter bank.
- Add exhaustive enum, overlap, retrigger, held-change, lifecycle, static AMXD, bank,
  manifest, documentation, and reproducibility checks.
- Ship the updated v0.5.1 RC device, clean Live Set, usage guide, hardware card,
  manifest, ZIP, and SHA-256 sidecars.

## 0.5.0 — 2026-08-18

- Add a Max-native, device-order-aware matrix lease so duplicate devices cannot both
  own the Push grid or emit grid-generated music.
- Transfer ownership in two phases: flush active notes, clear LEDs, release the native
  matrix, clear the lease, then let the next eligible instance acquire and repaint.
- Expire stale registrations after three seconds and reconcile through a deferred
  named Max bus. Live testing exposed and fixed an initial nested-`Global` registry
  incompatibility and synchronous-broadcast stack overflow.
- Add duplicate order, stale-owner, per-instance state/velocity/LED, held scale-change,
  and deterministic 30-minute-equivalent regressions. The suite now has 57 JavaScript
  and 16 Python tests with 100% deterministic-core line/branch/function coverage.
- Validate stock Drift and temporary External Instrument routes plus exact C–E♭–G
  Session and Arrangement Post-FX recordings in Live 12.4.3.
- Ship a clean two-track C Minor, Base Octave 2 release Set that reacquires the matrix
  after a complete Live quit/reopen.
- Add a deterministic v0.5.0 RC bundle, exact inventory tests, release-Set manifest
  metadata, and SHA-256 sidecars for the AMXD and ZIP.
- Leave only the physical 30-minute Push observation pending; Standalone remains WP6.

## 0.4.7 — 2026-08-18

- Normalize LiveAPI's array-wrapped observer callbacks so root, interval, name, and
  mode changes reach the musical engine after initial device load.
- Show the detected Live scale on the current-state line for immediate confirmation.
- Add a production-shape C Minor observer regression test while preserving all v0.4.6
  musical, ownership, recovery, feedback, and Standalone behavior.

## 0.4.6 — 2026-08-18

- Assign D7 to persistent, MIDI-silent Nearest voice leading.
- Choose deterministic inversions with bass-independent symmetric nearest-tone scoring.
- Reset prior-chord history at every declared musical/lifecycle boundary without
  mutating active owner snapshots.
- Add separate current-state and exact last-chord feedback lines.
- Preserve all v0.4.5 velocity, LED, recovery, ownership, passthrough, and Standalone
  compatibility behavior.

## 0.4.5 — 2026-08-18

- Rediscover and reacquire the Push matrix after device re-enable.
- Add a safe manual Reload Grid control for hardware/control-surface cycling.

## 0.4.4 — 2026-08-18

- Propagate physical Push chord-pad velocity to every generated note.

## 0.4.3 — 2026-08-17

- Add Orchid-inspired quality, extension, manual voicing, and bass controls.

## 0.4.2 — 2026-08-17

- Make ranks 1–4 four octave-spaced, automatically diatonic chord rows.

## 0.4.1 — 2026-08-17

- Add complete ownership-aware Push LED rendering.

## 0.4.0 — 2026-08-17

- Integrate the proven Push matrix adapter and deterministic chord engine.
