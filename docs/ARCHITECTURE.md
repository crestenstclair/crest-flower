# Architecture

## Why Max for Live

The runtime target is a real-time MIDI effect hosted before an Ableton instrument on
both Live 12 and Push 3 Standalone. Push Standalone does not host VST/AU devices, and a
Live 12 MIDI Tool transforms clip data rather than the live performance stream. The
runtime artifact is therefore a Max for Live MIDI Effect (`mmmm` AMXD type).

## Why generated source

The patch is generated from Python so its complete object graph is reviewable,
testable, reproducible, and maintainable by an agent. Max is a runtime inspector and a
possible final freeze fallback, not the source of truth.

The initial generator is `m4l-builder` 0.8.0 pinned to commit
`6c602b2861bf628d14fd39854d984b12de3cebff`. It can emit the AMXD binary container,
native objects, patchlines, stored Live parameters, and Push parameter-bank metadata.
Because the dependency identifies itself as alpha software, successful loading in Live
is a mandatory infrastructure gate before further product work. Push Standalone testing
is deferred by user decision while standalone compatibility remains a constraint.

The generator normalizes Max project creation/modification timestamps to a fixed value.
This removes host-irrelevant wall-clock metadata so independent builds produce the same
AMXD bytes and checksum.

## WP2 graph

```text
midiin ───────────────▶ midiout

Base Octave ──────────▶ private Max send (stored value sink only)

live.thisdevice ──▶ native Push bridge ──▶ push-grid-adapter.js
       │              │       ▲                    │       │
       │              │       └── own/release ─────┘       │
       └──▶ initialized/enabled + selected-track observer   │
                                                            ▼
                                     last-pad and lifecycle displays
```

The parameter's private send prevents an orphaned-control warning but is not connected
to the MIDI path. Raw MIDI byte passthrough is used instead of `notein`/`noteout`, so the smoke test does
not intentionally discard controller, pressure, pitch-bend, program, clock, or SysEx
messages.

The generated native bridge follows Live's public LOM message flow:
`path live_app` → `property control_surfaces` → `zl iter 2` → `live.object gettype`.
It selects `Push2` or `Push3`, resolves `Button_Matrix` with `call get_control`, and
observes the matrix through `live.observer value`. Live assigns control-surface and
control objects valid nonzero IDs that may be negative; the connected Push 3 was `-2`
and its matrix was `-12`. Treating those IDs as positive-only was the discovery defect
found during hardware integration.

JavaScript compares `this_device canonical_parent` with
`live_set.view.selected_track`; only the enabled instance on that track opens the native
event gate and requests `call grab_control id <matrix-id>` on the Push surface object.
Deselection and disable close the gate and call `release_control id <matrix-id>` on that
same surface immediately. The native observer refreshes discovery on surface-list
changes, and a one-second selected-track watchdog recovers after reload.

Push matrix callbacks have the shape `value velocity x y ...`. Push's physical row 7
is the bottom row, so chess rank is `8 - y`; file is `A + x`. The adapter stores the
latest velocity in `GridState[x][y]`. WP2 sends normalized events only to the device
display and does not emit MIDI or LED updates.

The JavaScript is embedded in a reproducibly frozen AMXD. The dependency cache declares
the script, the frozen footer contains exactly that script, and the manifest reports no
unembedded runtime dependency.

## Future runtime boundaries

The implemented runtime boundary now includes Push discovery/grid ownership, focus
management, coordinate normalization, and the WP3 deterministic musical engine. Live
scale observation, grid-to-engine wiring, and generated MIDI remain WP4 work. Runtime
dependencies remain limited to native Max, Max `js`, and the public Live Object Model.

## WP3 deterministic core

The pure ES5-compatible core has four boundaries:

```text
Live scale snapshot ─▶ harmony/state ─▶ chord or single-note pitch snapshot
                                             │
physical pad owner + velocity ───────────────▼
                                      active-note manager ─▶ plain MIDI events
                                             ▲
focus loss / disable / delete / Set close ───┘
```

`harmony.js` treats `scale_intervals` as root-relative, strictly increasing values
whose first degree is `0`, matching the Live Object Model. Scale positions advance
cyclically for layouts and short scales, while degree 8 is special-cased to tonic +12.
Base Octave follows Live's note labels, so C3 is MIDI 60.

`state.js` owns only future-trigger state: one of four qualities and independent 7/add9
toggles. A held pad's pitch array is copied into `active-notes.js`; later quality or
scale changes therefore cannot change its release. Each pitch is emitted on the first
owner transition from zero to one and released on the last transition from one to zero.
A repeated press from the same owner releases its old snapshot before taking the new
one. All loss-of-ownership lifecycle events emit the exact remaining note-offs in
ascending pitch order, then CC123 All Notes Off, and clear all ownership state.
