## Context

The v0.4.5 runtime already separates future-trigger musical state from active-note ownership. `state.js` generates each chord snapshot, `active-notes.js` owns exact pressed-pad pitch arrays and shared-pitch reference counts, and `runtime-adapter.js` assigns all 64 coordinates, renders LEDs, and formats device status. D7 is the only unassigned pad among the rank-7 performance controls. The generated patch embeds these ES5-compatible sources and currently exposes one current-selection display line.

The change must remain deterministic, generated from text, byte-reproducible, and compatible with Push 3 Standalone. It cannot add runtime dependencies or mutate already sounding owners.

## Goals / Non-Goals

**Goals:**

- Add an opt-in nearest-voice-leading mode without changing default v0.4.5 vectors.
- Preserve the octave-row and manual-voicing intent while selecting a nearby inversion.
- Keep active-note lifecycle and shared-pitch ownership exact.
- Make the generated result understandable from the device face.
- Give D7 exactly one documented, silent, lit control role.

**Non-Goals:**

- Advanced held-chord mutation, Secret Chords, performance snapshots, split MIDI output, Strum, Arp, or other timed behavior.
- Enharmonic spelling beyond deterministic sharp note names derived from MIDI pitch class.
- Push display integration outside the public matrix LED API.

## Decisions

### Voice leading is stateful future-trigger selection inside the musical core

`state.js` will retain `voiceLeadingEnabled` and the last generated chord-tone snapshot, excluding the optional bass voice. A chord press first builds the existing manually voiced chord. When Nearest is enabled and history exists, the core evaluates the root/manual baseline plus every upward and downward inversion reachable within one chord rotation (`-(toneCount-1)` through `+(toneCount-1)`). This keeps the chosen rank and manual Voice setting meaningful instead of allowing an arbitrary multi-octave collapse.

Each candidate is scored by a symmetric nearest-tone distance: every candidate tone contributes its distance to the closest prior tone and every prior tone contributes its distance to the closest candidate tone. Ties prefer the fewest additional inversion steps, then the lower signed step. Duplicate candidates caused by MIDI boundaries are removed. The selected chord tones become the next history snapshot; bass is added afterward and never influences inversion choice.

Alternatives considered: ordered zip distance is simpler but behaves poorly when extension count changes; exhaustive octave assignment is harder to explain and can erase the four octave-row distinction; including bass causes bass-register controls to pull the chord voicing unexpectedly.

### History invalidation is explicit

D7 toggling, A7/B7/C7 manual voicing changes, Live scale changes, Base Octave changes, and every lifecycle flush clear the prior chord-tone snapshot. Quality/extension and bass changes do not clear it because they are intended inputs to the next nearest transition. Releases never change history. Sounding owners remain untouched by all state changes.

### Runtime records immutable feedback from the same press snapshot

The state core will return chord metadata together with pitches: harmonic root, resolved quality, active extensions, manual voicing, nearest adjustment, chord tones, optional bass, and final MIDI pitches. `runtime-adapter.js` will store this result only after a valid chord press and emit a dedicated fifth outlet. Feedback uses the same snapshot passed to active-note ownership, preventing UI/MIDI disagreement.

The device face grows to add a separate last-chord line. The current-state line reports Auto/manual quality, Voice, Nearest on/off, Bass, and active extensions. The last-chord line reports deterministic sharp-name chord identity, resolved quality/extensions, inversion adjustment, and emitted note names with MIDI numbers. Lifecycle loss clears last-chord feedback.

### D7 is a persistent silent control

`roleForCoordinate("D7")` becomes `voice_leading_control`. A press edge toggles the mode once, release only clears the physical control-held latch, and neither edge emits MIDI. Its resting LED uses the voicing-control family and its enabled LED uses the active-control accent.

### Live scale callbacks are normalized at the adapter boundary

LiveAPI initial `get` results may be direct/property-prefixed values, while observed changes arrive as one array argument. `live-scale-adapter.js` flattens exactly that outer callback wrapper before removing the property selector and parsing root, intervals, name, or mode. The runtime current-state line begins with the detected root and scale name, and scale/name/mode callbacks refresh that line. A production-shape C Minor callback regression prevents the initial-load-only behavior from returning.

## Risks / Trade-offs

- [Symmetric nearest-tone scoring can choose a musically different tie winner than a pianist] → Publish and golden-test the exact tie-break rule so results remain stable and understandable.
- [High/low MIDI boundaries reduce the available inversion set] → Reuse the existing MIDI-safe voicing function, remove duplicate candidates, and test both boundaries.
- [Long feedback text may exceed the compact device width] → Use a dedicated full-width line, concise tokens, and validate the generated patch dimensions/text wiring.
- [A stale prior chord could create surprising output after context changes] → Centralize and test history reset at every declared invalidation boundary and lifecycle event.

## Migration Plan

Build v0.4.7 from the generator, pass all automated/reproducibility/package gates, replace the current device in the cleaned Live Set, preserve Base Octave and routing, verify a post-load C Minor change, then save. Rollback is replacement with the existing v0.4.6 artifact or a Live automatic backup Set.

## Open Questions

None. Advanced/Secret/Snapshot/split-output work remains deferred to separate changes.
