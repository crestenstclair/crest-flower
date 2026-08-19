# push-playing-display Specification

## Purpose
TBD - created by archiving change add-push-playing-display. Update Purpose after archive.
## Requirements
### Requirement: Push exposes the exact active chord
The generated device SHALL expose a read-only `Playing` value in the first Push
parameter bank immediately after `Base Octave`. Its value SHALL identify the active
snapshot's root, resolved quality, and every enabled 6, minor-7, major-7, and 9
extension.

#### Scenario: Extended minor chord is held
- **WHEN** a chord press resolves to C minor with minor-7 and 9 extensions
- **THEN** the Push `Playing` value is `Cm +m7+9`

#### Scenario: No chord is held
- **WHEN** the runtime has no active chord owner
- **THEN** the Push `Playing` value is `--`

### Requirement: Overlapping holds have deterministic display ownership
The newest held chord SHALL own the display, and releasing it SHALL reveal the newest
surviving held chord without recalculating that chord from current controls.

#### Scenario: Newest overlapping hold is released
- **WHEN** C minor is held, D-sharp major is pressed, and D-sharp major is released
- **THEN** the display changes from `Cm` to `D#` while the original C minor notes
  remain held

#### Scenario: Controls change during a hold
- **WHEN** a chord is held and the scale, quality, inversion, voicing, or extensions
  change before its release
- **THEN** its displayed identity remains the exact immutable press snapshot

### Requirement: Lifecycle events clear the display
Every ownership-loss lifecycle SHALL clear all active display snapshots and emit the
blank value before subsequent ownership can begin.

#### Scenario: Focus or device ownership is lost
- **WHEN** focus loss, disable, reload, deletion, Set close, or lease transfer invokes
  lifecycle cleanup while one or more chords are held
- **THEN** the display returns to `--` along with the existing deterministic note and
  LED cleanup

#### Scenario: Duplicate instance is in standby
- **WHEN** a non-winning duplicate is in standby and chord-pad activity occurs
- **THEN** it emits no MIDI or LED event and does not change its `Playing` value

### Requirement: Display integration stays inside the supported runtime boundary
The display SHALL use generated Max-native objects and the public Live parameter-bank
mechanism and SHALL NOT require Remote Scripts, private control-surface methods,
network access, third-party externals, desktop MIDI ports, or helper services.

#### Scenario: Generated artifact is validated
- **WHEN** the AMXD and release bundle pass static dependency and manifest validation
- **THEN** `Playing` is present exactly once in bank slot 2 with the deterministic enum
  table and no undeclared runtime dependency

