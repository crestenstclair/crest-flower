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

## 2026-08-17 — WP4 integration boundary

- **Routing:** One deterministic runtime adapter owns the 64-coordinate contract and
  is the only path from normalized matrix events to the WP3 engine.
- **Silent pads:** The six latching controls and all 26 reserved pads are consumed
  before active-note ownership, so they cannot emit a musical trigger.
- **Scale:** A dedicated Max `js` adapter observes all four specified Live Set
  properties. Root and intervals update future triggers; held owners retain snapshots.
- **MIDI:** Native `midiformat` produces note bytes from pitch/velocity lists and CC
  bytes from lifecycle CC123. These merge with the existing raw MIDI passthrough at the
  device `midiout`.
- **Lifecycle order:** Focus loss and disable flush the engine before matrix release;
  `notifydeleted` flushes before teardown release.
- **Recording route:** The hardware card uses a second MIDI track fed from the device
  track's Post FX output, allowing exact inspection of generated pitches without
  requiring a runtime monitor dependency.

## 2026-08-17 — WP4 gate state

- **Automated gate:** Passing. Tests
  cover all coordinate roles, silent control/reserved behavior, golden MIDI vectors,
  scale observation normalization, overlap/reference counts, lifecycle flushes,
  artifact structure, embedded dependencies, and reproducible packaging.
- **Hardware gate:** Accepted on 2026-08-17. MCP preflight passed in Live 12.4.3. The
  agent installed and loaded the WP4 artifact, configured and armed a Post-FX Drift recording track,
  exercised C Major/E Minor/C Major observation, focus reacquisition, and device
  disable/re-enable, and saved `PushChordGrid-WP4-Test.als`. The user then confirmed
  the complete physical interaction works great. WP5 has not begun.
- **Standalone:** Still deferred by recorded user decision; WP4 preserves standalone
  compatibility without requiring a mode switch.

## 2026-08-17 — WP4 LED follow-up

- **Trigger:** After accepting the musical interaction, the user reported that owned
  pads were dark and requested the issue be fixed.
- **Write path:** Resolve the same `Button_Matrix` object used for observation and send
  `call send_value x y color`. This matches the working pattern inspected in the local
  Dyad device and adds no runtime dependency.
- **Rendering:** Send all 64 documented coordinates once after acquisition, cache the
  palette value per coordinate, and subsequently send only differences. Held musical
  pads override their resting color. Reserved pads are always zero.
- **Lifecycle:** Flush active notes and clear device LED values before releasing matrix
  ownership. Repaint after every acquisition or reconnect.
- **Palette:** off `0`, dim neutral `1`, note `2`, held `3`, extension accent `13`,
  root/selected quality `21`, chord `45`, tonic chord `49`.
- **Scope:** Version 0.4.1 follow-up to accepted WP4. It does not begin WP5.
- **Live evidence:** The agent installed 0.4.1 through Computer Use, reloaded it on
  `WP4 Grid Source`, saved the test Set, observed `Status: matrix acquired`, and drove
  a timed focus-away/focus-back lifecycle with Producer Pal.

## 2026-08-17 — four automatic diatonic chord octaves

- **Trigger:** The user requested that all bottom four rows be degrees 1–8 across four
  octaves and that chord qualities follow the selected key automatically.
- **Layout:** Ranks 1/2/3/4 add 0/12/24/36 semitones to Base Octave. Files A–G are
  scale degrees 1–7 and H is tonic +12 on every row.
- **Harmony:** Triads stack scale degrees 1/3/5. E8 and F8 independently add scale
  degrees 7 and 9. The previous global Major/Minor/Diminished/Sus selection and fixed
  chromatic extension formulas are superseded by this decision.
- **Example:** A natural minor yields Am, Bdim, C, Dm, Em, F, G, Am without a quality
  control press.
- **Controls:** A8–D8 become reserved and silent; E8/F8 remain extensions.
- **Scope:** Version 0.4.2 follow-up to accepted WP4. WP5 has not begun.
- **Live evidence:** The agent installed v0.4.2 with Computer Use, selected A Minor
  through Producer Pal, confirmed Live returned `A,B,C,D,E,F,G`, observed the acquired
  automatic-mode device, saved the Set, and completed a timed focus lifecycle cycle.

## 2026-08-17 — Orchid capability adaptation

- **Trigger:** The user identified Telepathic Instruments Orchid as the reference
  instrument, requested a manual deep dive, and authorized adapting its capabilities
  to the established four-row Push layout.
- **Source:** The official manual is a live public Coda document. Its exact compressed
  public snapshot and checksum are retained under `docs/references`; the researched
  capability mapping is `docs/ORCHID_ADAPTATION.md`. Neither enters the artifact.
- **Core model:** Preserve automatic Live-scale harmony as the default Key Mode. Map
  A8–D8 to momentary Dim/Min/Maj/Sus and E8–H8 to independent 6/m7/M7/9 notes. This
  supersedes v0.4.2's two latching diatonic extensions.
- **Voicing:** A7/B7/C7 repeatedly move the highest/lowest chord tone down/reset/up by
  an octave, matching Orchid's inversion principle. E7/F7/G7 control bass register;
  H7 toggles a root bass voice. Bass is MIDI in the same output stream and its sound
  remains the responsibility of the downstream Live instrument.
- **Playstyle at v0.4.3:** Implement snapshot semantics pending lifecycle and
  shared-pitch acceptance vectors. This behavior was explicitly superseded and removed
  by the v0.5.2 always-live held-chord decision below.
- **Live-native boundary:** Orchid's synths, effects, beats, BPM, and looping map to
  Live instruments/effects, Drum Rack, Set tempo, and Session clips. Timed Strum/Slop/
  Arp/Pattern/Harp need a cancellable scheduler and are not mixed into v0.4.3.
- **Scope:** This is authorized v0.4.3 follow-up work on accepted WP4; WP5 has not
  begun. Standalone compatibility and the deferred consolidated gate remain intact.
- **Live evidence:** The agent installed the final v0.4.3 artifact, replaced the source
  track device, preserved the armed Post-FX Drift recording route and A Minor Set
  scale, observed `Status: matrix acquired` plus the new Auto/Voice/Bass/Ext display,
  completed a focus-away/reacquire cycle, and saved the prepared Set through MCP.

## 2026-08-18 — Ableton owns timed performance transforms

- **Decision:** Do not add Strum or Arp to Push Chord Grid. Place any strumming,
  arpeggiation, rhythmic patterning, probability, or humanization in downstream
  Ableton MIDI devices.
- **Reason:** The device should remain a focused harmonic generator. Live already has
  a composable MIDI-effect layer for tempo-aware event generation, and keeping that
  layer downstream preserves exact chord snapshot and lifecycle ownership.
- **Related modes:** Orchid-style Slop, Pattern, Harp, and similar timed transforms are
  not current proposals. Reconsider one only if the Ableton MIDI-device chain reveals
  a specific missing workflow.
- **Roadmap effect:** Proposed device work is harmonic and expressive: nearest voice
  leading, optional safe mutation of held chords, a Secret Chord layer, performance
  snapshots, possible bass/chord output separation, and clearer chord feedback.
- **Documentation:** `docs/USAGE_GUIDE.html` is the self-contained current-usage and
  proposed-feature guide. Its proposed pad placements are non-binding; reserved pads
  retain their v0.4.3 silent roles.

## 2026-08-18 — physical chord-pad velocity correction

- **Trigger:** The user reported that chord pads produced no usable velocity variation
  and required physical pad velocity to drive the generated chords.
- **Boundary:** `Button_Matrix` remains the coordinate and lifecycle authority. A
  parallel native `midiparse` path reads Push's raw physical chord-pad notes `36–67`,
  whose installed Push control-surface definition maps A1–H4 in row-major order.
- **Correlation:** Raw pad messages arrive before the deferred Live API matrix
  notification. The adapter caches velocity per coordinate, consumes it only when the
  matching matrix press/release state agrees, and otherwise retains the matrix velocity
  as a deterministic fallback.
- **Musical result:** Every newly sounding pitch owned by one chord press uses that
  press's exact velocity. Shared held pitches retain reference-count behavior and are
  not spuriously retriggered. External MIDI passthrough is unchanged.
- **Scope:** Version 0.4.4 behavior correction on accepted WP4. It does not begin WP5.

## 2026-08-18 — harmonic feature direction approved

- **Decision at that time:** The user approved the proposed direction: nearest voice
  leading, live held-chord mutation, a Secret Chord layer, performance snapshots,
  exploration of separate bass/chord output, and clearer chord feedback.
- **Status:** Product direction only. No proposed coordinate assignment is active and
  every currently reserved pad remains silent until a separate implementation request
  defines and accepts the behavior.
- **Later disposition:** Nearest and live held-chord behavior are implemented. Secret
  Chords, snapshots, and routing remain separate future work.

## 2026-08-18 — explicit grid recovery after device or hardware cycling

- **Trigger:** The user switched the device or hardware off and the Push matrix stayed
  dark instead of returning to the chord layout.
- **Decision:** A device re-enable now re-runs native Push/matrix discovery. A visible
  momentary **Reload Grid** button provides the same recovery on demand when Live keeps
  a stale control-surface object after a hardware power cycle.
- **Safety order:** Flush active notes and CC123, clear the owned LED frame, release the
  prior matrix owner, clear cached surface/control IDs, defer rediscovery, reacquire,
  then repaint all 64 coordinates.
- **State:** Reload clears momentary quality/extension holds through the lifecycle
  path, preserves persistent voicing/bass state, and emits no musical trigger.
- **Scope:** Version 0.4.5 WP4 recovery correction; WP5 remains unstarted.

## 2026-08-18 — nearest voice leading and emitted-snapshot feedback

- **Authorization:** After reviewing the next roadmap step, the user explicitly asked
  the agent to implement v0.4.6 before WP5 hardening.
- **Control:** D7 is no longer reserved. It is a persistent, edge-triggered Nearest
  toggle; press/release emits no MIDI, repeated pressure cannot double-toggle, and its
  LED uses note color `2` when off and active accent `13` when on.
- **Algorithm:** Candidate inversions are limited to one complete rotation around the
  pressed row and manual Voice baseline. Symmetric nearest-tone distance includes all
  prior/current chord tones; score ties prefer the smallest absolute adjustment and
  then the lower signed adjustment. Bass never participates in scoring.
- **History:** Mode, manual Voice, Live scale, Base Octave, and lifecycle changes clear
  prior-chord history. Sounding owners remain exact snapshots; ordinary release does
  not erase performance history.
- **Feedback:** A dedicated device line derives chord root/name, resolved quality,
  extensions, inversion decision, and note-name/MIDI-number list from the exact owner
  snapshot, including shared pitches that did not need a repeated note-on.
- **Scope at v0.4.6:** This release implemented only Nearest and feedback. Live holds
  followed in v0.5.2; Secret Chords, performance snapshots, split output, and WP6
  remain unstarted.

## 2026-08-18 — normalize live scale observer callbacks

- **Trigger:** Live reported C Minor after a post-load scale change, but the device
  continued using its previous interval snapshot.
- **Cause:** LiveAPI observer callbacks arrive as one array argument. The adapter's
  initial-query path handled arrays, but its change callbacks treated that array as
  multiple arguments and rejected the resulting interval parse.
- **Decision:** Normalize both single-array observer callbacks and direct initial
  values at the adapter boundary, golden-test the production callback shape, and show
  `Scale <root> <name>` on the current-state line.
- **Scope:** Version 0.4.7 WP4 correction; musical generation, active-note ownership,
  Standalone constraints, and WP5 scope are unchanged.

## 2026-08-18 — WP5 duplicate-instance arbitration

- **Authorization:** After the accepted WP4 follow-ups, the user explicitly directed
  the agent to begin the next work package.
- **Winner:** The first eligible Push Chord Grid instance in the selected track's Live
  device order owns the matrix; device ID resolves an otherwise equal order.
- **Lease:** A Max-native named `Global` stores only flat numeric registration and
  lease records. A deferred named receive bus prompts reconciliation, and records
  older than three seconds expire.
- **Transfer:** The outgoing owner flushes exact note snapshots plus CC123, clears its
  LED frame, releases `Button_Matrix`, and clears the lease before the incoming owner
  may acquire and repaint. Standby copies generate no grid MIDI.
- **Live correction:** The first build used nested objects in Max `Global` and a
  synchronous broadcast. Live 12 exposed both assumptions: the registry could not be
  read back reliably and recursive callbacks produced `js: stack overflow`. Flat
  records plus a 1 ms deferred broadcast fixed the runtime without adding a dependency.
- **Isolation evidence:** Scale, controls, nearest history, owner snapshots, velocity
  caches, and LEDs remain instance-local. Exact duplicate/reorder/stale vectors and a
  deterministic 30-minute-equivalent sequence leave no unmatched notes.

## 2026-08-18 — WP5 Live release candidate

- **Set:** `release/PushChordGrid-v0.5.0-RC Project/PushChordGrid-v0.5.0-RC.als`
  contains exactly one **Push Chord Grid** source and one armed, Monitor-In **Chord
  Instrument (Drift)** destination receiving **Push Chord Grid / Post FX**. Base
  Octave is 2 and the saved Live scale is C Minor.
- **Ownership evidence:** In Live 12.4.3, same-track duplication produced one `matrix
  acquired` owner and one `duplicate standby` instance. Reorder, disable/re-enable,
  track-focus changes, and C Major → A Minor changes transferred/reconciled correctly.
- **Routing evidence:** Stock Drift and a temporary External Instrument targeting
  **Leviasynth DR**, channel 1, were validated. Session and Arrangement recording both
  captured the exact C3–E♭3–G3 Post-FX source notes; all probe clips, take lanes,
  temporary devices, and temporary tracks were then removed.
- **Restart evidence:** After a complete Live quit and relaunch, the clean Set reopened
  with two tracks, C Minor, Base Octave 2, intact Post-FX Drift routing, and `matrix
  acquired`. Live was left visible on the release Set.
- **Delivery:** v0.5.0 RC includes the reviewed Set, frozen AMXD, closed manifest,
  documentation, deterministic ZIP, and AMXD/ZIP SHA-256 sidecars. Runtime dependency
  inventory remains empty.
- **Gate state:** Every agent-owned automated and Live-side WP5 check passes. Only the
  irreducible physical 30-minute Push performance observation remains pending; it is
  not inferred. Push 3 Standalone transfer and cold-boot acceptance remain WP6 and
  have not begun.

## 2026-08-18 — Push-native active-chord display

- **Authorization:** The user explicitly requested a Push-screen display of what is
  playing after the accepted v0.5.0 RC behavior.
- **Supported path:** The public ControlSurface LOM has no stable notification method,
  so the display is an inactive, non-mappable `live.tab` named **Playing** in first-bank
  slot 2 beside **Base Octave**. No Remote Script or private Push API is introduced.
- **Identity:** Code 0 is `--`; a closed 960-value table covers every root, resolved
  Major/Minor/Dim/Sus/Auto quality, and every 6/m7/M7/9 combination.
- **Overlaps:** The newest held immutable chord snapshot owns the display. Its release
  reveals the newest surviving hold; final release and every lifecycle flush blank it.
  Last-chord feedback remains independently persistent after ordinary release.
- **Isolation:** `Playing` has no outgoing patchline. Standby duplicate instances
  receive no chord events, and display tracking cannot change MIDI, LEDs, harmony,
  velocity, or shared arbitration state.
- **Delivery:** This source-compatible follow-up is v0.5.1 RC with updated exact tests,
  static validation, clean Set, documentation, manifest, package, and checksums.
- **Live evidence:** The installed AMXD is byte-identical to `dist`. Live 12.4.3 loaded
  it with Base Octave 2, C Minor, and `matrix acquired`; the saved ALS contains one
  `MxDEnumParameter` named `Playing` with range 0–960 and default 0. A complete Live
  quit/relaunch reopened the exact parent release Set while preserving MIDI Monitor,
  Live's downstream Arpeggiator, the Drift route, and the selected source track.

## 2026-08-18 — always-live held-chord behavior

- **Authorization:** The user explicitly requested live held-chord mutation, then
  explicitly removed the legacy immutable/Simple mode and its setting.
- **Single behavior:** No Hold Mode exists in runtime, Live, or Push. Every actual
  quality or extension state edge uses live mutation, so a saved Set cannot restore
  the discarded behavior.
- **Mutation boundary:** Only actual Dim/Min/Maj/Sus or 6/m7/M7/9 state edges mutate
  held chords. Live scale, Base Octave, Voice, Nearest, and bass remain
  future-trigger-only.
- **Context:** Each press stores its automatic triad/quality, manual and Nearest
  placement, bass state, and physical velocity. Returning to Auto restores that exact
  press-time diatonic chord even if Live's scale changed during the hold.
- **Atomicity:** All held owners are validated and replaced together. MIDI is the
  sorted global count difference, so a retained or transferred shared pitch emits no
  note-off or note-on. A newly shared pitch emits once using the newest contributing
  owner's retained velocity.
- **Feedback and cleanup:** Last, Playing, and enabled Nearest history follow the
  newest committed hold. Existing lifecycle paths flush the new snapshots/velocities,
  emit exact note-offs plus CC123, with no hidden hold-style state retained.
- **Delivery:** This follow-up is v0.5.2 RC and introduces no coordinate change,
  Remote Script, private Push API, runtime dependency, or WP6 Standalone gate.

## 2026-10-29 — Secret Chord layer

- **Authorization:** The user directed work to continue after the status report
  identified `add-secret-chord-layer` as the next planned change.
- **Release:** v0.6.0 RC signals the breaking pad map: A8–D8 Major/Minor/Dim/Sus,
  A7–D7 Augmented/Power/Quartal/Dominant, A6–D6 Voice −/0/+/Nearest.
  E8/F8/H8 are 6/7/9; G8 is reserved. Bass controls and chord rows are unchanged.
- **Formulas:** Major 0/4/7; Minor 0/3/7; Dim 0/3/6; Sus 0/5/7;
  Augmented 0/4/8; Power 0/7; Quartal 0/5/10; Dominant 0/4/7/10.
- **Seventh:** Auto stores the scale-stacked seventh at press time, including a
  candidate above MIDI range. Manual Major/Augmented use +11, Dim +9, others +10.
  One `seventh` flag replaces both legacy flags. Quartal/Dominant +7 deduplicate.
- **Ownership:** Reuse the existing atomic all-owner retarget transaction and
  cardinality-based Nearest search. Press root, scale recipe, Voice, Nearest adjustment,
  bass, and physical velocity survive modifier edges. Future-only controls stay so.
- **Feedback:** A runtime-owned, deduplicated catalog supplies 3,121 Playing labels
  and codes to runtime, generator, and validator. Nonstandard scale intervals use
  `7(+N)`; Last prints exact emitted MIDI. Development Node extracts metadata; the
  artifact still embeds only the same six ES5 files and no runtime dependencies.
- **Gate:** Automated tests/build/static validation pass; current Live/physical
  observations belong in HARDWARE_TESTS.md. Prior v0.5.2 evidence is not new
  acceptance. WP6 Standalone remains deferred.
- **Live evidence:** With authorization to discard the prior unsaved Set, Live
  12.4.7 loaded, saved and reopened the v0.6.0 RC. Acquisition, disable/re-enable,
  Reload Grid, duplicate standby and reorder/deletion ownership checks passed.
  The clean saved Set uses C Major/Base Octave 3, a bypassed Arpeggiator and an
  armed Monitor-In Drift destination. A temporary Post-FX recording preserved
  60/64/67 at velocity 72; all probes were removed before saving. This verifies
  passthrough/routing, not physical pad generation. Exact Secret Chord pad and LED
  observations remain open.
