## 1. Lock Core Musical Semantics

- [x] 1.1 Add failing table-driven harmony tests for all eight fixed quality formulas,
  Power dyad placement, Dominant cardinality, MIDI-range filtering, and unchanged
  default C Major/A natural minor/D Dorian vectors.
- [x] 1.2 Implement Augmented, Power, Quartal, and Dominant formulas in the ES5 harmony
  core, then run `make test`, `make build`, and `make validate`.
- [x] 1.3 Add failing state/snapshot tests for the single `seventh` flag, press-time
  automatic scale seventh, fixed manual seventh table, 6/7/9 combinations, and
  idempotent Quartal/Dominant seventh deduplication.
- [x] 1.4 Replace the legacy m7/M7 extension state with 6/7/9 and preserve the
  automatic seventh candidate in press/retarget recipes, then run `make test`,
  `make build`, and `make validate`.

## 2. Implement the Two-Row Quality Surface

- [x] 2.1 Add exact coordinate-contract tests for A8–D8 Major/Minor/Diminished/Sus,
  A7–D7 Augmented/Power/Quartal/Dominant, A6–D6 Voice/Nearest, E8/F8/G8/H8
  6/7/Reserved/9, unchanged bass controls, and thirteen reserved pads.
- [x] 2.2 Update runtime routing and the edge-safe last-held quality stack for all eight
  momentary quality pads, including cross-row precedence, repeated notifications,
  release fallback, silence, and lifecycle reset.
- [x] 2.3 Relocate Voice −/0/+ and Nearest to A6–D6 and update persistent state,
  history invalidation, input latches, and direct-MIDI-silence tests.
- [x] 2.4 Update LED role/state mapping for eight qualities, 6/7/9, relocated
  Voice/Nearest, bass, chord holds, and reserved-off coordinates, then run `make test`,
  `make build`, and `make validate`.

## 3. Extend Live Held-Chord and Nearest Behavior

- [x] 3.1 Add integration vectors for pressing/releasing each Secret quality over one
  and multiple held automatic chords while retaining press-time root, Voice, Nearest,
  bass, and physical velocity.
- [x] 3.2 Extend the atomic all-owner transaction to every eight-quality and 6/7/9 edge,
  including contextual-seventh changes during a quality swap and Auto restoration
  after later Live scale changes.
- [x] 3.3 Add exact global-diff tests for shared pitches, different owner velocities,
  idempotent Quartal/Dominant +7, retriggers, and lifecycle cleanup with no duplicate,
  premature, or stuck notes.
- [x] 3.4 Add Power, three-tone, Dominant, extension-cardinality, and MIDI-boundary
  Nearest golden vectors; verify one-rotation candidate limits and unchanged scoring
  and tie-breaks.
- [x] 3.5 Run the deterministic sustained stress sequence with the expanded state
  space, then run `make test`, `make build`, and `make validate`.

## 4. Generalize Feedback and Generated Metadata

- [x] 4.1 Add current/Last feedback tests for every new quality, contextual d7/m7/M7,
  automatic scale sevenths, 6/7/9 stacks, relocated Nearest, idempotent extensions,
  and exact note-name/MIDI snapshots.
- [x] 4.2 Replace the fixed Playing quality/mask assumptions with one generated,
  deduplicated identity catalog and shared runtime encoder; preserve `--` as code 0
  and deterministic ordering.
- [x] 4.3 Add exact Playing examples for Major M7, Minor m7, automatic dominant-
  function seventh, Augmented M7, all Secret qualities, overlaps, live retargets, and
  future-trigger-only state changes.
- [x] 4.4 Update the AMXD generator and static inspector for the expanded Playing
  labels/range, changed coordinate counts, new labels, wiring, and single supported
  parameter bank; run `make test`, `make build`, and `make validate`.

## 5. Update Product and Acceptance Sources

- [x] 5.1 Update the project plan, product spec, architecture, decisions, Orchid
  adaptation, README, usage guide grid/interaction examples, and changelog with the
  breaking coordinates, exact formulas, contextual seventh policy, and reserved G8.
- [x] 5.2 Update `docs/HARDWARE_TESTS.md` with exact expected MIDI and LED results for
  both quality rows, Major/M7 versus Minor/m7, automatic degree-5 seventh, relocated
  Voice/Nearest, live retargeting, overlap, velocity, focus, and lifecycle cleanup.
- [x] 5.3 Update manifest/package expectations and release inventory without adding a
  runtime dependency or starting WP6 Standalone acceptance; run `make test`,
  `make build`, and `make validate`.

## 6. Reproducible Delivery and Live Evidence

- [x] 6.1 Run clean `make test`, `make build`, `make validate`, and `make package`
  gates twice and assert byte-for-byte AMXD/package reproducibility, closed manifest
  inventory, forbidden-dependency absence, and matching checksums.
- [x] 6.2 Connect Producer Pal first and use connected Live capabilities to prepare
  scale, tracks, Post-FX routing, stock instrument, arming/recording, and inspection;
  use Computer Use only for AMXD installation, UI-only state, screenshots, and saving
  the clean test Set.
- [x] 6.3 Record all MCP-addressable exact MIDI, feedback, acquisition, routing,
  focus/device lifecycle, and cleanup evidence in the hardware card before requesting
  any physical contact.
- [ ] 6.4 If no connected capability can originate the required `Button_Matrix`
  events, run only the minimal physical sequence for both quality rows, contextual 7,
  relocated Voice/Nearest, LED response, velocity, and live held-chord mutation, then
  have the agent inspect and record the resulting evidence.
- [x] 6.5 Rebuild the final `dist/` artifact and release bundle from source, verify its
  checksums and exact inventory, and deliver it with any irreducible physical-only or
  deferred WP6 Standalone observation explicitly marked rather than inferred.

## Execution evidence — 2026-10-29

Tasks 1–5 and 6.1 pass: 88 JavaScript tests, 18 Python tests, 100% deterministic-core
coverage, build/static validation, valid OpenSpec deltas, and two byte-identical clean
build/package runs. Versioned v0.6.0 AMXD is installed separately and matches dist.
The user authorized closing the previous unsaved Set without saving. Producer Pal
2.3.0 and Computer Use verified the isolated RC in Live 12.4.7: C Major/Base Octave 3,
Drift Post-FX routing/monitor/arm, acquisition, disable/re-enable, Reload Grid,
duplicate standby, reorder transfer, deletion recovery, and return from track focus
cycling. A temporary clip recorded exact 60/64/67 pitches at velocity 72 through the
Post-FX route. This is passthrough evidence, not physical pad generation.

The clean two-track RC was saved and reopened with the exact 3,121-label Playing
catalog, no track clips, no temporary helper, and `matrix acquired`. Arpeggiator is
saved bypassed. The final artifact and eight-file ZIP were rebuilt and validated;
repeat packaging is byte-identical and the installed AMXD matches dist. Task 6.4
remains open: exact new pad-generated notes, velocities, LEDs and held-note cleanup
require physical contact. The 30-minute physical observation and WP6 Standalone
acceptance also remain open/deferred as described in docs/HARDWARE_TESTS.md.

The first physical A1 press/release reached the matrix callback. Live displayed
C3/E3/G3 (60/64/67), the A1 release value 0, and downstream Drift/Main output.
Transport was stopped at inspection, so no recorded notes were available to prove
velocity or exact release timing. Task 6.4 remains unchecked; a fresh downstream
recording was verified active before requesting both quality rows and contextual 7.
That subsequent capture contains exactly `v66 n12.032/4 C3 E3 G3 790|1.608`:
three baseline pitches at velocity 66, lasting 6.016 seconds at 120 BPM, with matched
ends before transport stopped. The user reported that the requested three-pad
choreography is physically impossible. The request was withdrawn and capture
stopped. The hardware card now separates optional short two-pad checks from
unverified three-pad combinations. No further contact is requested now; task 6.4
remains unchecked and no product behavior was changed to accommodate testing.
