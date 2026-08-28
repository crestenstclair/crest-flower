## ADDED Requirements

### Requirement: Control rows expose the requested harmonic hierarchy
The grid SHALL map A8–D8 to momentary Major, Minor, Diminished, and Sus qualities in
that order; A7–D7 to momentary Augmented, Power, Quartal, and Dominant qualities in
that order; and A6–D6 to Voice −, Voice 0, Voice +, and Nearest. E8, F8, G8, and H8
SHALL be 6, contextual 7, Reserved, and 9. E7–H7 SHALL retain the existing bass
controls, while E6–H6 and A5–H5 SHALL remain reserved.

#### Scenario: All control coordinates are classified
- **WHEN** the generated coordinate contract is inspected
- **THEN** each of the 32 pads on ranks 5–8 has exactly the stated role, G8 and every
  remaining reserved pad are silent and unlit, and no coordinate has two roles

#### Scenario: Basic quality order is used
- **WHEN** A8, B8, C8, and D8 are pressed over a C root with no extensions
- **THEN** the selected formulas are C Major, C Minor, C Diminished, and C Sus in that
  left-to-right order

#### Scenario: Secret quality order is used
- **WHEN** A7, B7, C7, and D7 are pressed over a C root with no extensions
- **THEN** the selected formulas are C Augmented, C Power, C Quartal, and C Dominant
  in that left-to-right order

### Requirement: Manual qualities use canonical fixed formulas
The harmony engine SHALL generate Major as `0 4 7`, Minor as `0 3 7`, Diminished as
`0 3 6`, Sus as `0 5 7`, Augmented as `0 4 8`, Power as `0 7`, Quartal as `0 5 10`,
and Dominant as `0 4 7 10`, relative to the chord-pad root before extensions,
voicing, Nearest, and optional bass are applied.

#### Scenario: New C qualities use exact pitches
- **WHEN** a Base Octave 3 C root is generated in root position with bass and
  extensions off
- **THEN** Augmented is `60 64 68`, Power is `60 67`, Quartal is `60 65 70`, and
  Dominant is `60 64 67 70`

#### Scenario: Power remains a dyad before placement
- **WHEN** Power is selected and Voice + is applied once to a C3 root
- **THEN** the chord tones are `67 72` without an automatically doubled root octave

### Requirement: One contextual seventh replaces manual m7 and M7 selection
F8 SHALL expose one momentary `seventh` modifier and the runtime SHALL expose no
separate minor-seventh or major-seventh modifier. For Auto, 7 SHALL add the
press-time scale-stacked seventh at degree offset 6 from the pad root. For manual
qualities, 7 SHALL resolve to root +11 for Major and Augmented, root +10 for Minor,
Sus, and Power, root +9 for Diminished, and root +10 for Quartal and Dominant.
Existing chord tones and extension pitches SHALL be normalized so an already-present
seventh is not duplicated.

#### Scenario: Major and Minor choose their own seventh
- **WHEN** contextual 7 is active over a C Major chord and then a C Minor chord
- **THEN** Major contains B3/M7 (`71`) and Minor contains A-sharp3/m7 (`70`) without
  the performer selecting a second seventh type

#### Scenario: Auto uses the Live-scale seventh
- **WHEN** Live is C Major and contextual 7 is active for automatic degree 1 and
  automatic degree 5 at Base Octave 3
- **THEN** degree 1 is `60 64 67 71` and degree 5 is `67 71 74 77`

#### Scenario: Other manual qualities have deterministic sevenths
- **WHEN** contextual 7 is applied to C Diminished, Sus, Augmented, and Power
- **THEN** their normalized root-position pitches are respectively `60 63 66 69`,
  `60 65 67 70`, `60 64 68 71`, and `60 67 70`

#### Scenario: Inherent seventh is idempotent
- **WHEN** contextual 7 is pressed over sounding C Quartal or C Dominant
- **THEN** the seventh modifier state and feedback update but pitch `70` remains one
  owned tone and no duplicate note-on or note-off is emitted

### Requirement: Quality selection is one edge-safe momentary stack
All eight quality pads SHALL participate in one last-held-wins stack. A new press
SHALL select that quality, repeated nonzero notifications before release SHALL have no
effect, releasing a quality SHALL restore the newest still-held quality, and releasing
the final held quality SHALL restore Auto. Quality controls SHALL emit no direct MIDI.

#### Scenario: Basic and Secret qualities overlap
- **WHEN** Major is held, Quartal is pressed, Quartal is released, and Major is
  released
- **THEN** the selected state progresses Major → Quartal → Major → Auto with one
  state edge per physical press or release

#### Scenario: Lifecycle loss clears the full stack
- **WHEN** one or more basic or Secret qualities are held and focus, enablement,
  ownership, reload, deletion, Set close, or panic invokes lifecycle cleanup
- **THEN** every momentary quality and 6/7/9 modifier returns to its default off/Auto
  state while persistent Voice, Nearest mode, and bass configuration retain their
  established lifecycle behavior

### Requirement: Defaults and output boundaries remain compatible
With no quality or extension held, all 32 chord pads SHALL produce the existing
automatic Live-scale 1/3/5 vectors at their four octave rows. Quality, extension,
voicing, Nearest, bass, and reserved pads SHALL never emit a direct musical trigger,
and the generated runtime SHALL remain limited to Max-native objects, Max `js`, and
the public Live Object Model.

#### Scenario: Existing automatic golden vectors remain unchanged
- **WHEN** C Major, A natural minor, and D Dorian golden vectors are generated with
  default state
- **THEN** every A1–H4 pitch vector is byte-for-byte identical to the accepted
  automatic baseline

#### Scenario: Owned LED frame reflects the new roles
- **WHEN** the eligible instance acquires the matrix
- **THEN** all eight quality pads, 6/7/9, relocated Voice/Nearest, and bass controls
  use their documented resting or active colors, chord pads retain their established
  colors, and all thirteen reserved coordinates receive color 0
