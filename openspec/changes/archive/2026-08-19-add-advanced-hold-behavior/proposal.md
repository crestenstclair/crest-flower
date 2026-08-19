## Why

Immutable hold semantics prevent expressive quality and extension changes from
affecting a chord that is already sounding. Held chords should instead respond live
to those controls without sacrificing exact note ownership, velocity, overlap safety,
or lifecycle cleanup.

## What Changes

- Remove the legacy immutable/Simple hold path and do not expose a Hold Mode setting.
- Apply every rank-8 quality or 6/m7/M7/9 press/release edge to all currently held
  chord owners as one atomic transition.
- Preserve each held chord's press-time root, row, automatic quality baseline,
  voicing/Nearest decision, bass configuration, and physical strike velocity while
  retargeting only its quality and extensions.
- Emit note-offs only for pitches no longer owned and note-ons only for pitches newly
  sounding globally; retained and shared pitches are never retriggered.
- Keep scale, Base Octave, Voice, Nearest, and bass changes future-trigger-only.
- Update Playing/Last feedback to the retargeted sounding snapshot and preserve the
  existing deterministic release, overlap, duplicate-instance, and lifecycle rules.
- Extend golden tests, generated-device validation, documentation, packaging, and the
  hardware acceptance card for the new mode.

## Capabilities

### New Capabilities

- `advanced-hold-behavior`: Always-on atomic quality/extension mutation of sounding
  chord owners with exact velocity, overlap, feedback, and lifecycle semantics.

### Modified Capabilities

None.

## Impact

The change affects the pure musical snapshot model, active-note owner manager, Max
runtime adapter, generated parameter graph and Push bank, validators, JavaScript and
Python tests, usage/hardware documentation, Live release Set, manifest, and release
package. It adds no coordinate role, Remote Script, private Push API, external,
network, desktop, or Standalone-incompatible runtime dependency.
