## MODIFIED Requirements

### Requirement: Live held-chord mutation is the sole behavior
The runtime and generated device SHALL NOT expose a Hold Mode setting or retain a
legacy immutable/Simple hold path. Every actual basic/Secret quality or 6/7/9 state
edge SHALL use live held-chord behavior.

#### Scenario: Existing or newly loaded Set uses one hold behavior
- **WHEN** the generated device is loaded
- **THEN** any of the eight quality controls and any 6/7/9 edge can transform
  sounding chords without a mode selection

#### Scenario: Generated controls remain focused
- **WHEN** the device face and first Push parameter bank are inspected
- **THEN** they contain Base Octave and Playing but no Hold Mode parameter

### Requirement: Quality and extension edges retarget sounding chords
Each actual change to the held eight-quality stack or 6/7/9 mask SHALL retarget every
currently held chord. Retargeting SHALL preserve each owner's press-time root,
automatic diatonic triad and scale-stacked seventh candidate, manual Voice, Nearest
adjustment, bass choice, and physical strike velocity.

#### Scenario: Quality is pressed and released over a held automatic chord
- **WHEN** an automatic A-minor chord is held, Major is pressed, and Major is released
- **THEN** the sounding owner changes to A major and then returns to its original
  automatic A-minor triad without requiring the chord pad to be retriggered

#### Scenario: Ninth is added to overlapping held chords
- **WHEN** two chord pads with different strike velocities are held and 9 is pressed
- **THEN** both sounding owner snapshots gain their press-root ninth and every newly
  sounding note-on uses the corresponding retained physical velocity

#### Scenario: Secret quality is pressed and released over a held automatic chord
- **WHEN** an automatic A-minor chord is held, Augmented is pressed, and Augmented is
  released
- **THEN** the sounding owner changes to A augmented and then returns to its original
  automatic A-minor triad without requiring the chord pad to be retriggered

#### Scenario: Contextual seventh is added to overlapping held chords
- **WHEN** automatic C-major degree 1 and degree 5 chord pads with different strike
  velocities are held and 7 is pressed
- **THEN** both owners gain their stored scale-derived seventh, and every newly
  sounding note-on uses the corresponding retained physical velocity

#### Scenario: Quality changes while contextual seventh is active
- **WHEN** a held automatic chord has 7 active and Major, Minor, or Diminished becomes
  the selected quality
- **THEN** its seventh is recalculated as +11, +10, or +9 in the same atomic owner
  replacement as its base quality

#### Scenario: Unrelated state changes while a chord is held
- **WHEN** Live scale, Base Octave, Voice, Nearest, or bass changes while a chord is
  sounding
- **THEN** that state change does not itself retarget the held owner

### Requirement: Feedback and lifecycle state remain exact
After a held-chord transaction, Playing and Last SHALL identify the newest held
retargeted snapshot, including any new quality and the resolved 6/7/9 result, and
enabled Nearest history SHALL follow that snapshot for the next chord press. Every
existing lifecycle flush SHALL clear the replacement recipes, velocities, owners, and
feedback.

#### Scenario: Newest overlapping owner is retargeted
- **WHEN** overlapping chords are held and a basic/Secret quality or 6/7/9 modifier
  changes
- **THEN** Playing and Last show the newest held chord with the new quality,
  contextual seventh identity, extensions, and exact emitted pitch snapshot

#### Scenario: Lifecycle loss follows an Advanced change
- **WHEN** focus loss, disable, reload, deletion, Set close, panic, or lease transfer
  occurs after held owners were retargeted
- **THEN** every remaining pitch emits one final note-off in ascending order, CC123 is
  emitted, all active snapshots and velocities are cleared, and Playing returns to
  `--`
