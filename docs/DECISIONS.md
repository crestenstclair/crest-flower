# Decisions

## 2026-08-17 — generated M4L target

- **Decision:** Build a Max for Live MIDI Effect from text source.
- **Reason:** It is the supported real-time MIDI-effect format shared by Live 12 and
  Push 3 Standalone; manual patching would defeat reproducible agent ownership.
- **Rejected:** VST/AU/JUCE, Live MIDI Tools, Remote Scripts, User Mode, and a manually
  maintained Max canvas.

## 2026-08-17 — pin m4l-builder for the infrastructure spike

- **Decision:** Pin m4l-builder commit
  `6c602b2861bf628d14fd39854d984b12de3cebff` (declared version 0.8.0).
- **Evidence:** The revision has a native MIDI-effect type, raw `midiin` → `midiout`
  recipe, stored parameter generation, Push parameter-bank metadata, AMXD parsing, and
  build linting.
- **Risk:** The project declares alpha maturity and a generated container still needs
  validation in the actual hosts.
- **Fallback:** Deterministic direct `.maxpat`/`.amxd` JSON generation, still owned by
  repository text sources.

## 2026-08-17 — WP1 blocks musical implementation

- **Decision:** Do not implement chord or Push matrix behavior until the generated
  passthrough loads successfully in Live.
- **Gate state:** Accepted. The generated device loaded in Live, the MIDI test clip
  passed through to Drift with a measured `-7.91 dB` track peak, and stored parameter
  persistence passed.

## 2026-08-17 — defer repeated Push Standalone testing

- **Decision:** Do not require switching Push between Control Mode and Standalone for
  the WP1 infrastructure gate or on every subsequent work package.
- **Reason:** The mode-switching workflow is disruptive for the user.
- **Result:** The stored **Base Octave** parameter has been confirmed to persist as `5`
  after saving and reopening the Live Set. Live load and passthrough evidence are used
  for the current gate; standalone compatibility remains a design and release
  constraint, with a consolidated standalone test deferred until explicitly requested.

## 2026-08-17 — WP2 matrix adapter boundary

- **Decision:** WP2 owns and normalizes `Button_Matrix`, but produces no musical MIDI
  and performs no LED writes.
- **Reason:** This isolates Push discovery, focus, ownership, and coordinate orientation
  from the deterministic musical engine planned for WP3.
- **Coordinate contract:** the callback's x value maps left-to-right to A–H; Push
  physical row 7 is the bottom row and maps to rank 1, while row 0 maps to rank 8.
- **Discovery:** use native Max LOM objects to observe `live_app.control_surfaces`,
  iterate each `id` pair, call `gettype`, select `Push2`/`Push3`, and resolve
  `Button_Matrix` with `get_control`. This mirrors a working local Push-aware device and
  works for Push 3 even though it does not appear in Live's Preferences table. Control
  surface IDs are valid when nonzero; Live reported the connected Push and matrix as
  negative IDs (`-2` and `-12`).
- **Lifecycle:** compare the device's canonical parent track to the selected track;
  release immediately on deselection/disable/deletion, delay acquisition briefly, and
  use a one-second watchdog for reconnect and reload. Observe the public Device LOM
  `is_active` property so saved-Set reload and device activator changes share the same
  lifecycle path.

## 2026-08-17 — reproducibly freeze the WP2 runtime script

- **Decision:** Embed `push-grid-adapter.js` into the generated AMXD using the pinned
  builder's deterministic frozen-container implementation.
- **Reason:** A loose JavaScript sidecar would make the user-facing artifact incomplete
  and would violate the manifest/reproducibility discipline.
- **Validation:** the dependency cache and frozen footer must contain exactly the same
  declared script; the release manifest reports embedded files separately from external
  runtime dependencies.

## 2026-08-17 — WP2 gate state

- **Automated gate:** Passing. All 64 mappings, ownership predicates, generated graph,
  embedded asset, forbidden dependencies, manifest, and reproducibility are covered.
- **Hardware gate:** Accepted on 2026-08-17. Native discovery, acquisition, focus
  reacquisition, device disable/re-enable, Set reload, and all four physical corner
  coordinates passed on the connected Push 3.
- **Live setup evidence:** The generated artifact was installed and reopened in Live
  12.4.3. A user-provided photo confirmed the attached Push 3 was already in Control
  Mode; the earlier inference from its absence in the Preferences table was invalid.
  The final native bridge acquired `Button_Matrix`, treated Live's negative control IDs
  as valid, and called `grab_control id <matrix-id>` on the Push surface object. The user
  confirmed top-left A8, bottom-left A1, top-right H8, and bottom-right H1. Final Live
  inspection showed `Pad: H1 0` and `Status: matrix acquired` after focus and device
  disable/re-enable cycling.

## 2026-08-17 — WP3 musical semantics

- **Scale input:** Use Live's root-relative `scale_intervals` exactly; interval 0 is
  degree 1. Scale walks cycle into the next octave, so scales with fewer than seven
  entries still define seven chord roots and the complete note layout.
- **Octaves:** Base Octave uses Ableton's displayed octave convention (`C3 = MIDI 60`).
  H4/degree 8 is always tonic +12 and is not the next item in the scale walk.
- **Harmony:** Chord quality is chromatic relative to the selected scale-degree root.
  `7` adds +10, `9` adds +14 without implying 7, and both modifiers preserve that
  order. Valid pitches above MIDI 127 are omitted rather than wrapped or clamped.
- **Layout:** A row advances one scale degree per file. Ranks 2 and 3 begin three scale
  degrees above ranks 1 and 2 respectively, making a diatonic-fourth overlap.
- **Ownership:** A physical pad snapshots its pitches at note-on. Shared pitches sound
  only on reference-count transition 0→1 and release only on 1→0. Repeated note-on for
  one owner first releases that owner's prior snapshot. Output note-ons retain the pad
  velocity; note-offs use velocity 0.
- **Panic:** Panic, focus loss, disable, deletion, and Set close emit exact tracked
  note-offs in ascending pitch order, then CC123 All Notes Off, and clear all state.

## 2026-08-17 — WP3 gate state

- **Automated gate:** Passing. Table-driven golden vectors cover C major, E natural
  minor, and D Dorian. The Node test runner enforces 100% line, branch, and function
  coverage across every deterministic core module, including its Max-compatible load
  path.
- **Hardware gate:** None. WP3 is deliberately Push-independent; artifact integration
  remains WP4 and has not begun.
- **Musical assumptions:** Resolved and recorded above. WP3 is accepted.
