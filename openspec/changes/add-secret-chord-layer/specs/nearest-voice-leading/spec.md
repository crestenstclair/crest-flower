## ADDED Requirements

### Requirement: D6 toggles persistent nearest voice leading without MIDI
The system SHALL assign D6 exactly one `voice_leading_control` role. A new D6 press
SHALL toggle Nearest mode once, its release SHALL only clear the press latch, and
neither edge SHALL emit note or control-change MIDI.

#### Scenario: Enable relocated Nearest mode
- **WHEN** D6 receives a nonzero press followed by release while Nearest mode is off
- **THEN** Nearest mode is on, D6 uses the active-control LED value, and no musical
  event is emitted

#### Scenario: Repeated press notifications are edge-safe
- **WHEN** D6 receives more than one nonzero notification before release
- **THEN** the mode toggles exactly once and no musical event is emitted

### Requirement: D6 LED follows ownership and state
While the matrix is owned, D6 SHALL use the voicing-control resting color when
Nearest is off and the active-control color when Nearest is on. Matrix release SHALL
clear D6 with every other owned LED.

#### Scenario: Relocated toggle repaints only changed state
- **WHEN** D6 toggles while LED ownership is active
- **THEN** the diff renderer emits the D6 color change and does not repaint unchanged
  coordinates

## MODIFIED Requirements

### Requirement: Nearest mode chooses a deterministic nearby inversion
For each chord press with Nearest mode enabled and valid prior chord-tone history, the
system SHALL evaluate the manually voiced baseline and each MIDI-safe inversion within
one complete rotation of the actual normalized chord-tone count. It SHALL minimize
symmetric nearest-tone semitone distance to the prior chord tones, prefer the fewest
extra inversion steps on score ties, and prefer the lower signed step on remaining
ties. Bass SHALL be excluded from scoring and added after selection.

#### Scenario: Smooth C-major progression
- **WHEN** Nearest mode is enabled and consecutive C-major scale-degree chord pads are
  pressed with no intervening invalidation
- **THEN** each generated pitch vector exactly matches the published golden nearest-
  voice-leading vector and its recorded nearest adjustment

#### Scenario: Secret qualities use their actual cardinality
- **WHEN** Nearest evaluates Power, a three-tone quality, or four-tone Dominant
- **THEN** candidate adjustments cover respectively `-1..1`, `-2..2`, or `-3..3`
  before MIDI-unsafe or duplicate vectors are discarded

#### Scenario: Extension cardinality changes
- **WHEN** the prior chord and current chord have different tone counts because
  contextual 7, 6, or 9 changed or because a Secret quality is active
- **THEN** the symmetric score includes every prior and candidate chord tone and
  produces the deterministic golden result

#### Scenario: Bass does not steer the chord
- **WHEN** bass is enabled or its octave is changed between two Nearest-mode chord
  presses
- **THEN** the selected chord-tone inversion is identical to the bass-disabled result
  and the requested bass pitch is added afterward when MIDI-safe

### Requirement: Context changes clear voice-leading history without mutating holds
The system SHALL clear voice-leading history when Nearest mode changes, manual chord
voicing changes, Live scale changes, Base Octave changes, or any lifecycle flush
occurs. Clearing history SHALL NOT alter the pitch snapshot owned by a currently held
chord except when a lifecycle flush releases all owners.

#### Scenario: Manual voicing change establishes a new baseline
- **WHEN** a held chord exists and A6, B6, or C6 changes manual voicing
- **THEN** the held owner remains unchanged, history clears, and the next chord uses
  the new manual baseline unchanged

#### Scenario: Lifecycle loss flushes and resets
- **WHEN** focus loss, disable, reload, deletion, Set close, or panic occurs
- **THEN** every active note is released, CC123 is emitted, momentary modifiers clear,
  and voice-leading history is empty

## REMOVED Requirements

### Requirement: D7 toggles persistent nearest voice leading without MIDI
**Reason**: D7 is now the Dominant quality in the requested Secret Chord row.

**Migration**: Use D6 for the same persistent, edge-triggered Nearest behavior.

### Requirement: D7 LED follows ownership and state
**Reason**: Nearest and its state-aware LED move together from D7 to D6.

**Migration**: Validate and observe the Nearest LED on D6; D7 now follows momentary
Dominant-quality lighting.
