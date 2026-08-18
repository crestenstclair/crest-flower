# Changelog

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
