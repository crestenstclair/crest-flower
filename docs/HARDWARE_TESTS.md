# WP5 v0.6.0 RC Secret Chord acceptance card

Date: 2026-10-29
Artifact: `dist/PushChordGrid.amxd`
Package: `dist/PushChordGrid-v0.6.0-RC.zip`
Prepared Set: `release/PushChordGrid-v0.6.0-RC Project/PushChordGrid-v0.6.0-RC.als`

## Current disposition

Source tests, build, static validation, and installed-byte checks pass. With the
user's authorization, the previous unsaved Set was closed without saving. Producer
Pal 2.3.0 and Computer Use verified the isolated RC in Live 12.4.7. Acquisition,
disable/re-enable, Reload Grid, duplicate/reorder/deletion ownership, Post-FX MIDI
recording, and clean save/reopen pass. Physical pad acceptance remains open; no
v0.6.0 physical acceptance is inferred from clip playback or old v0.5.2 evidence.
Physical A1 feedback and downstream MIDI capture pass: C3/E3/G3 (60/64/67),
velocity 66, with all three recorded notes lasting 6.016 seconds and ending before
the agent stopped transport. The user reported that the requested sustained
three-pad modifier choreography is physically impossible. That sequence is
withdrawn; no further physical contact is currently requested. The remaining
hardware gate is unverified, not failed or waived.

The RC Set was saved and reopened in Live with C Major, Base Octave 3, Arpeggiator
bypassed, versioned AMXD references, and the exact new Playing metadata. The saved
release input has two tracks and no track clips or temporary inspection devices.
The device is installed separately at
`~/Music/Ableton/User Library/Devices/PushChordGrid-v0.6.0.amxd`.
WP6 Standalone transfer and cold-boot acceptance remain deferred.

## Agent-owned evidence

| Gate | Result |
| --- | --- |
| Tests | 88 JavaScript and 18 Python tests pass; deterministic-core line/branch/function coverage is 100%. |
| Coordinate contract | 32 chord pads, 19 silent controls, 13 silent/unlit reserved pads; every coordinate has exactly one role. |
| Automatic defaults | Existing C Major, A natural minor, and D Dorian vectors pass unchanged on all four octave rows. |
| Qualities/extensions | Eight formulas, every 6/7/9 mask, Power dyad placement, contextual seventh, deduplication, and MIDI boundaries pass exact vectors. |
| Stored context | Holds retain automatic triad and seventh, root, Voice, Nearest adjustment, bass, and strike velocity after later scale/control changes. |
| Atomic holds | All quality and extension edges use global pitch differences; shared notes do not retrigger; overlapping owner velocities and exact releases pass. |
| Nearest | Two-/three-/four-tone, extension-cardinality, one-rotation limits, stable score/ties, and low/high MIDI vectors pass. |
| Feedback | Playing/Last, contextual d7/m7/M7, exact note names/numbers, overlap fallback, future-only controls, and lifecycle blanks pass. |
| Display catalog | 3,121 unique labels, code 0 `--`; every accepted scale subset and clipped automatic identity agrees with runtime codes. |
| Max load path | Global `include` path initializes metadata and emits exact Caug +M7 notes, Playing code, and panic cleanup under the Max-shaped VM harness. This is not a Live runtime observation. |
| Sustained stress | 1,800-second equivalent deterministic sequence includes all eight qualities and 6/7/9 over overlapping holds; no unmatched, duplicate, or stuck notes/counts. |
| Artifact | Frozen AMXD embeds exactly six ES5 runtime files; no external runtime dependency. Base Octave/Playing occupy the only bank slots; Playing range is 0–3120. |
| Prepared Set | Static check requires one Playing parameter with all labels matching runtime; stale/duplicate metadata is rejected before packaging. |
| Installation | Versioned install is byte-identical to dist; previous installed device remains available. |
| Reproducibility | Two clean test/build/validate/package runs produce byte-identical AMXD, manifest, ZIP, and checksum sidecars. |
| Live setup | Live 12.4.7: C Major, Base Octave 3, source selected, Drift armed/Monitor In receiving Push Chord Grid Post FX, output Main; Arpeggiator bypassed. |
| Live lifecycle | Visible `matrix acquired`; disable shows `device disabled`, enable and Reload Grid return to `matrix acquired`. Same-track duplicate shows `duplicate standby`; moving it first transfers acquired/standby statuses; deleting it restores the original. Track focus cycled to Drift and back; original acquired after return. These idle checks do not prove held-note cleanup. |
| MIDI routing | Temporary source clip `v72 n/4 C3 E3 G3 1\|1` recorded downstream as C3/E3/G3 (60/64/67), velocity 72, eight complete quarter-note groups plus a final transport-truncated group. Drift/Main peak reached −5.27 dB. This proves passthrough, Post-FX routing and recording, not physical pad generation. Both clips removed. |
| Save/reopen | Live-saved canonical RC reopened with `matrix acquired`, C Major, Base Octave 3, bypassed Arpeggiator and Drift routing/arm intact. Saved XML has two tracks, zero track clips and valid 3,121-label Playing metadata. Temporary duplicate and Producer Pal track removed before saving. |
| Physical A1 baseline | After the user's single A1 press/release, the device showed `Pad: A1 0`, `matrix acquired`, and Last `C / Quality Maj / Ext - / Voice 0 / MIDI C3(60) E3(64) G3(67)`. Drift/Main peak reached −6.72 dB and MIDI Monitor was idle after release. Transport was stopped at inspection and the destination clip was empty; Capture MIDI was unavailable. This confirms the physical callback, displayed pitches and downstream output, but not recorded velocity or exact MIDI release timing. The empty clip was removed before restarting capture. |
| Physical MIDI capture | The subsequent downstream capture, clip id 198 at `t2/s0`, contains exactly `v66 n12.032/4 C3 E3 G3 790\|1.608`. At 120 BPM in 4/4, each of the three notes lasts 12.032 quarter-note beats (6.016 seconds), ending together at `793\|1.640`, well before capture ended at `827\|1`. This proves recorded baseline pitches, output velocity 66, and matched note ends; no source clip was playing. It does not prove the modifier sequence, raw strike-velocity correlation, or lifecycle cleanup. Transport and Session clips were stopped after inspection. |
| Physical boundary | Producer Pal exposes clip/parameter operations but no Button_Matrix input callback. UI exposes Base Octave/Reload Grid, not pad input. Remaining modifier, velocity-dynamics, LED and held-note lifecycle observations require physical contact. The user cannot perform the proposed three-pad sequence; it is not an acceptance prerequisite the user is being asked to execute now. |

## Exact prepared configuration

- Source: Push Chord Grid, Base Octave 3, followed by MIDI Monitor and Arpeggiator.
  Arpeggiator is saved bypassed for exact chord-vector recording.
- Destination: Chord Instrument (Drift), Monitor In, armed, source Post-FX input.
- Test scale: C Major. Agent sets this before requesting any contact.
- Push first bank: Base Octave, Playing, six empty slots. Idle Playing is `--`.
- Agent owns all setup, device toggles, scale/focus changes, capture, inspection,
  cleanup, screenshots, and saving. Do not delegate these to the user.

## Exact quality and seventh vectors

At Base Octave 3, C Major, Voice 0, Nearest/bass off, hold A1:

| Modifier | Exact root-position MIDI pitches | With F8 (contextual 7) | Playing with 7 |
| --- | --- | --- | --- |
| None (Auto) | 60 64 67 | 60 64 67 71 | C +M7 |
| A8 Major | 60 64 67 | 60 64 67 71 | C +M7 |
| B8 Minor | 60 63 67 | 60 63 67 70 | Cm +m7 |
| C8 Diminished | 60 63 66 | 60 63 66 69 | Cdim +d7 |
| D8 Sus | 60 65 67 | 60 65 67 70 | Csus +m7 |
| A7 Augmented | 60 64 68 | 60 64 68 71 | Caug +M7 |
| B7 Power | 60 67 | 60 67 70 | C5 +m7 |
| C7 Quartal | 60 65 70 | 60 65 70 | Cquart +m7 |
| D7 Dominant | 60 64 67 70 | 60 64 67 70 | C7 +m7 |

Auto E1+F8 is `67 71 74 77`, Playing `G +m7`, and Last includes exactly
`G3(67) B3(71) D4(74) F4(77)`. E8 adds root+9 and H8 root+14. With C Major,
all three extensions yield `60 64 67 69 71 74`; C Minor yields `60 63 67 69 70 74`.
Quartal/Dominant F8 edges update feedback and LED but emit no MIDI at all.

## Optional physical checks, at most two pads at once

These are future alternatives, not a current request. Confirm that a pair is
comfortable before using it. Complete one short check, release all pads, and let
the agent inspect the recording before requesting another. Do not require the user
to sustain a bottom-row chord while traversing both modifier rows with F8 held.

1. For one quality at a time, hold A1, press/release that quality, then release A1.
   The selected chord matches the table without F8; releasing the quality restores
   Auto. Release all before testing another quality. Final Playing is `--`.
2. Separately hold A1 and press/release F8: `60 64 67 71`, then `60 64 67`.
   Release all. A separate E1/F8 pair gives `67 71 74 77`, Playing `G +m7`.
3. With no chord held, hold Major A8, then Quartal C7; release C7, then A8.
   Quality feedback is Major/Quartal/Major/Auto and both controls remain silent.
4. Tap C6 and release it before holding B7 (Power) and striking A1: `67 72`.
   Release all, tap B6 to reset, then repeat the B7/A1 pair: `60 67`.
   Separately tap D6, then play/release A1, D1, E1, A1 one at a time:
   `60 64 67`, `60 65 69`, `59 62 67`, `60 64 67`. Tap D6 off afterward.
5. Hold A1 with F8 while the agent changes scale or tests one lifecycle event.
   Scale alone retains the stored C seventh recipe. Focus/device/Reload Grid
   cleanup emits final note-offs then CC123, blanks Playing, clears momentary
   controls, and reacquires/repaints one owner. Release all between checks.

## Deferred physical combinations

The following exact vectors retain automated coverage but have no physical proof.
They need a comfortable physical method before a future request; do not infer their
hardware acceptance from the two-pad checks above or silently change momentary
controls into latches to make the test easier.

1. A1 plus each quality plus F8 must match the table's contextual-seventh column.
   Quartal/Dominant F8 edges must not retrigger any pitch.
2. Hold A1 softly and E1 firmly, then hold F8. Owners become
   `60 64 67 71` and `67 71 74 77`. Pitch 71 is already shared and must not retrigger;
   only 77 is newly sounded, at E1's velocity. Release E1 first: only 74 and 77 end while
   67/71 remain owned by A1. Release F8: 71 ends; release A1: 60/64/67 end.
3. Hold A7 (Augmented), strike A1 soft then hard, and hold/release H8 while A1 rings.
   The new ninth uses the most recent A1 strike velocity. Release all; no stuck note.
4. While A1 and F8 remain held after a Live scale change, quality press/release
   must restore the original press-time automatic seventh recipe.

## Exact LED results

- Quality A8–D8/A7–D7: resting 21; selected quality 13, last-held wins.
- E8/F8/H8 extensions: resting 1, held 13. G8 stays 0 on press and release.
- A6/C6 Voice: resting 2; selected direction 13. B6 is 13 at Voice 0, else 2.
- D6 Nearest: off 2, on 13. Duplicate nonzero input toggles only once.
- E7/G7 bass direction: resting 2; selected direction 13. F7 reset is 13 at −1.
  H7 bass toggle is 1 off, 13 on.
- Chord tonic columns A/H: 49; other chord columns: 45; held chord: 3.
- All rank 5, E6–H6, and G8: 0 (13 reserved pads). Ownership release clears every
  previously lit pad before another device paints.

## Open acceptance

- [x] Isolated RC opened, checked, saved and reopened in Live.
- [x] Physical baseline C-major chord captured at velocity 66 with matched note ends.
- [ ] Both quality rows, contextual seventh, relocated Voice/Nearest, velocities,
  overlap, LEDs, and lifecycle sequence captured and inspected.
- [ ] Continuous 30-minute physical Push session passed: no stuck notes, ownership
  conflict, unresponsive lighting, or lost grid. Deterministic stress does not imply this.
- WP6 Standalone remains deferred; no repeated Standalone switching is requested.
