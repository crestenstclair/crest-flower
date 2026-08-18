# WP1 hardware acceptance card

Artifact: `dist/PushChordGrid.amxd`

Do not edit or freeze the device for this test. If a step fails, return the exact error,
a screenshot, or the relevant Live/Max log; the agent will regenerate the artifact.

## 1. Live load and passthrough

1. Create a MIDI track in Live 12.
2. Place `PushChordGrid.amxd` before a stock instrument.
3. Play at least one soft note, one hard note, and use pitch bend or another available
   expressive control.

Expected: the device loads without a missing-object warning; the instrument receives
the same pitches, velocities, channels, and expression data; **Base Octave** is visible
and defaults to `3`.

Result: `[x] PASS  [ ] FAIL`

Observed result/error: The generated device loaded before Drift. Producer Pal launched
the four-note test clip; Live reported active MIDI output and a `-7.91 dB` peak on the
instrument track on 2026-08-17.

## 2. Stored parameter

1. Change **Base Octave** from `3` to `5`.
2. Save the Set, close it, and reopen it.

Expected: **Base Octave** returns as `5`. MIDI remains unchanged because this parameter
is intentionally inert in WP1.

Result: `[x] PASS  [ ] FAIL`

Observed result/error: Base Octave persisted at `5` after save and reopen, confirmed by
the user on 2026-08-17.

## 3. Push 3 Standalone — deferred

Deferred by user decision on 2026-08-17 to avoid switching repeatedly between Control
Mode and Standalone. Do not block WP1 on this check. Preserve standalone-safe runtime
constraints and consolidate standalone acceptance into a later test only if requested.

## Gate decision

`[x] WP1 accepted — WP2 may begin when requested`

`[ ] WP1 rejected — return evidence to the agent; do not edit the patch`
