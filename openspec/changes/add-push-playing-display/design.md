## Context

Push Chord Grid already derives an immutable chord snapshot for every pad press and
uses that snapshot for MIDI note ownership and the exact feedback shown in Live. The
first Push parameter bank currently exposes only `Base Octave`, so the performer
cannot identify the held chord from Push itself.

The public Live Object Model exposes control acquisition and MIDI operations but no
stable Push notification API. Push does display device parameters from parameter
banks, however, and Max for Live can expose an enum parameter without accepting
performer edits. The display feature must therefore use the public parameter-bank
path and must not depend on Ableton Remote Script internals.

## Goals / Non-Goals

**Goals:**

- Show the exact currently held chord on Push, including resolved quality and every
  active 6, minor-7, major-7, and 9 extension.
- Give overlapping holds deterministic display ownership: newest held wins, and
  releasing it reveals the previous held chord.
- Return the display to `--` after the final release and every lifecycle flush.
- Preserve all accepted MIDI, velocity, LED, scale-observation, focus, reload, and
  duplicate-instance behavior.
- Generate, validate, test, install, and package the display through the same
  source-derived release workflow as the rest of the device.

**Non-Goals:**

- Push pop-up notifications, custom graphics, animation, Remote Script changes, or
  undocumented control-surface methods.
- Displaying incoming MIDI, Ableton instrument state, or inactive historical chords.
- Strum, arpeggiator, or other new musical-generation behavior.

## Decisions

### `Playing` is a read-only enum in Push parameter-bank slot 2

The generated device exposes a Max `live.tab` parameter named `Playing` immediately
after `Base Octave` in the first bank. It is inactive and non-mappable, and runtime
updates use `set`, so the display is device-owned rather than a playable control. Push
renders the parameter name and current enum label using its normal device view.

This is the only documented, standalone-compatible route that does not require a
private Push Remote Script API. A transient notification was rejected because the
public ControlSurface Live Object Model does not define one; a custom Push surface
script would violate the runtime boundary.

### Display state follows exact active snapshots, not current global controls

The runtime stores each held chord's immutable snapshot in an active coordinate map
and records held-coordinate recency separately. On press, the coordinate becomes the
newest display owner. On release, it is removed and the newest surviving held
coordinate becomes visible. The display therefore continues to identify what is
actually sounding even if scale, quality, inversion, voicing, or extension controls
change during a hold.

The existing last-chord feedback remains independent and continues to persist after
ordinary release. Display tracking adds no note data, ownership counts, or MIDI side
effects.

### Enum values use a deterministic complete chord-label table

Code `0` means `--`. Remaining codes cover 12 pitch classes, five resolved quality
labels (`major`, `minor`, `diminished`, `suspended`, and the unusual-scale `auto`
fallback), and all 16 extension masks. The deterministic mapping is:

`1 + rootPitchClass * 80 + qualityIndex * 16 + extensionMask`

Labels use compact Push-readable spelling such as `C`, `Cm`, `Cdim`, `Csus`,
`C +6+9`, or `Cm +m7+9`. JavaScript behavior tests and Python artifact validation
generate the same table independently and assert the exact parameter metadata and
bank position.

### Lifecycle cleanup owns the blanking guarantee

Every existing ownership-loss path already reaches the runtime lifecycle handler.
That handler clears active display snapshots alongside held note owners and emits code
`0`. A standby duplicate receives no grid events, so it cannot claim display state;
when an owner loses focus, disables, reloads, is deleted, or loses the shared lease,
its visible value returns to `--` before another instance can acquire.

## Risks / Trade-offs

- [Push truncates long parameter labels] → Use compact note, quality, and extension
  spellings and keep `Playing` as the fixed parameter name.
- [A scale reports an unusual chord quality] → Preserve the existing exact
  snapshot and expose the deterministic `auto` fallback instead of guessing a common
  quality.
- [A display parameter could accidentally become performer-editable] → Generate it
  inactive and non-mappable, drive it only through `set`, and statically validate
  those attributes and wiring.
- [Display tracking could diverge from sounding notes] → Populate it from the same
  immutable snapshot returned by the musical press path, and test overlaps, control
  changes, retriggers, and lifecycle flushes against exact vectors.
- [MCP cannot visually inspect physical Push pixels] → Verify the public parameter
  bank, runtime values, installed artifact, and Live device state automatically; keep
  the single physical screen observation explicit in the hardware card.

## Migration Plan

Build the feature as v0.5.1, install the byte-identical AMXD, replace the device in the
clean release Set, and verify the first Push bank contains `Base Octave` and `Playing`.
Exercise exact runtime display vectors and lifecycle clearing, save the updated release
Set, then emit a reproducible v0.5.1 release-candidate package and checksums. Rollback
is replacement with the retained v0.5.0 release artifact or Live's automatic backup.

## Open Questions

None. Physical confirmation that the label is legible on the Push panel is an
acceptance observation, not an implementation decision.
