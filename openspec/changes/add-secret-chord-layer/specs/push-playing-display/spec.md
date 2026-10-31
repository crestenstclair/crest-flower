## MODIFIED Requirements

### Requirement: Push exposes the exact active chord
The generated device SHALL expose a read-only `Playing` value in the first Push
parameter bank immediately after `Base Octave`. Its value SHALL identify the active
snapshot's root, resolved automatic/basic/Secret quality, every enabled 6/7/9
modifier, and the contextual seventh's resolved diminished/minor/major identity when
7 is enabled. The enum label catalog and runtime codes SHALL be generated in one
stable, deduplicated order with `--` at code 0.

#### Scenario: Extended minor chord is held
- **WHEN** a chord press resolves to C minor with contextual 7 and 9 enabled
- **THEN** the Push `Playing` value is `Cm +m7+9`

#### Scenario: Contextually extended Major and Minor chords are held
- **WHEN** C Major with 7 and 9 is the newest owner and is then replaced by C Minor
  with 7 and 9
- **THEN** Push `Playing` changes from `C +M7+9` to `Cm +m7+9`

#### Scenario: Secret quality is held
- **WHEN** C Augmented with contextual 7 is the newest owner
- **THEN** Push `Playing` is `Caug +M7`

#### Scenario: No chord is held
- **WHEN** the runtime has no active chord owner
- **THEN** the Push `Playing` value is `--`

### Requirement: Overlapping holds have deterministic display ownership
The newest held chord SHALL own the display, and releasing it SHALL reveal the newest
surviving held chord from its current committed snapshot. Basic/Secret quality and
6/7/9 edges SHALL update all sounding snapshots through the live held-chord
transaction; Live scale, Base Octave, Voice, Nearest, and bass changes SHALL not
relabel an already sounding owner.

#### Scenario: Newest overlapping hold is released
- **WHEN** C minor is held, D-sharp major is pressed, and D-sharp major is released
- **THEN** the display changes `Cm` → `D#` → `Cm` while the original C minor notes
  remain held

#### Scenario: Live modifier retargets the display owner
- **WHEN** C minor is held and Augmented is pressed and released
- **THEN** the display changes `Cm` → `Caug` → `Cm` with the committed held-owner
  transactions

#### Scenario: Controls change during a hold
- **WHEN** Live scale, Base Octave, Voice, Nearest, or bass changes while a chord is
  held
- **THEN** the displayed owner identity remains its exact committed snapshot

### Requirement: Display integration stays inside the supported runtime boundary
The display SHALL use generated Max-native objects and the public Live parameter-bank
mechanism and SHALL NOT require Remote Scripts, private control-surface methods,
network access, third-party externals, desktop MIDI ports, or helper services.

#### Scenario: Generated artifact is validated
- **WHEN** the AMXD and release bundle pass static dependency and manifest validation
- **THEN** `Playing` is present exactly once in bank slot 2, its parameter range and
  labels exactly match the generated expanded enum table, code 0 is `--`, and no
  undeclared runtime dependency is present
