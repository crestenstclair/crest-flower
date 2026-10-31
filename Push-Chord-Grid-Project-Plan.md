# Push Chord Grid — LLM Build Plan

Status: revised for agent implementation  
Target: Live 12 first, with Push 3 Standalone integration at the final v0 gate  
Deliverable: generated Max for Live MIDI Effect (`.amxd`) plus a ready-to-test package

Implementation note (2026-08-17): Push 3 Standalone integration and acceptance are
deferred by user decision until the final v0 work package. Standalone compatibility
remains a product constraint throughout, but WP1–WP5 are developed and accepted in
Live 12 with Push in Control Mode. Do not require Standalone switching, transfer, or
testing before the final integration gate.

WP4 implementation note (2026-08-17): automated checks and the MCP-addressable Live
preflight passed, and the user confirmed the complete physical interaction works
great. WP4 is accepted. A subsequent authorized 0.4.1 follow-up implements the planned
LED renderer because the accepted v0 matrix was dark. Version 0.4.2 replaces the
performance area with four octave-spaced, automatically diatonic chord rows. Version
0.4.3 adapts Telepathic Instruments Orchid's chord-type, 6/m7/M7/9, inversion, and bass
model while preserving those automatic rows. Strum and Arp are explicitly delegated
to downstream Ableton MIDI devices; other timed performance transforms are not
proposed unless that composable Live workflow exposes a concrete gap. The current
harmonic follow-up proposals are documented in `docs/USAGE_GUIDE.html`. Version 0.4.4 correlates raw physical chord-pad velocities with matrix
coordinates and records the proposed harmonic feature set as approved direction.
Version 0.4.5 adds automatic re-enable discovery and a safe manual Reload Grid path
for stale matrix ownership after device or hardware cycling.
Version 0.4.6 assigns D7 to persistent nearest voice leading and adds exact
last-chord/inversion/extension/emitted-pitch feedback. Secret Chords, snapshots, and
split output remain unimplemented separate changes.
Version 0.4.7 normalizes LiveAPI's array-wrapped scale callbacks and shows the detected
Live scale on the device face so post-load key changes are both applied and visible.

WP5 implementation note (2026-08-18): v0.5.0 RC adds deterministic same-track
duplicate arbitration, two-phase note/LED/matrix ownership transfer, stale-owner
recovery, and multi-instance isolation. Automated stress, Live routing/recording,
duplicate/reorder/focus/disable, cleanup, and full Live restart/reload gates pass. The
reviewed two-track Set reopens at C Minor, Base Octave 2 with one source and one armed
Post-FX Drift destination. Only the physical 30-minute Push performance observation
remains pending; WP6 Standalone integration has not begun.

WP5 follow-up note (2026-08-18): v0.5.1 RC adds a Push-native **Playing** display in
the public device parameter bank. It reports the newest held immutable chord snapshot,
including resolved quality and all 6/m7/M7/9 extensions, falls back through overlapping
holds, and blanks after final release or lifecycle cleanup. It introduces no Remote
Script, private Push API, runtime dependency, or musical-grid change.

WP5 follow-up note (2026-08-18): v0.5.2 RC replaces immutable holds with one
always-live behavior. Rank-8 quality and 6/m7/M7/9 edges atomically retarget every held
chord while preserving press-time root/voicing/bass context and strike velocity.
There is no Hold Mode setting. Retained and shared pitches never retrigger; all other
state changes remain future-trigger-only.

Secret Chord follow-up (2026-10-29): v0.6.0 implements eight momentary qualities,
contextual 7, and Voice/Nearest on A6–D6. The current grid and formulas below supersede
historical control coordinates in the earlier work-package notes. New physical
acceptance remains separate from automated proof; WP6 is deferred.

## 1. Intent

This project is to be built by an LLM coding agent. The user defines the musical behavior and performs unavoidable tests on the physical Push. The agent owns the rest:

- Researching the relevant Push and Max for Live APIs.
- Selecting and inspecting starter projects.
- Creating and maintaining the source repository.
- Writing the chord engine and Push integration.
- Generating the Max patch/device from text source.
- Writing automated tests and validation tools.
- Producing packaged `.amxd` builds.
- Diagnosing failures from logs and concise hardware-test results.
- Maintaining documentation and release notes.
- Operating Live through connected MCP tools for installation, Set construction,
  routing, recording, inspection, focus/lifecycle tests, and evidence capture.

The user should **not** have to open Max and draw patch cords, manually transcribe code, configure MIDI mappings, write a Remote Script, or assemble the device from tutorial material.

## 2. Necessary human actions

The project minimizes human work to actions the agent cannot perform through repository
tools, Producer Pal, Computer Use, or another connected MCP:

1. Make any unresolved musical choice when it materially changes behavior.
2. Physically touch Push pads or hardware controls only when no connected tool can
   originate the required hardware callback. The agent prepares the Set, starts and
   stops recording, changes focus/state, and reads the resulting MIDI or UI evidence.
3. Perform a Push-local or Standalone action only after the agent has verified that no
   connected MCP can perform it.
4. If no reproducible command-line or MCP equivalent exists, perform the one final Max
   **Freeze Device** action for release packaging. The agent supplies the single action
   only after every other check passes.

Hardware testing is not “helping develop the plugin.” It is acceptance testing an artifact produced by the agent.

### MCP-first execution policy

The agent owns all Live-side acceptance work exposed by connected tools. Before asking
the user to do anything, it must inspect available MCP capabilities and use them in
this order:

1. **Producer Pal** for semantic Live operations: connect to the open Set; read and
   update Set scale; create, name, arm, route, and inspect tracks; create stock devices;
   select tracks/devices; control playback; and read recorded MIDI clips and device
   parameters.
2. **Computer Use** for Live or Finder UI operations not exposed by Producer Pal:
   install/load the generated AMXD, operate device activators and dialogs, inspect
   visible device status, save a dedicated test Set, and capture screenshots. Follow
   the Computer Use skill and drive the Mac through its `node_repl` interface.
3. Repository tools for deterministic generation, static inspection, checksums, and
   packaging.
4. User action only for a confirmed physical-only gap, such as contact with a Push pad
   when no MCP can originate a `Button_Matrix` callback.

An unavailable operation is not presumed to require the user. The agent must first
check Producer Pal, then Computer Use, and record the exact unsupported boundary. It
must not ask the user to install an artifact, create or route tracks, add a stock
instrument, arm or start recording, change Live's scale, switch track focus, toggle a
device, save a Set, inspect a MIDI clip, or return screenshots/logs when a connected
MCP can do that work.

At a hardware gate the agent prepares and saves the complete test Set, performs every
MCP-addressable step, records those results in `docs/HARDWARE_TESTS.md`, and reduces any
remaining user interaction to the smallest physical contact sequence. After contact,
the agent—not the user—reads recorded notes, status, screenshots, and logs through MCP
where possible.

## 3. Product definition

Build a Max for Live MIDI Effect that turns Push 3's 8×8 pad matrix into a split performance surface:

- Ranks 1–4: performance area.
- Ranks 5–8: controls.
- Ranks 1–4 each trigger chords by scale degree, one octave per row.
- Chord quality is derived automatically from Live's active root and scale.
- Rank 8 provides Major/Minor/Dim/Sus and 6/7/Reserved/9.
- Rank 7 provides Augmented/Power/Quartal/Dominant and unchanged bass controls.
- A6–D6 provide Voice −/0/+ and Nearest; E6–H6 and rank 5 remain reserved.
- The device produces MIDI and sits before any Ableton instrument.
- It works on Push 3 Standalone after a one-time transfer.
- During ordinary use it requires no computer, User Mode, MIDI mapping, Remote Script, helper application, or setup dialog.

The device owns harmonic generation, chord coloration, voicing, and its optional bass
voice. Ableton's downstream MIDI-effect chain owns Strum, Arp, rhythmic patterning,
probability, and humanization. Instruments, audio effects, tempo, looping, and
arrangement likewise remain native to Live.

The runtime artifact must be a Max for Live MIDI Effect. Push Standalone does not host VST/AU plug-ins, and a Live 12 MIDI Tool edits clip data rather than processing a real-time performance.

## 4. Grid contract

Coordinates use chess notation:

- Files A–H run left to right.
- Ranks 1–8 run bottom to top.

| Pads | Function | v0 behavior |
| --- | --- | --- |
| A8–D8 | Major/Minor/Dim/Sus | Momentary manual quality override; no direct trigger |
| E8/F8/H8 | 6/contextual 7/9 | Momentary extensions; no direct trigger |
| G8 | Reserved | No output |
| A7–D7 | Augmented/Power/Quartal/Dominant | Same momentary quality stack |
| A6–C6 | Chord voicing | Down/reset/up one inversion step; no direct trigger |
| D6 | Nearest | Persistent toggle; no direct trigger |
| E7–G7 | Bass register | Down/reset-to-−1/up one octave; no direct trigger |
| H7 | Bass | Toggle root bass voice; no direct trigger |
| A5–H5, E6–H6 | Reserved controls | No output |
| A1–H1 | Chords, octave 1 | Degrees 1–8 from Base Octave |
| A2–H2 | Chords, octave 2 | Same degrees, +12 semitones |
| A3–H3 | Chords, octave 3 | Same degrees, +24 semitones |
| A4–H4 | Chords, octave 4 | Same degrees, +36 semitones |

Interaction defaults:

- Chord types and extensions are momentary. Initial state is automatic diatonic
  harmony with extensions off.
- Voicing defaults to root position. Bass defaults off at one octave below the root.
- All 32 chord pads are velocity-sensitive.
- Multiple degree pads may be held simultaneously.
- Quality and extension edges atomically retarget holds using press-time context.
  Live scale, Base Octave, Voice, Nearest, and bass changes affect the next chord.
- Active outputs are tracked per physical pad. Shared pitches are reference-counted to prevent stuck or prematurely terminated notes.
- Control and reserved pads never leak trigger notes to the downstream instrument.

Automatic triads stack scale degrees 1/3/5 from each pad's root. Manual chord types use
0/4/7 (Major), 0/3/7 (Minor), 0/3/6 (Dim), 0/5/7 (Sus), 0/4/8 (Augmented),
0/7 (Power), 0/5/10 (Quartal), and 0/4/7/10 (Dominant). Extensions add +9 (6),
+14 (9), and one contextual seventh: stored scale-degree offset 6 in Auto, +11 for
Major/Augmented, +9 for Dim, +10 otherwise. Quartal/Dominant +7 deduplicate.

## 5. Key, scale, and pitch behavior

The device observes the Live Set instead of maintaining a second key/scale setup:

- Read and observe `live_set.root_note`, `live_set.scale_intervals`, `live_set.scale_name`, and `live_set.scale_mode` through the Live Object Model.
- Map A–G on every chord row to the first seven scale degrees.
- Map H on every chord row to the tonic plus 12 semitones.
- Add 0/12/24/36 semitones for ranks 1/2/3/4.
- Continue using Live's selected root and scale when Scale Mode is off.
- For non-heptatonic scales, use the first seven returned degrees and keep H as the octave.
- Base Octave is a stored parameter with a playable default; configuration is optional.

Automatic chord voices use scale-degree offsets 1/3/5, so their qualities follow Live.
Momentary manual quality formulas and extension offsets are the fixed chromatic values
recorded in the grid contract above. Voicing changes octave placement only; bass stays
tied to the harmonic root through its independent register.

## 6. Agent-first implementation strategy

### Primary rule: source is text, not a hand-edited Max canvas

The repository must have a reproducible build description from which the agent generates the `.amxd`. The Max GUI is a runtime inspector and final packaging fallback, not the source of truth.

Preferred approach:

1. Use `m4l-builder` as the initial programmatic patch generator.
2. Create `build_device.py` that emits the complete Max for Live MIDI Effect.
3. Add raw Max objects/connections through the builder's low-level API when a high-level recipe is missing.
4. If `m4l-builder` cannot express a necessary object or attribute, extend the build script or generate the relevant `.maxpat` JSON directly. Do not switch to manual patching.
5. Keep musical/state logic in testable JavaScript independent of Max glue.
6. Bundle runtime JavaScript during the build and include it in the device/package.
7. Generate a deterministic artifact and manifest with `make build`.

The first spike must prove that the generated artifact loads. The agent should not build the whole product on an unverified generator assumption.

### Repository layout

```text
push-chord-grid/
├── AGENTS.md
├── README.md
├── Makefile
├── pyproject.toml
├── package.json
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── HARDWARE_TESTS.md
│   └── DECISIONS.md
├── build/
│   ├── build_device.py
│   ├── max_objects.py
│   └── package_release.py
├── src/
│   ├── core/
│   │   ├── coordinates.js
│   │   ├── harmony.js
│   │   ├── active-notes.js
│   │   └── state.js
│   └── max/
│       ├── runtime-adapter.js
│       ├── live-scale-adapter.js
│       └── push-grid-adapter.js
├── tests/
│   ├── core/
│   ├── fixtures/
│   ├── test_generated_patch.py
│   └── test_forbidden_dependencies.py
├── tools/
│   ├── inspect_amxd.py
│   └── validate_release.py
├── vendor-licenses/
└── dist/
```

`AGENTS.md` must tell future agents:

- The build commands and source-of-truth files.
- Never to hand-edit generated files in `dist/`.
- Never to introduce Node for Max, third-party externals, network calls, or desktop-only dependencies.
- To preserve standalone compatibility.
- To update tests and the hardware test card for every behavior change.

### One-command workflow

The repository should converge on:

```bash
make bootstrap   # install development-only dependencies
make test        # run deterministic logic and generator tests
make build       # generate the development .amxd/package
make validate    # inspect artifact, dependencies, mappings, and manifest
make package     # create the Push-transferable release bundle
```

The user should normally receive a file from `dist/`, not a tutorial.

## 7. Runtime architecture

```text
Generated PushChordGrid.amxd
├── Push grid adapter
│   ├── dynamic Push discovery
│   ├── Button_Matrix acquire/release
│   ├── x/y/velocity normalization
│   └── LED output interface
├── Focus manager
│   └── selected-track and device lifecycle
├── Live scale adapter
│   └── root/scale observers
├── Grid router
│   └── coordinate → control/chord event
├── Harmony/state engine
│   └── automatic diatonic harmony, extensions, octave rows
├── Active-note manager
│   └── exact note-on/off ownership and reference counts
└── MIDI output
```

Hardware ownership policy:

1. Discover Push dynamically; never hard-code a control-surface index.
2. Claim `Button_Matrix` automatically only when the device is enabled and its track is selected.
3. Release on track deselection, device disable, deletion, or Set close.
4. Only the instance on the selected track owns the grid.
5. Reacquire after reconnect/Set reload with delayed initialization and a small watchdog.
6. Maintain a normalized `GridState[8][8]` from the first build.
7. Version 0.4.1 renders state-aware pad colors, repaints after acquisition, updates
   only changed values, and clears device colors before releasing the matrix.

Runtime constraints:

- Max-native objects, Max `js`, and the public Live Object Model only.
- No Node for Max, `node.script`, third-party externals, UDP, Jitter/OpenGL, shell commands, services, or runtime network access.
- No dependency on a desktop-only MIDI port or Push User Mode.

## 8. Boilerplates and starter packs

The agent must fetch/inspect these itself. The user is not expected to study or combine them.

### Foundation: m4l-builder (MIT)

Use [m4l-builder](https://github.com/alaarab/m4l-builder) as the first build foundation because it generates `.amxd` devices from Python, is version-controllable, and includes MIDI-effect recipes. Pin a commit/version. Prove it with a minimal device before committing to it.

Fallback: direct deterministic generation of `.maxpat`/`.amxd` JSON from repository templates. This remains an agent-owned code-generation path, not manual Max editing.

### Logic donor: Tuple (MIT)

Inspect [Tuple](https://github.com/c0remusic/tuple) for:

- Harmony calculations.
- Live key/scale synchronization.
- Active-note handling.
- Push grid integration patterns.
- Packaging conventions.

Reuse only isolated, understood pieces with attribution. Do not inherit its `jweb` interface or Push 2 assumptions.

### Official examples

The agent should locate and inspect the installed [Building Max Devices Pack](https://www.ableton.com/en/packs/building-max-devices/) for correct MIDI Effect and Live API patterns. Treat examples as reference fixtures and translate the relevant graph into the generator.

Inspect Ableton's editable [Expressive Chords](https://www.ableton.com/en/packs/expressive-chords/) device for its bespoke Push layout, MPE behavior, and standalone-safe choices. Its page encourages customization but does not provide an explicit redistribution license; use it as evidence/reference unless permission to reuse code is established.

### API spike reference

[Push Grid MIDI](https://max4.live/device/10315/push-grid-midi/) demonstrates `Button_Matrix` observation and grab/release. Its listing has no software license. The agent may reproduce behavior from the documented public API but must not copy unlicensed patch contents into a distributed build.

### Production checklist

Use Ableton's [Max for Live Production Guidelines](https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md) to implement automated checks where possible: dependencies, parameter names, source/version handling, CPU expectations, and freeze/package verification.

### Non-starters

- VST3/AU/JUCE for the standalone target.
- Push 2 USB protocol libraries such as `push-interface` or AP2JS.
- Custom MIDI Remote Scripts.
- Live 12 MIDI Tools.
- A visual Max patch maintained by hand as the source of truth.
- Instructions that leave the user to connect objects or paste code.

## 9. Agent work packages and gates

### WP0 — repository and evidence capture

Agent deliverables:

- Repository skeleton and `AGENTS.md`.
- Pinned dependency versions.
- Licensing/attribution file.
- Architecture decision recording why the target is M4L and why the patch is generated.
- Automated development commands.

Gate: `make test` and `make build` work in a clean checkout.

### WP1 — generated-device smoke test

The agent generates the smallest possible MIDI Effect that passes incoming MIDI through unchanged and exposes one stored parameter.

Automated gate:

- Generated artifact exists and is deterministic.
- Artifact contains the expected MIDI input/output objects.
- No forbidden objects/dependencies are present.

Human hardware gate:

- User loads the supplied `.amxd` in Live 12.
- It loads without a missing/incompatible-object error.
- MIDI passes through.

Push 3 Standalone loading and transfer are explicitly outside this gate.

If it fails, the agent diagnoses and regenerates. The user does not edit the patch.

### WP2 — Push matrix spike

The agent generates a device that:

- Finds Push dynamically.
- Claims `Button_Matrix` on track selection.
- Converts pad events to A1–H8.
- Releases ownership cleanly.
- Reacquires after Set reload.

Automated tests simulate matrix events and validate all 64 coordinate mappings.

Hardware test card:

1. Load/select the prepared track.
2. Press A1, H1, A8, H8.
3. Switch away from and back to the track.
4. Disable and re-enable the device.
5. Save/reboot/reopen.

Gate: every reported coordinate/lifecycle result matches without manual Reset.

### WP3 — pure musical engine

The agent implements and tests, without requiring Push:

- Automatic diatonic harmony and extension state.
- Scale-degree roots.
- Degree 8 octave behavior.
- Four octave-spaced chord rows.
- Velocity.
- Overlapping chords and shared-pitch reference counts.
- Exact release behavior.
- Panic/all-notes-off lifecycle.

Tests use table-driven golden vectors covering C major, A natural minor, and D Dorian.

Gate: complete branch coverage for the deterministic core and no unresolved musical assumptions.

### WP4 — v0 integration

The agent integrates the proven grid adapter and musical engine, then emits a ready-to-install build.

Automated gate:

- Every grid coordinate has exactly one documented role.
- Reserved/control pads emit no musical trigger.
- Generated MIDI matches golden vectors.
- Lifecycle events flush active notes.
- Artifact validation and dependency scan pass.

Hardware gate:

- Test the two controls, all four chord octaves, automatic C major/A minor harmony,
  recording, focus changes, and overlapping holds using a generated checklist.
- Agent uses Producer Pal and Computer Use to install the build, prepare and save the
  test Set, configure Post-FX recording, change scale/focus/device state, and inspect
  recorded MIDI and UI status. The user supplies only physical pad contact that no MCP
  can originate; the agent captures results and iterates as necessary.

### WP5 — Live hardening and release candidate

Implemented in v0.5.0 RC on 2026-08-18. All agent-owned automated and Live-side gates
pass; the hardware card leaves only the physical 30-minute use observation pending.

Agent work:

- Produce a test build, ready-to-play stock-instrument Set/track, manifest, version, and changelog.
- Generate tests for duplicate instances, device order, scale changes, and release events.
- Resolve all Live 12 and Push Control Mode failures before beginning Standalone integration.
- Produce a release-candidate bundle and checksum.

Hardware gate:

- Live restart and Set reload.
- 30-minute use without stuck notes or ownership failure.
- Stock instrument and External Instrument routing.
- Session/Arrangement recording contains musical output only.

### WP6 — final Push 3 Standalone integration and release

Begin this work package only after WP0–WP5 pass in Live 12. No earlier work package
may require Standalone transfer, switching, or acceptance.

Agent work:

- Audit the release candidate for Push 3 Standalone compatibility without introducing desktop-only runtime dependencies.
- Produce the Push-transferable build, ready-to-play stock-instrument Set/track, transfer instructions, manifest, version, changelog, and checksum.
- Inspect logs supplied by the user and regenerate the artifact for any Standalone-only failure.
- Preserve all behavior already accepted in Live 12 and Push Control Mode.

Final hardware gate:

- Transfer the release candidate to Push 3 Standalone.
- Cold boot and Set reload.
- 30-minute use without stuck notes or ownership failure.
- Stock instrument and External Instrument routing.
- Session recording contains musical output only.
- Confirm the final package has no computer, network, or unsupported runtime dependency.

Gate: Standalone acceptance completes v0 and authorizes the final release bundle.

### WP5 follow-up — Push playing display (implemented in 0.5.1)

- Expose **Playing** beside **Base Octave** in Push's first public device parameter bank.
- Derive it from the exact immutable snapshot used for MIDI, including resolved
  quality and the complete 6/m7/M7/9 stack.
- Give the newest held chord display ownership; releasing it reveals the newest
  surviving hold, while final release and every lifecycle cleanup show `--`.
- Generate an inactive, non-mappable enum with no outgoing musical connection.
- Validate exact enum codes, bank position, Max attributes, wiring, dependency closure,
  documentation, Live installation, and reproducible delivery.

### WP5 follow-up — live hold behavior (implemented in 0.5.2)

- Remove the legacy immutable/Simple hold path and expose no mode setting.
- Apply actual Dim/Min/Maj/Sus and 6/m7/M7/9 press/release state changes to all
  currently held chord owners as one transaction.
- Rebuild each held owner from its press-time automatic triad, root, manual/Nearest
  placement, bass choice, and physical strike velocity; do not consult later Live
  scale, Base Octave, Voice, Nearest, or bass state.
- Compare complete global pitch counts before and after the transaction. Emit note-off
  only for a pitch becoming globally silent and note-on only for a newly sounding
  pitch; retained or transferred shared pitches emit nothing.
- Update Last, Playing, and enabled Nearest history to the newest retargeted hold.
  Preserve exact release, overlap, duplicate arbitration, and lifecycle cleanup.

### WP4 follow-up — LED renderer (implemented in 0.4.1)

The authorized follow-up implements the existing LED renderer interface with
diff-based updates:

- Enabled 7/9: bright accent.
- Chord pads: common family; tonic distinct.
- Held chord: high brightness.
- Reserved pads: off.

Repaint after acquire/reconnect. Stop LED writes before releasing the matrix. A compact
Push parameter bank for 7, 9, Base Octave, and key/scale label remains later
work and is not part of this follow-up.

### WP4 follow-up — four automatic chord octaves (implemented in 0.4.2)

- Ranks 1–4 are four octave-spaced copies of chord degrees 1–8.
- Chord tones stack the current Live scale at degrees 1/3/5, producing the correct
  diatonic quality for each root automatically.
- E8/F8 add scale-derived degrees 7/9; A8–D8 are no longer quality overrides.
- Held owners retain their note-on snapshot across scale or extension changes.
- Golden vectors cover all 32 pads in C major, A natural minor, and D Dorian.

### WP4 follow-up — Orchid harmonic surface (implemented in 0.4.3)

- The official Orchid manual is captured as a reproducible public Coda snapshot and
  its complete capability mapping is recorded in `docs/ORCHID_ADAPTATION.md`.
- A8–D8 are momentary Dim/Min/Maj/Sus overrides. With none held, Live's active scale
  continues to determine every chord automatically.
- E8–H8 independently add 6/m7/M7/9 using Orchid's exact root-relative meanings.
- A7/B7/C7 move the chord voicing down/reset/up by cascading the highest or lowest
  tone one octave. E7/F7/G7 do the same for bass register; H7 toggles bass.
- The original release implemented Orchid's snapshot-oriented Simple playstyle; v0.5.2
  supersedes it with always-live quality and extension changes. Momentary state still
  clears on lifecycle loss, while persistent voicing and bass state remains.
- Orchid's synth engines, effects, beat machine, clock, and looper map to Live-native
  instruments, effects, tempo, Drum Rack, and Session clips. Timed performance modes,
  Free playstyle retriggering, secret chords, and separate MIDI streams remain explicit
  follow-up candidates rather than being mixed into the safe harmonic engine.
- The agent installed the final build in the existing MCP-created Live test Set,
  verified the new display and matrix acquisition, exercised focus reacquisition, and
  saved the Set without delegating any Live-side work to the user.

### WP4 follow-up — physical chord-pad velocity (implemented in 0.4.4)

- Keep `Button_Matrix` as the coordinate, ownership, and lifecycle source.
- Parse Push physical note messages `36–67` with Max-native `midiparse` and map them
  exactly to A1–H4.
- Correlate raw strike velocity with the matching deferred matrix event; use the
  matrix value as fallback when no matching raw event exists.
- Apply the resolved velocity to every newly sounding pitch in the generated chord.
- Preserve raw external MIDI passthrough, snapshot ownership, shared-pitch reference
  counts, lifecycle flushes, LEDs, and Standalone-compatible dependencies.
- Nearest voice leading, live held-chord behavior, Secret Chords, performance
  snapshots, split output exploration, and clearer feedback were approved product
  direction; v0.4.6 implements Nearest and clearer feedback only.

### WP4 follow-up — resilient grid recovery (implemented in 0.4.5)

- Re-run native Push and `Button_Matrix` discovery whenever the device is re-enabled,
  then reacquire and repaint the complete grid.
- Expose one momentary **Reload Grid** control on the device face for stale ownership
  after hardware power changes or Live control-surface churn.
- Reload must flush active notes plus CC123, clear LEDs, release the old owner,
  rediscover Push, reacquire the matrix, and repaint all 64 coordinates.
- Reload emits no musical trigger and preserves persistent voicing/bass state while
  clearing momentary controls through the existing lifecycle contract.

### WP4 follow-up — nearest voice leading and exact feedback (implemented in 0.4.6)

- Assign D7 exactly one silent `voice_leading_control` role; press edges toggle the
  persistent mode and its LED reflects off/on state.
- Score the selected row/manual Voice baseline plus one complete inversion rotation
  against the prior chord tones using symmetric nearest-tone distance. Resolve ties by
  smallest absolute adjustment, then lower signed adjustment.
- Exclude bass from inversion scoring, add it afterward, and keep sounding owners as
  immutable release snapshots.
- Clear voice-leading history on mode/manual-voicing/scale/Base Octave changes and
  lifecycle loss while preserving the enabled mode across ordinary ownership loss.
- Show current Nearest state separately from the exact last chord name, resolved
  quality/extensions, inversion choice, and emitted note-name/MIDI-number snapshot.

### WP4 follow-up — live scale observer correction (implemented in 0.4.7)

- Accept LiveAPI observer updates in the actual single-array callback shape as well as
  direct/property-prefixed initial query values.
- Apply root and interval updates to future chord presses immediately; scale changes
  clear Nearest history without mutating already sounding owners.
- Show the detected root and scale name on the current-state line so Live and device
  state can be compared without generating a test chord.
- Golden-test a post-initialization C Major to C Minor observer transition.

## 10. Automated validation requirements

The LLM must be able to prove most behavior without hardware:

| Layer | Automated proof |
| --- | --- |
| Coordinates | Synthetic events cover all 64 pads and chess mapping |
| Harmony | Golden input/output pitch vectors |
| State | Extension toggles, scale transitions, and held-chord snapshots |
| Note lifecycle | Overlap, shared pitches, rapid retrigger, focus loss, panic |
| Generator | Expected objects, connections, attributes, parameter names |
| Compatibility | Static forbidden-object/dependency scan |
| Reproducibility | Two clean builds have identical content/checksum, excluding declared build metadata |
| Packaging | Manifest lists every required file and no undeclared external dependency |

No test may require the user to infer whether the result “seems right.” Hardware checklists specify the exact expected event or sound.

## 11. Definition of done for v0

v0 is complete only after the final WP6 Standalone gate, when the agent has delivered
a packaged artifact for which:

- Installation aside, loading/selecting the prepared track is enough to use it.
- The physical grid follows the documented chess mapping.
- Rank 8 changes chord state, rank 4 emits chords, and ranks 1–3 emit notes.
- Live's current key/scale is followed automatically.
- Chord/note events record correctly.
- Controls and triggers never leak downstream.
- No stuck notes occur during overlap, focus loss, disable, deletion, or reload.
- Push's normal grid behavior returns when inactive.
- The device survives cold standalone boot and Set reload.
- Runtime has no external process, computer, network, or unsupported dependency.
- The repository can regenerate and validate the artifact with documented commands.
- The user did not have to write or patch any part of the implementation.

## 12. First task for the coding agent

Create WP0 and WP1 only:

1. Initialize the repository and instructions.
2. Pin and evaluate `m4l-builder`.
3. Generate a minimal passthrough Max MIDI Effect.
4. Add deterministic build and static validation.
5. Produce the first `.amxd` and a three-step load test.

Do not implement chord logic until the generated-device path has loaded successfully
in Live 12 and the remaining WP1 Live acceptance checks pass. Defer Push 3 Standalone
integration, transfer, and acceptance until WP6; do not use Standalone as an earlier
implementation gate.

## Sources

- [Ableton: Max for Live Devices on Push 3 Standalone](https://help.ableton.com/hc/en-us/articles/8506527153308-Max-for-Live-Devices-on-Push-3-standalone)
- [Cycling '74: ControlSurface Live Object Model](https://docs.cycling74.com/apiref/lom/controlsurface/)
- [Cycling '74: Song Live Object Model](https://docs.cycling74.com/apiref/lom/song/)
- [Ableton: Expressive Chords](https://www.ableton.com/en/packs/expressive-chords/)
- [Ableton: Building Max Devices](https://www.ableton.com/en/packs/building-max-devices/)
- [Ableton: Max for Live Production Guidelines](https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md)
- [Ableton: Projects on Push 3 Standalone](https://help.ableton.com/hc/en-us/articles/8863603744412-Projects-on-Push-3-standalone)
- [Tuple source repository (MIT)](https://github.com/c0remusic/tuple)
- [Push Grid MIDI listing](https://max4.live/device/10315/push-grid-midi/)
- [m4l-builder source repository (MIT)](https://github.com/alaarab/m4l-builder)
