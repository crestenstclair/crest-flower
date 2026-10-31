# Orchid capability study and Push adaptation

Research date: 2026-08-17  
Implemented slice: Push Chord Grid v0.6.0 RC

## Source record

Telepathic Instruments now publishes the [official Orchid manual](https://support.telepathicinstruments.com/hc/en-us/articles/15655088618127-Orchid-Manual)
as a live public Coda document rather than a static PDF download. The exact public Coda
snapshot used for this study is stored at
`docs/references/orchid-operation-manual.coda-snapshot.json.gz` with SHA-256
`b658a08e26193b90ca9f58a1d475bb70b05481825e7bdfa3d37554c70f9120a1`.
It is a gzip-compressed JSON source snapshot, not an authored project file and not a
runtime dependency.

The study cross-checked the manual against Telepathic Instruments' current support
pages for [Key Mode](https://support.telepathicinstruments.com/hc/en-us/articles/15280829123087-How-to-Use-Key-Mode-for-Easy-Chord-Progressions),
[voicing and inversions](https://support.telepathicinstruments.com/hc/en-us/articles/15292199149839-Voicing-Engine-and-Inversions),
[extensions](https://support.telepathicinstruments.com/hc/en-us/articles/16576229505167-Chord-Extensions-Explained),
[playstyles](https://support.telepathicinstruments.com/hc/en-us/articles/15280843614863-What-s-the-Difference-Between-Playstyles),
[performance modes](https://support.telepathicinstruments.com/hc/en-us/articles/15280943220367-Exploring-Performance-Modes-Arp-Strum-Pattern-and-More),
[looping](https://support.telepathicinstruments.com/hc/en-us/articles/15280892559631-All-About-Loop-Mode-Recording-Overdubbing-and-Clearing),
and [Ableton MIDI routing](https://support.telepathicinstruments.com/hc/en-us/articles/15820303890831-How-to-Configure-your-DAW-to-Record-MIDI-from-Orchid-Ableton-Live).

## What makes Orchid an Orchid

Orchid is not merely a chord lookup table. Its design separates five jobs:

1. **Harmonic selection.** Manual chord types coexist with a Key Mode that derives a
   correct chord from the chosen root and scale.
2. **Harmonic decoration.** Four independent 6, minor-7, Major-7, and 9 controls add
   notes to the base chord and may be combined.
3. **Voice leading.** The chord voicing control repeatedly moves the lowest sounding
   chord tone up an octave or the highest down an octave. It changes register and
   inversion without changing harmonic identity.
4. **Performance transformation.** Strum, two-octave strum, Slop, arpeggiators,
   Pattern, and Harp transform a held chord into timed events synchronized to tempo.
5. **Arrangement and sound.** Dedicated chord/bass synthesis, effects, beats, tempo,
   MIDI streams, and a record/overdub/undo looper turn the chord engine into a complete
   sketch instrument.

The current firmware also distinguishes Simple, Advanced, and Free playstyles. Simple
takes a chord snapshot when the keyboard note is pressed. Advanced can turn a held
single note into a chord. Free permits repeated quality changes and retriggers.
Extension Addition may either add only the new extension note or retrigger the full
chord. Secret Chords, keyboard split/full-octave choices, velocity options, saved
loops, and separate performance/bass/raw-chord MIDI streams extend the same model.

The reusable idea is the separation between **what the chord is**, **how it is voiced**,
and **how it is performed**. The Push device follows that separation instead of
copying Orchid's enclosure, synth presets, or menu structure.

## Capability disposition

| Orchid capability | Push/Live adaptation | Current disposition |
| --- | --- | --- |
| Key Mode | All 32 musical pads derive degrees 1–8 from Live's current root and scale | Implemented |
| Manual qualities | Major/Minor/Dim/Sus on A8–D8 and Augmented/Power/Quartal/Dominant on A7–D7; last-held wins | Implemented |
| Extensions | 6/7/9 on E8/F8/H8; contextual 7 follows Auto scale or manual quality; G8 reserved | Implemented |
| Chord voicing dial | A6/B6/C6 move down/reset/up; D6 toggles deterministic Nearest mode | Implemented |
| Chord feedback | Device face names the chord, quality/extensions, inversion, and exact MIDI snapshot | Implemented |
| Bass engine and voicing | H7 adds a root bass voice; E7/F7/G7 move down/reset/up by octave | Implemented as MIDI; sound comes from Live |
| Simple playstyle | Chord pitch snapshot is fixed at note-on and modifiers affect future chords | Superseded and removed in 0.5.2 |
| Advanced/Free playstyles | Safe live mutation of held owners without duplicate or stuck notes | Quality/extensions are always live in 0.5.2; Free retrigger rules are excluded |
| Strum/Arp | Downstream Ableton MIDI devices after Push Chord Grid | Explicitly outside this device |
| Slop/Pattern/Harp and other timed transforms | Downstream Ableton MIDI devices where useful | Not proposed unless the Live workflow reveals a gap |
| Three synth engines and sounds | Any Push Standalone-compatible Live instrument after the MIDI effect | Live-native |
| Effects | Live audio effects after the instrument | Live-native |
| Beat machine | Drum Rack and Session clips | Live-native |
| BPM | Live Set tempo is the single clock | Live-native |
| Loop record/overdub/undo/save | Session clip recording, overdub, Capture MIDI, duplicate/save Set | Live-native |
| Separate performance/bass/raw MIDI | Multi-channel or multi-track routing design | Candidate follow-up |
| Secret Chords | Augmented, Power, Quartal, Dominant on A7–D7 | Implemented in 0.6.0 |
| Single-note/split keyboard | Conflicts with the requested four full chord rows | Intentionally excluded |

All 32 chord pads are velocity-sensitive. Version 0.4.4 correlates the raw physical
Push pad-note velocity with the matching matrix coordinate before chord generation, so
every newly sounding voice of the chord receives the strike velocity.

Timed performance transforms are not part of this device's roadmap. Strum and Arp are
explicitly delegated to downstream Ableton MIDI devices, which already own tempo-aware
event generation. Slop, Pattern, Harp, and similar transforms remain unproposed unless
the downstream Live workflow exposes a concrete missing capability. This boundary
keeps the snapshot/reference-count engine exact and lets performers choose or replace
their timing layer independently of the harmony engine.

## Implemented v0.4.6 follow-up

D7 originally toggled Nearest mode; version 0.6.0 moves it to D6. The first chord establishes history; each later press
chooses the lowest-scoring inversion within one rotation of that pad's row and manual
Voice baseline. Scoring is symmetric across every prior and candidate chord tone,
bass is excluded, and ties prefer the smallest adjustment then the lower signed step.
The device face shows the resolved chord, extensions, inversion decision, and exact
emitted note-name/MIDI-number snapshot. Version 0.5.2 supersedes the original immutable
hold semantics described here.

Version 0.4.7 corrects post-load Live scale observation by normalizing LiveAPI's
single-array callback shape. The current-state line now names the detected Live scale,
so automatic Key Mode changes are visible before the next chord press.

Version 0.5.0 hardens that surface for normal Live project use. Same-track duplicate
devices now resolve to one device-order owner; standby copies emit no matrix lighting
or grid-generated music, and every ownership transfer flushes notes and LEDs before
reacquisition. This changes project reliability, not Orchid-derived musical behavior.

Version 0.5.2 removes the legacy hold mode. Quality and extension edges always apply
to every sounding chord as one global owner transaction, preserving
press-time automatic harmony, inversion/bass placement, and strike velocity. Pitches
that remain globally owned emit no event. Free playstyle retrigger rules are not
copied; other controls stay future-trigger-only.

## Remaining proposed follow-ups

The user approved this remaining proposal set as product direction. It is intentionally
harmonic rather than rhythmic and remains unimplemented until separately requested:

1. Explore recallable performance snapshots for voicing, bass register, and extension
   state.
2. Explore Standalone-compatible separation of bass and chord MIDI paths.

Possible pad placements are design notes, not assigned coordinate roles. Reserved pads
remain silent until a proposal is accepted, implemented, documented, and covered by
the full automated and hardware gates.

## Exact v0.6.0 grid

Push coordinates use chess notation: A1 is bottom-left and H8 is top-right.

| Rank | A | B | C | D | E | F | G | H |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | Major | Minor | Dim | Sus | 6 | 7 | Reserved | 9 |
| 7 | Augmented | Power | Quartal | Dominant | Bass − | Bass −1 | Bass + | Bass on/off |
| 6 | Voice − | Voice 0 | Voice + | Nearest | Reserved | Reserved | Reserved | Reserved |
| 5 | Reserved | Reserved | Reserved | Reserved | Reserved | Reserved | Reserved | Reserved |
| 4 | Degree 1 +36 | 2 +36 | 3 +36 | 4 +36 | 5 +36 | 6 +36 | 7 +36 | 8 +36 |
| 3 | Degree 1 +24 | 2 +24 | 3 +24 | 4 +24 | 5 +24 | 6 +24 | 7 +24 | 8 +24 |
| 2 | Degree 1 +12 | 2 +12 | 3 +12 | 4 +12 | 5 +12 | 6 +12 | 7 +12 | 8 +12 |
| 1 | Degree 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |

“Bass −1” resets the bass to one octave below the chord root. Bass − and Bass + step
the bass register within −4 to +1 octaves. The chord voicing range is −16 to +16 tone
 moves. Voice, Nearest mode, and bass settings persist across focus changes.
Chord-type and extension pads are
momentary and are cleared on ownership loss so a modifier cannot become stuck.

## Harmonic rules

With no quality override, a chord stacks scale degrees 1/3/5 from Live's active scale.
For A natural minor this yields Am, Bdim, C, Dm, Em, F, G, and Am. H is degree 1 one
octave higher. Ranks 2–4 add 12/24/36 semitones where MIDI range permits.

Manual quality intervals from the chord root are:

| Control | Semitones |
| --- | --- |
| Dim | `0 3 6` |
| Min | `0 3 7` |
| Maj | `0 4 7` |
| Sus | `0 5 7` |
| Augmented | `0 4 8` |
| Power | `0 7` |
| Quartal | `0 5 10` |
| Dominant | `0 4 7 10` |

6 and 9 add `+9` and `+14`. Contextual 7 uses the press-time scale-stacked seventh
in Auto, `+11` for Major/Augmented, `+9` for Dim, and `+10` for other manual qualities.
Quartal/Dominant already contain +10, so 7 is idempotent. C Major with all three
extensions is `60 64 67 69 71 74`; C Minor is `60 63 67 69 70 74`.
Power is a dyad: Voice + produces `67 72` from `60 67`.

Positive chord voicing removes the current lowest chord tone and places it 12
semitones higher; negative voicing does the inverse to the highest tone. Extension
tones participate in chord voicing. The optional bass remains tied to the harmonic
root and follows its own octave state.

## Safety and compatibility

- Controls and reserved pads emit no note-on.
- Quality/extension edges atomically replace all sounding snapshots; scale, Voice,
  Nearest, bass, and octave changes affect future presses only.
- Shared pitches use reference counts and are released only by the final owner.
- Focus loss, disable, deletion, and Set close flush exact note-offs plus CC123.
- Momentary modifiers clear on lifecycle loss; persistent voicing and bass selections
  remain. Nearest mode remains enabled but its prior-chord history clears.
- Runtime dependencies remain Max-native objects, Max `js`, and the public Live Object
  Model. The downloaded manual snapshot and all development tooling stay outside the
  artifact.
