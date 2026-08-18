# WP4 v0.4.7 live-scale, Nearest, and chord-feedback hardware acceptance card

Artifact: `dist/PushChordGrid.amxd`

Manifest: `dist/manifest.json`

Package: `dist/PushChordGrid-WP4.zip`

WP4's original interaction, v0.4.2 four-row automatic harmony, and v0.4.3 Orchid
surface are accepted. This card retains the v0.4.4 physical chord-pad velocity
correction and v0.4.5 matrix recovery, then adds v0.4.6 D7 Nearest voice leading and
exact chord feedback. Version 0.4.7 corrects post-load Live scale observation and
makes the detected scale visible. Push Standalone remains deferred by user decision.

## Agent-executed MCP setup

The agent owns installation, device loading, scale changes, routing, recording, focus
and device cycling, Set saving, and recorded-note inspection through the connected
MCPs. The user is not asked to recreate any Live setup. The only unavailable operation
is physical Push pad contact.

Expected device state after load:

- `Status: matrix acquired`
- `Scale C Major | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -`
- `Last: --`
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

For v0.4.6 the agent owns artifact installation, the cleaned three-track Set, scale and
focus changes, Device On/Reload cycling, routing, Set saving, UI inspection, and
recorded-note inspection. The three intentional tracks are **Producer Pal Control**,
**Push Chord Grid**, and armed **Chord Recorder + Drift** fed from Post FX. Only
physical Push pad contact and hardware power cycling remain unavailable to MCP.

For v0.4.7 the agent additionally owns changing Live from C Major to C Minor after the
device has initialized and verifying that the device face changes to `Scale C Minor`
without a reload. The physical chord strike remains the only hardware-only part.

## 1. Coordinate roles and silent controls

Ranks 1–4 are chords. A–H are degrees 1–8; ranks 1–4 add 0/12/24/36 semitones.

Rank 8 is Orchid's harmonic surface:

| Pad | A8 | B8 | C8 | D8 | E8 | F8 | G8 | H8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Role | Dim | Min | Maj | Sus | 6 | m7 | M7 | 9 |

Rank 7 is voicing and bass:

| Pad | A7 | B7 | C7 | D7 | E7 | F7 | G7 | H7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Role | Voice − | Voice 0 | Voice + | Nearest | Bass − | Bass −1 | Bass + | Bass toggle |

Ranks 5–6 are reserved. Every control and reserved pad is absent from the recorded
MIDI as a note-on. Quality and extension controls are momentary; Voice, Nearest, and
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

After the device is initialized in C Major, change Live to C Minor without reloading
the device. The current-state line must change from `Scale C Major` to `Scale C Minor`.
At Base Octave 3, A1 must then record C minor as `60 63 67`; it must not retain the
previous C-major vector `60 64 67`. Changing back to C Major must restore `60 64 67`.

The automated gate supplies LiveAPI's actual single-array callback shape and proves
the C Minor interval snapshot `0 2 3 5 7 8 10` reaches the runtime adapter.

Result: `[ ] PASS  [ ] FAIL`

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

## 7. Nearest voice leading and exact feedback

In C Major at Base Octave 3, tap D7 once. It emits no MIDI, changes the current display
to `Nearest on`, and changes only D7 from LED value `2` to `13`. Pressure updates while
D7 remains held do not toggle it again. Release D7 between actions below, and release
each chord before pressing the next:

| Chord press | Exact chord tones | Feedback inversion |
| --- | --- | --- |
| A1 (C) | `60 64 67` | `VL 0` |
| D1 (F) | `60 65 69` | `VL -1` |
| E1 (G) | `59 62 67` | `VL -2` |
| A1 (C) | `60 64 67` | `VL 0` |

After the second press the dedicated line is exactly:

`Last: F | Quality Maj | Ext - | Inv VL -1 | MIDI C3(60) F3(65) A3(69)`

The feedback lists the complete new owner snapshot even when another held chord means
shared pitches do not retrigger. With Nearest on, bass may be toggled or moved without
changing the selected chord-tone inversion; its root pitch is added afterward.

Press Voice −/0/+, change Live scale, change Base Octave, or toggle Nearest off/on.
Each action clears prior-chord history, so the next chord exactly matches that action's
manual baseline and becomes new history. A held owner does not change or retrigger.

Result: `[ ] PASS  [ ] FAIL`

## 8. Snapshot, overlap, and lifecycle

Hold Min (B8) and 9 (H8), press and keep holding A1, then release B8 and H8. The display
returns to Auto/`Ext -`, while the sounding A1 remains exactly `60 63 67 74` until A1
is released.

In C Major Auto, hold A1 (`60 64 67`), then hold C1 (`64 67 71`). C1 emits only `71`;
shared `64 67` are not retriggered. Releasing A1 ends only `60`; releasing C1 ends
`64 67 71`.

Holding any chord during focus loss or device disable emits its exact remaining
note-offs plus CC123 before matrix release. Returning focus or re-enabling shows
`Status: matrix acquired`. Momentary quality/extensions clear; Voice, bass, and
Nearest mode persist while prior-chord history clears.

Clicking **Reload Grid** while notes are held performs that same exact note-off plus
CC123 flush before releasing and rediscovering the matrix.

Result: `[ ] PASS  [ ] FAIL`

## 9. Grid recovery

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

## 10. LEDs

- All 32 chord pads are blue (`45`); A/H tonic columns use distinct blue (`49`).
- A held chord turns white (`3`) and returns to its resting value on release.
- Quality controls A8–D8 use quality color (`21`) and active accent (`13`).
- Extensions E8–H8 are dim (`1`) and turn accent (`13`) while held.
- The currently applicable Voice and Bass register pads use accent (`13`); other step
  pads use note color (`2`). D7 is note color when Nearest is off and accent when on.
  H7 is dim when bass is off and accent when on.
- Every reserved pad is off (`0`).
- Focus loss clears device colors before Push resumes its normal grid; focus return
  repaints the complete current state.

Result: `[ ] PASS  [ ] FAIL`

## Follow-up decision

`[ ] v0.4.7 accepted — live scale changes, Nearest, exact feedback, and retained WP4 behavior pass`

`[ ] v0.4.7 rejected — record only the physical discrepancy; MCP setup remains agent-owned`
