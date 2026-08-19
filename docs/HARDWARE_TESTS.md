# WP5 v0.5.1 RC Live hardening and Push display acceptance card

Date: 2026-08-18

Live: 12.4.3

Artifact: `dist/PushChordGrid.amxd`

Release Set: `release/PushChordGrid-v0.5.1-RC Project/PushChordGrid-v0.5.1-RC.als`

Package: `dist/PushChordGrid-v0.5.1-RC.zip`

This card separates evidence the agent can obtain through tests, Live control, Set
inspection, and recording from the one remaining observation that requires prolonged
physical contact with Push. No MCP-capable setup is delegated to the user.

## Release configuration

- Track 1: **Push Chord Grid**, Base Octave 2, followed by MIDI Monitor and Live's
  Arpeggiator; first Push bank shows **Base Octave** followed by read-only **Playing**.
- Track 2: **Chord Instrument (Drift)**, armed, Monitor **In**, MIDI From **Push Chord
  Grid / Post FX**, one stock Drift instrument.
- Live scale: **C Minor**.
- No Producer Pal track, duplicate device, temporary route, test clip, take lane, or
  obsolete WP1 device remains in the release Set.
- Push Standalone is intentionally not part of this WP5 card; it remains WP6.

## Agent-owned evidence — passed

| Gate | Exact result |
| --- | --- |
| Coordinate contract | All 64 coordinates have exactly one role: 32 chord pads, 16 silent controls, and 16 silent reserved pads. |
| Musical vectors | C Major, A natural minor, and D Dorian degree 1–8 vectors pass across four octave rows, including 6/m7/M7/9, manual Voice, Nearest, bass, velocity, and exact release. |
| Playing vectors | The complete 961-value table is exact and unique: `--` plus 12 roots × 5 resolved qualities × 16 extension masks. Newest-held overlap, release fallback, retrigger, held scale/control changes, and all lifecycle blanks pass. |
| Push bank contract | Static AMXD validation finds exactly **Base Octave**, **Playing**, and six empty slots. Playing is inactive, non-mappable, driven only through `set`, and has no outgoing musical connection. |
| Lifecycle | Focus loss, disable, reload, deletion, Set close, and owner transfer flush exact active snapshots followed by CC123. |
| Sustained stress | A deterministic 1,800-second equivalent sequence produced more than 10,000 matched events with no unmatched notes, owners, or reference counts. |
| Duplicate owner | Two same-track devices showed one `matrix acquired` and one `duplicate standby`; the standby emitted no grid music. |
| Device reorder | Moving the second copy before the first transferred ownership to the new first device after outgoing cleanup. |
| Disable/re-enable | Disabling the owner transferred to the standby; re-enabling restored visible-order ownership without competing owners. |
| Focus | Moving focus to the destination released matrix ownership; returning to the source reacquired one owner and repainted. |
| Scale propagation | C Major → A Minor reached both instances, including the standby. The cleaned release Set was saved and reopened at C Minor. |
| Stock route | Drift received source Post-FX MIDI with Monitor In and record arm enabled. |
| External Instrument | A temporary stock External Instrument routed MIDI to **Leviasynth DR**, channel 1, with Audio From **No Input**; it was removed after validation. |
| Session recording | A destination Session clip captured exact repeated C3, E♭3, G3 Post-FX notes at velocity 72; the clip was inspected and deleted. |
| Arrangement recording | Arrangement Record captured exact C3, E♭3, G3 Post-FX notes; the main clip and take lane were removed. |
| Restart/reload | Live was saved, quit, relaunched, and the RC Set reopened. It showed two tracks, C Minor, Base Octave 2, intact Drift routing, and `matrix acquired`. |
| Saved display state | The reopened ALS contains exactly one `Playing` enum parameter with index 1, range 0–960, and default 0; MIDI Monitor and Live's downstream Arpeggiator remained intact. |
| Runtime closure | The frozen AMXD embeds exactly six declared JavaScript files and reports no external runtime dependency. |
| Reproducibility | Clean AMXD, manifest, ZIP, and checksum generation is byte-for-byte reproducible; package inventory is exact. |

## Physical-only duration observation — pending

Use the already-open RC Set normally on Push for one continuous 30-minute session.
This is an observation, not a configuration task. During the session, sample all four
chord rows, the Dim/Min/Maj/Sus controls, 6/m7/M7/9 controls, Voice/Nearest/bass
controls, soft and hard chord strikes, overlapping holds, focus changes, and at least
one Reload Grid. Also observe this exact screen sequence with Live still in C Minor:

1. With no chord held, **Playing** reads `--`.
2. Hold A1: **Playing** reads `Cm`.
3. While A1 remains held, press C1: **Playing** reads `D#`.
4. Release C1: **Playing** returns to `Cm`; release A1: it returns to `--`.
5. Hold Min + m7 + 9, then press A1: **Playing** reads `Cm +m7+9`.
6. Change focus or use Reload Grid while holding: notes end and **Playing** reads `--`.

The passing result is:

- pad lighting remains correct and responsive;
- strike dynamics remain audible through chord velocity;
- no chord/control press doubles because of ownership;
- every overlapping hold releases exactly;
- the Push **Playing** sequence above is legible and exact;
- no stuck note, dark unrecoverable grid, or ownership failure occurs.

`[ ] Physical 30-minute observation passed — no stuck notes or ownership/lighting failure`

`[ ] Physical 30-minute observation failed — record only the observed discrepancy`

## WP5 disposition

All automatable and Live-side v0.5.1 RC gates pass. WP5 hardware acceptance remains
open only for the unchecked physical 30-minute observation above. Do not infer it from
the deterministic stress run. WP6 Standalone integration must not begin until this
result is recorded.
