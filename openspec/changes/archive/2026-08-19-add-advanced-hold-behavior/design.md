## Context

The original runtime gave every chord press an immutable musical snapshot.
`active-notes.js` copies that pitch set into a physical-pad owner and uses global
pitch reference counts, while `runtime-adapter.js` separately tracks snapshots for
Last and Push Playing feedback. Exact ownership remains necessary, but immutable
quality and extension state is no longer a supported playstyle.

Live hold behavior applies to rank-8 momentary quality and extension edges only. It
must transform all held chord owners together, because updating owners one at a time
can create an audible note-off/note-on transient when a pitch moves between
overlapping owners. Push 3 Standalone compatibility, the generated Max source model,
public Live Object Model boundary, and existing ownership lifecycle remain mandatory.

## Goals / Non-Goals

**Goals:**

- Make live quality/extension mutation the only hold behavior, with no mode parameter
  or legacy immutable/Simple path.
- Retarget all held chord owners on actual quality or extension state changes while
  emitting only the global before/after pitch difference.
- Preserve every owner's original root, row, automatic diatonic triad, manual/Nearest
  placement, bass choice, and physical strike velocity.
- Keep active snapshots, Playing, Last, Nearest history, note ownership, and LED state
  synchronized with what is actually sounding.
- Preserve exact overlap, retrigger, release, duplicate arbitration, and lifecycle
  cleanup behavior.

**Non-Goals:**

- Mutating held chords when Live scale, Base Octave, Voice, Nearest, or bass changes.
- Reassigning a grid coordinate or adding Secret Chords, snapshots, split output,
  strum, arp, timed transforms, or WP6 Standalone acceptance.
- Using a Remote Script, private Push API, external object, network call, helper
  service, User Mode, or MIDI mapping.

## Decisions

### Live held-chord mutation is the only behavior

The runtime has no Hold Mode state or handler, and the generator exposes no Hold Mode
parameter. Every actual rank-8 quality or extension state edge retargets current held
chords. This avoids an unnecessary device setting and prevents saved Sets from
silently restoring the discarded immutable/Simple playstyle. Push's first bank
therefore remains Base Octave, Playing, and six empty slots.

### Press snapshots retain the ingredients needed for deterministic retargeting

Each chord snapshot adds its press-time automatic root-position triad and resolved
automatic quality, plus bass enabled/octave state. Retargeting chooses either that
stored automatic triad or a fixed manual-quality triad, applies the current extension
mask, then reapplies the stored manual voicing and exact stored Nearest adjustment.
Bass is re-added from the stored press choice.

This avoids consulting the current Live scale or other future-trigger state. It also
means releasing the final manual quality control returns every sounding owner to the
automatic diatonic chord it had when pressed, even if Live's scale changed meanwhile.
Re-running Nearest scoring was rejected because control order and overlapping holds
would then change inversion identity unpredictably.

### Held owners are replaced as one transaction

`active-notes.js` gains a batch retarget operation. It validates and normalizes every
replacement first, builds the complete prospective owner map and global pitch counts,
then commits once. MIDI output is the sorted global difference: all pitches whose
count becomes zero emit note-off, followed by all pitches whose count rises from zero
emit note-on. Pitches present in both global states emit nothing, regardless of which
owner now references them.

Each replacement includes its owner's original physical velocity. If multiple held
owners introduce the same previously silent pitch in one transaction, the newest-held
owner supplies the single note-on velocity. This matches Playing ownership, is fully
deterministic, and cannot double-trigger a shared pitch. Sequential `releaseOwner`
plus `pressOwner` was rejected because it can create transient release/retrigger pairs.

### Runtime feedback follows the committed sounding snapshots

After a successful transaction, every active snapshot is replaced, the newest-held
snapshot becomes Last and Playing, and enabled Nearest history is updated to that
newest sounding chord's chord-tone array for the next chord press. Control LEDs remain
derived from momentary state.

All existing lifecycle paths clear held recipes and velocities alongside owners,
blank Playing/Last, reset momentary controls, emit exact note-offs plus CC123, and
leave no hidden hold-style state to restore.

## Risks / Trade-offs

- [A shared pitch changes owners during a modifier edge] → Compare complete global
  count maps before committing and emit no event for a pitch present on both sides.
- [A new shared pitch has several source velocities] → Use the newest-held owner's
  retained strike velocity and lock that choice with golden vectors.
- [Live scale changes during a hold] → Store the automatic triad at press time and
  never rebuild a held owner from current scale state.
- [Nearest placement changes when chord size changes] → Reapply the exact signed
  press-time adjustment rather than running history-dependent scoring again.
- [Live mutation weakens cleanup] → Retain the same owner table and lifecycle
  seam, and add mutation-plus-focus/reload/disable golden tests.

## Migration Plan

Build the source-derived device as v0.5.2 RC, install the byte-identical artifact,
replace the release-Set instance without disturbing downstream MIDI devices or
routing. Validate the complete generated parameter bank, runtime payload,
deterministic package, dependency inventory, and release Set.
Rollback is replacement with the retained v0.5.1 artifact or Live's automatic backup.

## Open Questions

None. Physical pad/screen feel is a final hardware observation, not an unresolved
implementation decision.
