# nearest-voice-leading Specification

## Purpose
TBD - created by archiving change add-nearest-voice-leading-feedback. Update Purpose after archive.
## Requirements
### Requirement: D7 toggles persistent nearest voice leading without MIDI
The system SHALL assign D7 exactly one `voice_leading_control` role. A new D7 press SHALL toggle Nearest mode once, its release SHALL only clear the press latch, and neither edge SHALL emit note or control-change MIDI.

#### Scenario: Enable Nearest mode
- **WHEN** D7 receives a nonzero press followed by release while Nearest mode is off
- **THEN** Nearest mode is on, D7 uses the active-control LED value, and no musical event is emitted

#### Scenario: Repeated press notifications are edge-safe
- **WHEN** D7 receives more than one nonzero notification before release
- **THEN** the mode toggles exactly once and no musical event is emitted

### Requirement: Nearest mode chooses a deterministic nearby inversion
For each chord press with Nearest mode enabled and valid prior chord-tone history, the system SHALL evaluate the manually voiced baseline and each MIDI-safe inversion within one complete chord rotation. It SHALL minimize symmetric nearest-tone semitone distance to the prior chord tones, prefer the fewest extra inversion steps on score ties, and prefer the lower signed step on remaining ties. Bass SHALL be excluded from scoring and added after selection.

#### Scenario: Smooth C-major progression
- **WHEN** Nearest mode is enabled and consecutive C-major scale-degree chord pads are pressed with no intervening invalidation
- **THEN** each generated pitch vector exactly matches the published golden nearest-voice-leading vector and its recorded nearest adjustment

#### Scenario: Extension cardinality changes
- **WHEN** the prior chord has three chord tones and the next pressed chord has one or more active extensions
- **THEN** the symmetric score includes every prior and candidate chord tone and produces the deterministic golden result

#### Scenario: Bass does not steer the chord
- **WHEN** bass is enabled or its octave is changed between two Nearest-mode chord presses
- **THEN** the selected chord-tone inversion is identical to the bass-disabled result and the requested bass pitch is added afterward when MIDI-safe

### Requirement: Default and octave-row behavior remain compatible
Nearest mode SHALL default to off. With Nearest mode off or with no valid history, generated pitch vectors SHALL match v0.4.5 exactly. Candidate search SHALL be limited to one chord rotation around the selected row/manual-voicing baseline.

#### Scenario: Existing golden vectors are unchanged by default
- **WHEN** any C major, A natural minor, or D Dorian chord vector is generated without enabling Nearest mode
- **THEN** its pitches exactly match the v0.4.5 golden vector

#### Scenario: First Nearest chord establishes history
- **WHEN** Nearest mode is enabled with empty history and a chord pad is pressed
- **THEN** the baseline chord is emitted unchanged and becomes the prior chord-tone snapshot

### Requirement: Context changes clear voice-leading history without mutating holds
The system SHALL clear voice-leading history when Nearest mode changes, manual chord voicing changes, Live scale changes, Base Octave changes, or any lifecycle flush occurs. Clearing history SHALL NOT alter the pitch snapshot owned by a currently held chord except when a lifecycle flush releases all owners.

#### Scenario: Manual voicing change establishes a new baseline
- **WHEN** a held chord exists and A7, B7, or C7 changes manual voicing
- **THEN** the held owner remains unchanged, history clears, and the next chord uses the new manual baseline unchanged

#### Scenario: Lifecycle loss flushes and resets
- **WHEN** focus loss, disable, reload, deletion, Set close, or panic occurs
- **THEN** every active note is released, CC123 is emitted, momentary modifiers clear, and voice-leading history is empty

### Requirement: D7 LED follows ownership and state
While the matrix is owned, D7 SHALL use the voicing-control resting color when Nearest is off and the active-control color when Nearest is on. Matrix release SHALL clear D7 with every other owned LED.

#### Scenario: Toggle repaints only changed state
- **WHEN** D7 toggles while LED ownership is active
- **THEN** the diff renderer emits the D7 color change and does not repaint unchanged coordinates

