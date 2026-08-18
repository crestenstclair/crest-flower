# WP4 v0.4.5 velocity and grid-recovery hardware acceptance card

Artifact: `dist/PushChordGrid.amxd`

Manifest: `dist/manifest.json`

Package: `dist/PushChordGrid-WP4.zip`

WP4's original interaction, v0.4.2 four-row automatic harmony, and v0.4.3 Orchid
surface are accepted. This card retains the v0.4.4 physical chord-pad velocity
correction and adds v0.4.5 automatic/manual matrix recovery. Push Standalone remains
deferred by user decision.

## Agent-executed MCP setup

The agent owns installation, device loading, scale changes, routing, recording, focus
and device cycling, Set saving, and recorded-note inspection through the connected
MCPs. The user is not asked to recreate any Live setup. The only unavailable operation
is physical Push pad contact.

Expected device state after load:

- `Status: matrix acquired`
- `Chord: Auto | Voice 0 | Bass off | Ext -`
- Base Octave `3`

On 2026-08-17 the agent installed the byte-identical v0.4.3 artifact in the User
Library, replaced the device on **WP4 Grid Source**, and saved the test Set. Producer
Pal verified A Minor, the Post-FX recording route, and the loaded Max MIDI Effect.
Computer Use observed `Status: matrix acquired` with the exact selection text above,
then Producer Pal selected another track and returned; after the designed watchdog
interval the device again displayed `Status: matrix acquired`.

The agent owns installation of v0.4.5, recording setup, recovery cycling, and
inspection of the exact recorded velocities. Only physical Push contact and hardware
power cycling are unavailable to MCP.

On 2026-08-18 the agent installed the byte-identical v0.4.5 artifact, replaced the
source-track device, restored Base Octave `2`, and saved the Set. Producer Pal verified
one Max MIDI Effect on **WP4 Grid Source** and the retained armed Post-FX route into
Drift. The agent switched Device On to Off and observed `Status: device disabled`,
switched it back On and observed `Status: matrix acquired`, then clicked **Reload
Grid** and again observed `Status: matrix acquired` without reloading the Set.

## 1. Coordinate roles and silent controls

Ranks 1–4 are chords. A–H are degrees 1–8; ranks 1–4 add 0/12/24/36 semitones.

Rank 8 is Orchid's harmonic surface:

| Pad | A8 | B8 | C8 | D8 | E8 | F8 | G8 | H8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Role | Dim | Min | Maj | Sus | 6 | m7 | M7 | 9 |

Rank 7 is voicing and bass:

| Pad | A7 | B7 | C7 | D7 | E7 | F7 | G7 | H7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Role | Voice − | Voice 0 | Voice + | Reserved | Bass − | Bass −1 | Bass + | Bass toggle |

Ranks 5–6 and D7 are reserved. Every control and reserved pad is absent from the
recorded MIDI as a note-on. Quality and extension controls are momentary; voicing and
bass state persist.

Result: `[ ] PASS  [ ] FAIL`

## 2. Physical chord-pad velocity

In C Major at default state, strike A1 three separate times: deliberately soft,
medium, then hard. Record the generated MIDI on the prepared Post-FX track.

Exact acceptance rules:

- each strike records only the chord pitches `60 64 67`;
- all three notes belonging to one strike have exactly the same velocity;
- the three strike velocities are three distinct integers in `1–127`;
- their order is strictly `soft < medium < hard`;
- the original physical pad note does not appear as an extra trigger; and
- repeating the test on any pad in ranks 2–4 preserves that pad's exact chord pitches
  while applying its own strike velocity to every newly sounding chord note.

The automated gate separately proves exact correlations at velocities `23`, `54`, and
`118`, release value `0`, all 32 physical pad-note mappings, matrix fallback, and
unchanged shared-pitch ownership.

Result: `[ ] PASS  [ ] FAIL`

## 3. Automatic Key Mode

With A Natural Minor selected in Live, Base Octave 3, and no modifier held, rank 1 must
record:

| Pad | Chord | MIDI pitches |
| --- | --- | --- |
| A1 | Am | `69 72 76` |
| B1 | Bdim | `71 74 77` |
| C1 | C | `72 76 79` |
| D1 | Dm | `74 77 81` |
| E1 | Em | `76 79 83` |
| F1 | F | `77 81 84` |
| G1 | G | `79 83 86` |
| H1 | Am | `81 84 88` |

Ranks 2–4 add exactly +12/+24/+36 where pitches remain within MIDI range.

Result: `[ ] PASS  [ ] FAIL`

## 4. Manual chord types

With C Major selected and all other state at default, hold each rank-8 quality pad,
tap A1, and release A1. Exact recorded notes:

| Held control | A1 MIDI pitches |
| --- | --- |
| A8 Dim | `60 63 66` |
| B8 Min | `60 63 67` |
| C8 Maj | `60 64 67` |
| D8 Sus | `60 65 67` |

While a type is held, the display names it. Releasing the type returns the display to
`Chord: Auto` without cutting off a chord that is still held.

Result: `[ ] PASS  [ ] FAIL`

## 5. Independent extensions and 9ths

In C Major, hold the named extension before tapping A1:

| Held control | A1 MIDI pitches |
| --- | --- |
| none | `60 64 67` |
| E8 6 | `60 64 67 69` |
| F8 m7 | `60 64 67 70` |
| G8 M7 | `60 64 67 71` |
| H8 9 | `60 64 67 74` |
| E8+F8+G8+H8 | `60 64 67 69 70 71 74` |

The display for all four is `Ext 6+m7+M7+9`. Releasing extension controls returns it
to `Ext -` and never emits a trigger note of its own.

Result: `[ ] PASS  [ ] FAIL`

## 6. Chord voicing and bass

In C Major with extensions off:

| Action before A1 | A1 MIDI pitches |
| --- | --- |
| Voice 0 (B7) | `60 64 67` |
| Voice + once (C7) | `64 67 72` |
| Voice 0, then Voice − once (A7) | `55 60 64` |
| Voice 0, Bass on (H7) | `48 60 64 67` |
| Bass − once (E7) | `36 60 64 67` |
| Bass −1 reset (F7) | `48 60 64 67` |
| Bass + once (G7) from reset | `60 64 67` (duplicate root is de-duplicated) |

Each step occurs once per press even if pad pressure changes while held. The device
display reports the exact Voice and Bass values. H7 turns bass off again.

Result: `[ ] PASS  [ ] FAIL`

## 7. Snapshot, overlap, and lifecycle

Hold Min (B8) and 9 (H8), press and keep holding A1, then release B8 and H8. The display
returns to Auto/`Ext -`, while the sounding A1 remains exactly `60 63 67 74` until A1
is released.

In C Major Auto, hold A1 (`60 64 67`), then hold C1 (`64 67 71`). C1 emits only `71`;
shared `64 67` are not retriggered. Releasing A1 ends only `60`; releasing C1 ends
`64 67 71`.

Holding any chord during focus loss or device disable emits its exact remaining
note-offs plus CC123 before matrix release. Returning focus or re-enabling shows
`Status: matrix acquired`. Momentary quality/extensions clear; voicing and bass
settings persist.

Clicking **Reload Grid** while notes are held performs that same exact note-off plus
CC123 flush before releasing and rediscovering the matrix.

Result: `[ ] PASS  [ ] FAIL`

## 8. Grid recovery

### Automatic device re-enable

Disable the Max MIDI Effect with its Device On switch, then re-enable it. Without
changing track focus or reloading the Set, the exact expected result is:

- the device re-runs Push and `Button_Matrix` discovery;
- status returns to `Status: matrix acquired`;
- all 64 pads repaint to their documented current values; and
- no musical note-on is emitted during recovery.

### Manual Reload Grid

With the source track still selected, click **Reload Grid** on the device face. The
status may briefly read `Status: reloading grid`, then must return to
`Status: matrix acquired`. The complete 64-pad frame repaints. Persistent Voice and
Bass settings remain; momentary quality/extension holds clear. The button emits no
musical note-on.

If the physical Push has been power-cycled and its grid stays dark, the same button
must recover it without deleting/re-adding the device or reloading the Set.

Result: `[ ] PASS  [ ] FAIL`

## 9. LEDs

- All 32 chord pads are blue (`45`); A/H tonic columns use distinct blue (`49`).
- A held chord turns white (`3`) and returns to its resting value on release.
- Quality controls A8–D8 use quality color (`21`) and active accent (`13`).
- Extensions E8–H8 are dim (`1`) and turn accent (`13`) while held.
- The currently applicable Voice and Bass register pads use accent (`13`); other step
  pads use note color (`2`). H7 is dim when bass is off and accent when on.
- Every reserved pad is off (`0`).
- Focus loss clears device colors before Push resumes its normal grid; focus return
  repaints the complete current state.

Result: `[ ] PASS  [ ] FAIL`

## Follow-up decision

`[ ] v0.4.5 accepted — velocity, grid recovery, and all retained WP4 behavior pass`

`[ ] v0.4.5 rejected — record only the physical discrepancy; MCP setup remains agent-owned`
