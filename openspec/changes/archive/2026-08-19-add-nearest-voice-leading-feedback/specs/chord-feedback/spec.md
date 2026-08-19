## ADDED Requirements

### Requirement: Current selection feedback includes Nearest state
The device SHALL continuously display current chord quality selection, manual Voice value, Nearest on/off state, Bass state/register, and active extensions. Control changes SHALL update this display without emitting musical MIDI.

#### Scenario: Nearest control updates current state
- **WHEN** D7 toggles Nearest mode
- **THEN** the current-state display changes between `Nearest off` and `Nearest on` and all other current selections remain accurately represented

### Requirement: Current selection feedback exposes the detected Live scale
The device SHALL normalize LiveAPI's direct initial values and single-array observed-change callbacks for root note, scale intervals, scale name, and scale mode. The current-state line SHALL identify the detected root and scale name, and post-load scale changes SHALL affect future chord presses without reloading the device.

#### Scenario: C Minor is detected after initial C Major load
- **WHEN** Live changes from C Major to C Minor after the device has initialized
- **THEN** the current-state line changes to `Scale C Minor`, the interval snapshot becomes `0 2 3 5 7 8 10`, and the next Base Octave 3 degree-1 chord is `60 63 67`

### Requirement: Last-chord feedback derives from the emitted snapshot
After every valid chord press, the device SHALL display the harmonic root name, resolved quality, applied extensions, nearest/manual inversion information, and every final emitted MIDI pitch as a note name plus number. Feedback SHALL be derived from the exact pitch snapshot supplied to active-note ownership.

#### Scenario: Automatic diatonic chord is identified
- **WHEN** a C-major degree-2 chord pad generates D minor
- **THEN** feedback identifies root D, resolved Minor quality, the applied extension set, inversion state, and exactly the emitted pitch snapshot

#### Scenario: Nearest inversion is identified
- **WHEN** Nearest mode chooses a nonzero adjustment for a chord press
- **THEN** feedback reports that signed Nearest adjustment and the note-name/number list matches generated note-on events

#### Scenario: Shared held pitch is still listed
- **WHEN** a newly pressed chord shares one or more pitches with an existing owner
- **THEN** feedback lists the new owner's complete pitch snapshot even though shared pitches do not retrigger MIDI note-on events

### Requirement: Feedback has a safe empty lifecycle state
Before the first chord and after any lifecycle flush, the last-chord display SHALL show an explicit empty value and SHALL NOT retain stale emitted pitches. Ordinary chord release SHALL retain the last-chord display.

#### Scenario: Focus loss clears last chord
- **WHEN** focus is lost after a chord has been displayed
- **THEN** active notes flush and last-chord feedback returns to its explicit empty value

### Requirement: Generated device exposes dedicated current and last-chord lines
The generated Max device SHALL expose separately wired, readable current-state and last-chord presentation comments without adding a runtime dependency.

#### Scenario: Static artifact inspection
- **WHEN** the v0.4.7 AMXD is built and inspected
- **THEN** both display objects, the runtime feedback outlet, and their generator-owned connections are present and the forbidden dependency scan remains empty
