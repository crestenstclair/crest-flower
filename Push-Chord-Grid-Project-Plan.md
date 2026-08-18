# Push Chord Grid — LLM Build Plan

Status: revised for agent implementation  
Target: Live 12 first, with Push 3 Standalone integration at the final v0 gate  
Deliverable: generated Max for Live MIDI Effect (`.amxd`) plus a ready-to-test package

Implementation note (2026-08-17): Push 3 Standalone integration and acceptance are
deferred by user decision until the final v0 work package. Standalone compatibility
remains a product constraint throughout, but WP1–WP5 are developed and accepted in
Live 12 with Push in Control Mode. Do not require Standalone switching, transfer, or
testing before the final integration gate.

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

The user should **not** have to open Max and draw patch cords, manually transcribe code, configure MIDI mappings, write a Remote Script, or assemble the device from tutorial material.

## 2. Necessary human actions

The project should minimize human work to actions an LLM cannot perform without direct access to the physical Push/Live GUI:

1. Make any unresolved musical choice when it materially changes behavior.
2. Run a generated build on Live/Push when the agent reaches a hardware gate.
3. Press the pads listed on a short generated test card.
4. Return the observed result or a screenshot/log to the agent.
5. Transfer the finished package to Push's User Library.
6. If no reproducible command-line equivalent exists, perform the one final Max **Freeze Device** action for release packaging. The agent supplies exact one-step instructions and has already validated everything else.

Hardware testing is not “helping develop the plugin.” It is acceptance testing an artifact produced by the agent.

## 3. Product definition

Build a Max for Live MIDI Effect that turns Push 3's 8×8 pad matrix into a split performance surface:

- Ranks 1–4: performance area.
- Ranks 5–8: controls.
- Rank 4 triggers chords by scale degree.
- Ranks 1–3 play individual notes.
- Rank 8 selects chord quality and extensions.
- The device produces MIDI and sits before any Ableton instrument.
- It works on Push 3 Standalone after a one-time transfer.
- During ordinary use it requires no computer, User Mode, MIDI mapping, Remote Script, helper application, or setup dialog.

The runtime artifact must be a Max for Live MIDI Effect. Push Standalone does not host VST/AU plug-ins, and a Live 12 MIDI Tool edits clip data rather than processing a real-time performance.

## 4. Grid contract

Coordinates use chess notation:

- Files A–H run left to right.
- Ranks 1–8 run bottom to top.

| Pads | Function | v0 behavior |
| --- | --- | --- |
| A8 | Major | Selects major triad; mutually exclusive with B8–D8 |
| B8 | Minor | Selects minor triad; mutually exclusive with A8, C8, D8 |
| C8 | Diminished | Selects diminished triad; mutually exclusive with A8, B8, D8 |
| D8 | Sus | Selects sus4 triad; mutually exclusive with A8–C8 |
| E8 | 7 | Independent extension toggle |
| F8 | 9 | Independent extension toggle |
| G8–H8 | Reserved | No output |
| A5–H7 | Reserved controls | No output |
| A4–H4 | Degrees 1–8 | Triggers the selected chord on degrees 1–7; degree 8 is the tonic an octave higher |
| A1–H3 | Notes | Scale-aware individual notes in a Push-like overlapping-fourths layout |

Interaction defaults:

- A8–D8 form a latching radio group.
- E8 and F8 latch independently.
- Initial state is Major with extensions off.
- Degree pads are velocity-sensitive.
- Multiple degree pads may be held simultaneously.
- A held chord retains the exact voices created on note-on. Changing quality affects the next chord.
- Active outputs are tracked per physical pad. Shared pitches are reference-counted to prevent stuck or prematurely terminated notes.
- Control and reserved pads never leak trigger notes to the downstream instrument.

Unless changed before implementation:

- `7` adds a minor seventh (`+10`).
- `9` behaves as add9 (`+14`) and does not imply a seventh.
- Enabling both creates the seventh-plus-ninth set.

## 5. Key, scale, and pitch behavior

The device observes the Live Set instead of maintaining a second key/scale setup:

- Read and observe `live_set.root_note`, `live_set.scale_intervals`, `live_set.scale_name`, and `live_set.scale_mode` through the Live Object Model.
- Map A4–G4 to the first seven scale degrees.
- Map H4 to the tonic plus 12 semitones.
- Continue using Live's selected root and scale when Scale Mode is off.
- For non-heptatonic scales, v0 uses the first seven returned degrees and keeps H4 as the octave.
- Ranks 1–3 use adjacent scale degrees horizontally and begin each higher row a diatonic fourth above the previous row, producing a familiar overlapping shape.
- Base Octave is a stored parameter with a playable default; configuration is optional.

Chord formulas:

| Quality | Intervals |
| --- | --- |
| Major | 0, 4, 7 |
| Minor | 0, 3, 7 |
| Diminished | 0, 3, 6 |
| Sus | 0, 5, 7 |
| 7 modifier | +10 |
| 9 modifier | +14 |

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
│   │   ├── note-layout.js
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
│   └── coordinate → control/chord/note event
├── Harmony/state engine
│   └── quality, extensions, scale degrees, note layout
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
7. In v0, the LED renderer is a no-op. The matrix may therefore be dark while owned.

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

- Quality and extension state.
- Scale-degree roots.
- Degree 8 octave behavior.
- Three-row note layout.
- Velocity.
- Overlapping chords and shared-pitch reference counts.
- Exact release behavior.
- Panic/all-notes-off lifecycle.

Tests use table-driven golden vectors covering C major, E minor, and a modal scale.

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

- Test the six controls, eight chord pads, sample note pads, recording, focus changes, and overlapping holds using a generated checklist.
- User returns results; agent iterates as necessary.

### WP5 — Live hardening and release candidate

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

### Post-v0 — future LED/parseability release

This is planned now but not required for v0.

The agent implements the existing LED renderer interface with diff-based updates:

- Unselected qualities: dim neutral.
- Selected quality: bright.
- Enabled 7/9: bright accent.
- Degree pads: common family; tonic distinct.
- Held chord: high brightness.
- Notes: root emphasized; other scale notes dimmer.
- Reserved pads: off.

Repaint after acquire/reconnect. Stop LED writes before releasing the matrix. Add a compact Push parameter bank later for Quality, 7, 9, Base Octave, and key/scale label.

## 10. Automated validation requirements

The LLM must be able to prove most behavior without hardware:

| Layer | Automated proof |
| --- | --- |
| Coordinates | Synthetic events cover all 64 pads and chess mapping |
| Harmony | Golden input/output pitch vectors |
| State | Radio/toggle transitions and held-chord snapshots |
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
