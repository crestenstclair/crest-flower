# live-instance-arbitration Specification

## Purpose
TBD - created by archiving change wp5-live-hardening-release-candidate. Update Purpose after archive.
## Requirements
### Requirement: Exactly one eligible device owns the Push matrix
The runtime SHALL allow exactly one enabled Push Chord Grid instance to own the Push matrix and generate chord events. Among registered instances on the selected track, the first active instance in current device order SHALL be the eligible winner, with Live device ID as a deterministic tie-break.

#### Scenario: Duplicate instances on one selected track
- **WHEN** two enabled Push Chord Grid instances are present on the selected track
- **THEN** only the first instance in device order owns the matrix and the other reports standby without generated MIDI or LED writes

#### Scenario: Instances on different tracks
- **WHEN** enabled instances exist on multiple tracks and selected-track focus changes
- **THEN** the former owner releases and only the eligible instance on the newly selected track acquires

### Requirement: Ownership transfer is ordered and recoverable
The outgoing owner SHALL flush exact active note snapshots, emit CC123, clear its LED frame, and release the native matrix before the incoming winner acquires. Stale membership or an abandoned lease MUST expire within a bounded watchdog interval.

#### Scenario: Device order changes
- **WHEN** a standby duplicate is moved before the current owner in the selected track's device chain
- **THEN** the current owner completes lifecycle cleanup and clears the lease before the reordered winner acquires and repaints

#### Scenario: Owner disappears abnormally
- **WHEN** the recorded owner stops heartbeating without a normal deletion callback
- **THEN** its membership and lease expire and the current eligible winner can acquire without a Set reload

### Requirement: Standby instances are musically silent
A non-winning instance SHALL ignore matrix and raw chord-pad velocity events for music generation and SHALL NOT issue matrix LED commands or native ownership requests.

#### Scenario: Chord pad arrives while duplicate is standby
- **WHEN** a chord-pad press and release are delivered while an instance is not the lease owner
- **THEN** that instance emits no note-on, note-off, CC, or LED output

### Requirement: Musical state is isolated per device
Each instance SHALL retain independent scale, chord controls, nearest-history, active-note owners, physical velocity cache, and LED diff cache. A lifecycle event on one instance MUST NOT mutate another instance.

#### Scenario: Different scales and overlapping holds
- **WHEN** two instances are configured with different scales and each processes overlapping chord holds in turn
- **THEN** each emits only its own golden pitches and releases exactly its own stored snapshots

#### Scenario: Lifecycle flush on one instance
- **WHEN** focus loss, disable, reload, deletion, or Set close flushes one instance
- **THEN** its notes end in deterministic order with CC123 while the other instance's state remains unchanged

### Requirement: Scale and release changes remain snapshot-safe
Scale changes SHALL affect future chord presses only, and every release SHALL use the exact note-on snapshot even across overlaps, duplicate arbitration, and lifecycle interruption.

#### Scenario: Scale changes during a hold
- **WHEN** Live changes from C Major to C Minor and then A Minor while a chord remains held
- **THEN** the held owner releases its original notes and subsequent presses use the newest complete scale snapshot

#### Scenario: Sustained hardening sequence
- **WHEN** the automated 30-minute-equivalent sequence repeats holds, overlaps, retriggers, scale changes, and lifecycle events
- **THEN** it completes with no active owners, positive reference counts, or unmatched note-ons

