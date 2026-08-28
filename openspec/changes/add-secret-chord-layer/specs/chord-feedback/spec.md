## MODIFIED Requirements

### Requirement: Current selection feedback includes Nearest state
The device SHALL continuously display the selected Auto/basic/Secret chord quality,
manual Voice value, Nearest on/off state, Bass state/register, and active 6/7/9
modifiers. Control changes SHALL update this display without emitting direct musical
MIDI.

#### Scenario: Relocated Nearest control updates current state
- **WHEN** D6 toggles Nearest mode
- **THEN** the current-state display changes between `Nearest off` and `Nearest on`
  and all other current selections remain accurately represented

#### Scenario: Secret quality and contextual seventh update current state
- **WHEN** Quartal and contextual 7 are held
- **THEN** the current-state display identifies `Chord: Quartal` and active `Ext 7`
  without emitting a control-pad note

### Requirement: Last-chord feedback derives from the emitted snapshot
After every valid chord press or atomic held-chord retarget, the device SHALL display
the harmonic root name, resolved basic/Secret quality, applied 6/7/9 extensions,
resolved seventh identity, Nearest/manual inversion information, and every final
emitted MIDI pitch as a note name plus number. Feedback SHALL be derived from the
exact pitch snapshot supplied to active-note ownership.

#### Scenario: Automatic diatonic seventh is identified
- **WHEN** contextual 7 is active and a C-major degree-5 chord generates G dominant-
  seventh pitches
- **THEN** feedback identifies root G, resolved Major triad quality, the scale-derived
  minor seventh, inversion state, and exactly `G3(67) B3(71) D4(74) F4(77)`

#### Scenario: Secret quality is identified
- **WHEN** C Power with contextual 7 emits `60 67 70`
- **THEN** feedback identifies Power quality, resolved minor seventh, inversion state,
  and the exact three-note MIDI snapshot

#### Scenario: Nearest inversion is identified
- **WHEN** Nearest mode chooses a nonzero adjustment for any basic, Secret, or
  automatic chord press
- **THEN** feedback reports that signed Nearest adjustment and the note-name/number
  list matches generated note-on events

#### Scenario: Shared held pitch is still listed
- **WHEN** a newly pressed or retargeted chord shares one or more pitches with an
  existing owner
- **THEN** feedback lists the owner's complete pitch snapshot even though shared
  pitches do not retrigger MIDI note-on events
