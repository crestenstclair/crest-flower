## ADDED Requirements

### Requirement: Live held-chord mutation is the sole behavior
The runtime and generated device SHALL NOT expose a Hold Mode setting or retain a
legacy immutable/Simple hold path. Every actual rank-8 quality or 6/m7/M7/9 state edge
SHALL use live held-chord behavior.

#### Scenario: Existing or newly loaded Set uses one hold behavior
- **WHEN** the generated device is loaded
- **THEN** quality and extension edges can transform sounding chords without a mode
  selection

#### Scenario: Generated controls remain focused
- **WHEN** the device face and first Push parameter bank are inspected
- **THEN** they contain Base Octave and Playing but no Hold Mode parameter

### Requirement: Quality and extension edges retarget sounding chords
Each actual change to the held quality override or 6/m7/M7/9 mask SHALL retarget every
currently held chord. Retargeting SHALL preserve each owner's
press-time root, automatic diatonic triad, manual Voice, Nearest adjustment, bass
choice, and physical strike velocity.

#### Scenario: Quality is pressed and released over a held automatic chord
- **WHEN** an automatic A-minor chord is held, Maj is pressed, and Maj is released
- **THEN** the sounding owner changes to A major and then returns to its original
  automatic A-minor triad without requiring the chord pad to be retriggered

#### Scenario: Ninth is added to overlapping held chords
- **WHEN** two chord pads with different strike velocities are held and 9 is pressed
- **THEN** both sounding owner snapshots gain their press-root ninth and every newly
  sounding note-on uses the corresponding retained physical velocity

#### Scenario: Unrelated state changes while a chord is held
- **WHEN** Live scale, Base Octave, Voice, Nearest, or bass changes while a chord is
  sounding
- **THEN** that state change does not itself retarget the held owner

### Requirement: Held-chord retargeting is globally atomic
All owners affected by one modifier edge SHALL be replaced in one transaction. A MIDI
pitch SHALL emit note-off only when its global reference count becomes zero and SHALL
emit note-on only when its global reference count rises from zero; pitches retained or
transferred across owners SHALL not retrigger.

#### Scenario: A pitch remains present in the transformed chord
- **WHEN** a held C-minor chord is changed to C-major
- **THEN** retained C and G emit no event, D-sharp emits one note-off, and E emits one
  note-on at the original chord-pad velocity

#### Scenario: A shared pitch transfers between overlapping owners
- **WHEN** one modifier edge removes a pitch from one held owner while adding the same
  pitch to another held owner
- **THEN** the pitch emits neither note-off nor note-on and its final reference count
  matches the complete replacement owner map

#### Scenario: Multiple owners introduce one shared silent pitch
- **WHEN** one modifier edge adds the same previously silent pitch to more
  than one held owner
- **THEN** exactly one note-on is emitted using the newest-held contributing owner's
  stored strike velocity

### Requirement: Feedback and lifecycle state remain exact
After a held-chord transaction, Playing and Last SHALL identify the newest held
retargeted snapshot, and enabled Nearest history SHALL follow that snapshot for the
next chord press. Every existing lifecycle flush SHALL clear the replacement recipes,
velocities, owners, and feedback.

#### Scenario: Newest overlapping owner is retargeted
- **WHEN** overlapping chords are held and a quality or extension changes
- **THEN** Playing and Last show the newest held chord with the new quality/extensions
  and its exact emitted pitch snapshot

#### Scenario: Lifecycle loss follows an Advanced change
- **WHEN** focus loss, disable, reload, deletion, Set close, panic, or lease transfer
  occurs after held owners were retargeted
- **THEN** every remaining pitch emits one final note-off in ascending order, CC123 is
  emitted, all active snapshots and velocities are cleared, and Playing returns to
  `--`

### Requirement: The supported runtime boundary is preserved
Held-chord mutation SHALL use only generated Max-native runtime objects, Max `js`, and
the public Live Object Model.

#### Scenario: Generated release is validated
- **WHEN** the AMXD and deterministic release bundle pass static dependency and
  manifest validation
- **THEN** Hold Mode is absent, the existing Base Octave and Playing parameter bank is
  exact, and no undeclared runtime dependency is present
