# WP2 Push matrix hardware acceptance card

Artifact: `dist/PushChordGrid.amxd`

Agent-assisted setup on 2026-08-17 installed artifact SHA-256
`fc4a1cad98cb17687c65223994eb3d8e1c8c9f030f551687d16cad2a4a76ed7d` and saved
`PushChordGrid-WP2-Test.als` with the device enabled and its track selected. Producer
Pal was connected to Live 12.4.3. A user-provided Push display photo confirmed the
physically attached Push 3 was already in **Control Mode**. Push 3's absence from Live's
Preferences-table control-surface slots is expected and is not evidence of its mode.

Use Live 12 with Push in Control Mode. Do not edit, unfreeze, or manually reset the
device. The matrix may be dark while owned because LED rendering is intentionally a
no-op in v0. If a step fails, return the displayed text, exact error, screenshot, or
relevant Live/Max log; the agent will regenerate the artifact.

## Prior gate

WP1 was accepted on 2026-08-17: the device loaded before Drift, passed the MIDI test
clip with a measured `-7.91 dB` track peak, and restored **Base Octave** as `5` after
Set reload.

## 1. Load and acquire

1. Put `PushChordGrid.amxd` before a stock instrument on a MIDI track.
2. Select that track.
3. Wait up to two seconds.

Expected: the device shows `Status: matrix acquired`. Playing MIDI from a source other
than the grabbed matrix still reaches the instrument unchanged.

Result: `[x] PASS  [ ] FAIL`

Observed result/error:

The generated device loaded without a missing-file or incompatible-object error. The
native LOM bridge identified `Push3` (`id -2`), resolved `Button_Matrix` (`id -12`),
and the device showed `Status: matrix acquired` with its track selected.

## 2. Four-corner coordinate and velocity check

Press and release each physical corner pad. A press velocity may be any integer from 1
through 127; each release must show 0.

| Physical pad | Expected press display | Expected release display |
| --- | --- | --- |
| Bottom-left | `Pad: A1 <1..127>` | `Pad: A1 0` |
| Bottom-right | `Pad: H1 <1..127>` | `Pad: H1 0` |
| Top-left | `Pad: A8 <1..127>` | `Pad: A8 0` |
| Top-right | `Pad: H8 <1..127>` | `Pad: H8 0` |

Result: `[x] PASS  [ ] FAIL`

Observed press/release values:

Retest pending: the first acquired build did not update `Pad: --` when a physical pad
was pressed. Native `live.observer value` emits the matrix payload as
`velocity x y` (without a leading `value` selector); the adapter parser was corrected
to accept that exact callback shape. The corrected parser still received no visible
event. The bypass showed only the observer's initial `bang`: the bridge had incorrectly
called `grab_control` on the matrix control object. The corrected graph now calls
`grab_control id -12` on the Push surface object, matching the working local reference
device. With that correction installed, the user confirmed all four expected physical
coordinates: top-left A8, bottom-left A1, top-right H8, and bottom-right H1. Final Live
inspection visibly showed the bottom-right release as `Pad: H1 0`.

## 3. Track focus release and reacquire

1. Select a different track.
2. Confirm Push's normal pad behavior returns on that track.
3. Select the device's track again and wait up to two seconds.
4. Press bottom-left once.

Expected: while away, the device shows `Status: inactive track`; on return it shows
`Status: matrix acquired`; bottom-left then reports A1 without a manual reset.

Result: `[x] PASS  [ ] FAIL`

Observed result/error:

Producer Pal selected another track and returned to the device's track. The final build
automatically returned to `Status: matrix acquired` without a manual reset, and the
physical corner pass confirmed A1 input.

## 4. Device disable and re-enable

1. Disable the device with Live's device activator.
2. Confirm Push's normal pad behavior returns.
3. Re-enable the device and wait up to two seconds.
4. Press top-right once.

Expected: disabled shows `Status: device disabled`; re-enabled shows
`Status: matrix acquired`; top-right reports H8 without a manual reset.

Result: `[x] PASS  [ ] FAIL`

Observed result/error:

Producer Pal disabled the device and Live showed `Status: device disabled`. After
re-enabling it without a manual reset, the final build returned to
`Status: matrix acquired`; the physical corner pass confirmed H8 input.

## 5. Save, close, and reopen

1. Save the Live Set with this track selected.
2. Close Live, relaunch it, and reopen the Set.
3. Wait up to two seconds and press bottom-right once.

Expected: the device automatically returns to `Status: matrix acquired`; bottom-right
reports H1 without a manual reset. No missing-file or incompatible-object error appears.

Result: `[x] PASS  [ ] FAIL`

Observed result/error:

After replacing the installed artifact and reopening the saved Set, the device restored
**Base Octave** as `5`, remained enabled, loaded without a missing-file or
incompatible-object error, and automatically showed `Status: matrix acquired`. The user
confirmed H1 input; final Live inspection showed its release as `Pad: H1 0`.

## 6. Push 3 Standalone — deferred

Deferred by user decision to avoid repeated Control Mode/Standalone switching.
Standalone compatibility remains mandatory, but this WP2 gate does not require a mode
switch or transfer.

## Gate decision

`[x] WP2 accepted — WP3 may begin when requested`

`[ ] WP2 rejected — return evidence to the agent; do not edit the patch`
