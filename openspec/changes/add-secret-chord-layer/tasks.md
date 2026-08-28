## 1. Lock Core Musical Semantics

- [ ] 1.1 Add failing table-driven harmony tests for all eight fixed quality formulas,
  Power dyad placement, Dominant cardinality, MIDI-range filtering, and unchanged
  default C Major/A natural minor/D Dorian vectors.
- [ ] 1.2 Implement Augmented, Power, Quartal, and Dominant formulas in the ES5 harmony
  core, then run `make test`, `make build`, and `make validate`.
- [ ] 1.3 Add failing state/snapshot tests for the single `seventh` flag, press-time
  automatic scale seventh, fixed manual seventh table, 6/7/9 combinations, and
  idempotent Quartal/Dominant seventh deduplication.
- [ ] 1.4 Replace the legacy m7/M7 extension state with 6/7/9 and preserve the
  automatic seventh candidate in press/retarget recipes, then run `make test`,
  `make build`, and `make validate`.

## 2. Implement the Two-Row Quality Surface

- [ ] 2.1 Add exact coordinate-contract tests for A8–D8 Major/Minor/Diminished/Sus,
  A7–D7 Augmented/Power/Quartal/Dominant, A6–D6 Voice/Nearest, E8/F8/G8/H8
  6/7/Reserved/9, unchanged bass controls, and thirteen reserved pads.
- [ ] 2.2 Update runtime routing and the edge-safe last-held quality stack for all eight
  momentary quality pads, including cross-row precedence, repeated notifications,
  release fallback, silence, and lifecycle reset.
- [ ] 2.3 Relocate Voice −/0/+ and Nearest to A6–D6 and update persistent state,
  history invalidation, input latches, and direct-MIDI-silence tests.
- [ ] 2.4 Update LED role/state mapping for eight qualities, 6/7/9, relocated
  Voice/Nearest, bass, chord holds, and reserved-off coordinates, then run `make test`,
  `make build`, and `make validate`.

## 3. Extend Live Held-Chord and Nearest Behavior

- [ ] 3.1 Add integration vectors for pressing/releasing each Secret quality over one
  and multiple held automatic chords while retaining press-time root, Voice, Nearest,
  bass, and physical velocity.
- [ ] 3.2 Extend the atomic all-owner transaction to every eight-quality and 6/7/9 edge,
  including contextual-seventh changes during a quality swap and Auto restoration
  after later Live scale changes.
- [ ] 3.3 Add exact global-diff tests for shared pitches, different owner velocities,
  idempotent Quartal/Dominant +7, retriggers, and lifecycle cleanup with no duplicate,
  premature, or stuck notes.
- [ ] 3.4 Add Power, three-tone, Dominant, extension-cardinality, and MIDI-boundary
  Nearest golden vectors; verify one-rotation candidate limits and unchanged scoring
  and tie-breaks.
- [ ] 3.5 Run the deterministic sustained stress sequence with the expanded state
  space, then run `make test`, `make build`, and `make validate`.

## 4. Generalize Feedback and Generated Metadata

- [ ] 4.1 Add current/Last feedback tests for every new quality, contextual d7/m7/M7,
  automatic scale sevenths, 6/7/9 stacks, relocated Nearest, idempotent extensions,
  and exact note-name/MIDI snapshots.
- [ ] 4.2 Replace the fixed Playing quality/mask assumptions with one generated,
  deduplicated identity catalog and shared runtime encoder; preserve `--` as code 0
  and deterministic ordering.
- [ ] 4.3 Add exact Playing examples for Major M7, Minor m7, automatic dominant-
  function seventh, Augmented M7, all Secret qualities, overlaps, live retargets, and
  future-trigger-only state changes.
- [ ] 4.4 Update the AMXD generator and static inspector for the expanded Playing
  labels/range, changed coordinate counts, new labels, wiring, and single supported
  parameter bank; run `make test`, `make build`, and `make validate`.

## 5. Update Product and Acceptance Sources

- [ ] 5.1 Update the project plan, product spec, architecture, decisions, Orchid
  adaptation, README, usage guide grid/interaction examples, and changelog with the
  breaking coordinates, exact formulas, contextual seventh policy, and reserved G8.
- [ ] 5.2 Update `docs/HARDWARE_TESTS.md` with exact expected MIDI and LED results for
  both quality rows, Major/M7 versus Minor/m7, automatic degree-5 seventh, relocated
  Voice/Nearest, live retargeting, overlap, velocity, focus, and lifecycle cleanup.
- [ ] 5.3 Update manifest/package expectations and release inventory without adding a
  runtime dependency or starting WP6 Standalone acceptance; run `make test`,
  `make build`, and `make validate`.

## 6. Reproducible Delivery and Live Evidence

- [ ] 6.1 Run clean `make test`, `make build`, `make validate`, and `make package`
  gates twice and assert byte-for-byte AMXD/package reproducibility, closed manifest
  inventory, forbidden-dependency absence, and matching checksums.
- [ ] 6.2 Connect Producer Pal first and use connected Live capabilities to prepare
  scale, tracks, Post-FX routing, stock instrument, arming/recording, and inspection;
  use Computer Use only for AMXD installation, UI-only state, screenshots, and saving
  the clean test Set.
- [ ] 6.3 Record all MCP-addressable exact MIDI, feedback, acquisition, routing,
  focus/device lifecycle, and cleanup evidence in the hardware card before requesting
  any physical contact.
- [ ] 6.4 If no connected capability can originate the required `Button_Matrix`
  events, run only the minimal physical sequence for both quality rows, contextual 7,
  relocated Voice/Nearest, LED response, velocity, and live held-chord mutation, then
  have the agent inspect and record the resulting evidence.
- [ ] 6.5 Rebuild the final `dist/` artifact and release bundle from source, verify its
  checksums and exact inventory, and deliver it with any irreducible physical-only or
  deferred WP6 Standalone observation explicitly marked rather than inferred.
