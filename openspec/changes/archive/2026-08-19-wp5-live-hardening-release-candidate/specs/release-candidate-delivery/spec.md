## ADDED Requirements

### Requirement: WP5 release artifact is self-contained and reproducible
The project SHALL generate a versioned WP5 AMXD, manifest, release-candidate ZIP, and SHA-256 checksums from declared inputs. Repeated clean builds and packages SHALL be byte-for-byte identical and the manifest SHALL declare no external runtime dependency.

#### Scenario: Clean release build
- **WHEN** tests, build, validation, dependency scan, and packaging run from a clean generated-output state
- **THEN** every gate passes and a second run produces identical AMXD, manifest, ZIP, and checksums

#### Scenario: Package inventory
- **WHEN** the release-candidate ZIP is inspected
- **THEN** it contains exactly the declared AMXD, Live Set, manifest, usage guide, architecture-facing adaptation notes, hardware checklist, changelog, and README under one versioned root

### Requirement: Release Set is clean and ready to play
The release SHALL include a Live 12 Set with exactly one Push Chord Grid source device and one stock-instrument destination track configured to receive Post-FX MIDI, monitor it, and record the generated musical output. Obsolete WP1 devices, duplicate source devices, Producer Pal control tracks, and temporary validation tracks MUST NOT remain in the release Set.

#### Scenario: Open release Set
- **WHEN** the packaged Set is opened in Live 12 with Push in Control Mode
- **THEN** the single source instance acquires the matrix and the stock Drift route is ready to play without track or device cleanup

### Requirement: Live routing and recording are validated
The hardware checklist SHALL contain exact, generated checks for the stock-instrument route, a temporary External Instrument route, Session recording, and Arrangement recording. Control and reserved pads SHALL contribute no recorded musical notes.

#### Scenario: Stock instrument route
- **WHEN** generated chord MIDI leaves the source track Post-FX
- **THEN** the armed stock-instrument destination receives and records only the generated musical notes

#### Scenario: External Instrument route
- **WHEN** the destination is temporarily configured with Live's stock External Instrument device
- **THEN** generated chord MIDI reaches that device through the declared route and the temporary track is removed before release packaging

### Requirement: Live restart and Set reload preserve readiness
The agent SHALL save, quit, relaunch Live, reopen the release Set, and verify the single eligible device, observed scale, matrix acquisition, routing, and absence of active notes using connected MCP/UI control.

#### Scenario: Restart and reload
- **WHEN** Live is restarted and the WP5 release Set is reopened
- **THEN** the device reacquires without manual replacement, shows the current Live scale, and leaves no stuck note or stale owner

### Requirement: Hardware-only evidence is explicit
The hardware acceptance card SHALL distinguish agent-owned automated/MCP evidence from physical Push contact and duration that no connected tool can originate. A hardware gate MUST NOT be marked passed until its exact physical observations are recorded.

#### Scenario: Thirty-minute physical gate is not yet observed
- **WHEN** all automated stress and Live automation checks pass but no 30-minute physical performance has been observed
- **THEN** the release candidate is delivered with that single hardware observation marked pending rather than inferred or silently omitted
