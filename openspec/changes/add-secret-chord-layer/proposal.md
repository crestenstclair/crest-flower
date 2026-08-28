## Why

The current four-quality surface covers basic triads but leaves the approved Secret
Chord layer unused and makes performers choose between separate minor- and
major-seventh modifiers. This change expands the harmonic palette while making the
common seventh choice follow the selected chord quality or automatic Live scale.

## What Changes

- **BREAKING** Reorder A8–D8 to Major, Minor, Diminished, Sus so the primary quality
  bank follows the requested left-to-right order.
- Assign A7–D7 to momentary Augmented, Power, Quartal, and Dominant qualities.
- **BREAKING** Move Voice −, Voice 0, Voice +, and Nearest from A7–D7 to A6–D6 so
  voicing remains directly beneath the two quality rows.
- **BREAKING** Replace the separate m7 and M7 modifiers with one contextual 7
  modifier: automatic chords take their scale-derived seventh, Major takes M7, Minor
  takes m7, and every other quality follows a fixed documented seventh rule.
- Preserve 6 and 9 as independent momentary extensions; leave the newly vacated
  extension coordinate reserved rather than introducing an unrelated modifier.
- Apply all eight quality choices and contextual extension changes to sounding owners
  through the existing atomic held-chord transaction, with exact velocity, overlap,
  feedback, Nearest, lifecycle, and LED behavior.
- Update deterministic tests, generated artifact checks, documentation, release
  inventory, and the exact MCP/hardware acceptance card. Preserve Push 3 Standalone
  compatibility without beginning the deferred WP6 Standalone gate.

## Capabilities

### New Capabilities

- `secret-chord-layer`: Defines the two-row quality bank, exact chord formulas,
  contextual seventh policy, relocated voicing controls, silent control behavior,
  LED states, and default compatibility.

### Modified Capabilities

- `advanced-hold-behavior`: Expand live atomic retargeting from four rank-8 qualities
  and 6/m7/M7/9 to all eight qualities and the new 6/7/9 modifier set.
- `nearest-voice-leading`: Move Voice and Nearest controls to A6–D6 and score the new
  two-, three-, and four-tone quality baselines deterministically.
- `chord-feedback`: Report all new quality identities and contextual seventh results,
  and reflect the relocated Nearest control.
- `push-playing-display`: Replace the closed legacy quality/extension label domain
  with deterministic labels and codes for the expanded quality set and contextual 7.

## Impact

The change affects coordinate routing, harmony/state formulas, held-owner rebuilding,
Nearest candidate generation, LED rendering, device/Push feedback tables, the
generated AMXD and manifest, automated golden vectors and static validators, and
user/architecture/hardware documentation. It introduces no runtime dependency,
network call, Remote Script, User Mode, external, or desktop-only MIDI path.
