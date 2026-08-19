# Architecture

## Why Max for Live

The runtime target is a real-time MIDI effect hosted before an Ableton instrument on
both Live 12 and Push 3 Standalone. Push Standalone does not host VST/AU devices, and a
Live 12 MIDI Tool transforms clip data rather than the live performance stream. The
runtime artifact is therefore a Max for Live MIDI Effect (`mmmm` AMXD type).

## Why generated source

The patch is generated from Python so its complete object graph is reviewable,
testable, reproducible, and maintainable by an agent. Max is a runtime inspector and a
possible final freeze fallback, not the source of truth.

The initial generator is `m4l-builder` 0.8.0 pinned to commit
`6c602b2861bf628d14fd39854d984b12de3cebff`. It can emit the AMXD binary container,
native objects, patchlines, stored Live parameters, and Push parameter-bank metadata.
Because the dependency identifies itself as alpha software, successful loading in Live
is a mandatory infrastructure gate before further product work. Push Standalone testing
is deferred by user decision while standalone compatibility remains a constraint.

The generator normalizes Max project creation/modification timestamps to a fixed value.
This removes host-irrelevant wall-clock metadata so independent builds produce the same
AMXD bytes and checksum.

## WP2 graph

```text
midiin ───────────────▶ midiout

Base Octave ──────────▶ private Max send (stored value sink only)

live.thisdevice ──▶ native Push bridge ──▶ push-grid-adapter.js
       │              │       ▲                    │       │
       │              │       └── own/release ─────┘       │
       └──▶ initialized/enabled + selected-track observer   │
                                                            ▼
                                     last-pad and lifecycle displays
```

The parameter's private send prevents an orphaned-control warning but is not connected
to the MIDI path. Raw MIDI byte passthrough is used instead of `notein`/`noteout`, so the smoke test does
not intentionally discard controller, pressure, pitch-bend, program, clock, or SysEx
messages.

The generated native bridge follows Live's public LOM message flow:
`path live_app` → `property control_surfaces` → `zl iter 2` → `live.object gettype`.
It selects `Push2` or `Push3`, resolves `Button_Matrix` with `call get_control`, and
observes the matrix through `live.observer value`. Live assigns control-surface and
control objects valid nonzero IDs that may be negative; the connected Push 3 was `-2`
and its matrix was `-12`. Treating those IDs as positive-only was the discovery defect
found during hardware integration.

JavaScript compares `this_device canonical_parent` with
`live_set.view.selected_track`; only the enabled instance on that track opens the native
event gate and requests `call grab_control id <matrix-id>` on the Push surface object.
Deselection and disable close the gate and call `release_control id <matrix-id>` on that
same surface immediately. The native observer refreshes discovery on surface-list
changes, a one-second selected-track watchdog recovers focus after Set reload, and an
enable event explicitly re-runs native discovery before the new ownership settles.
The device-face **Reload Grid** button first sends a `reload` lifecycle to flush notes
and clear LEDs, releases any stale matrix owner, then defers a complete Push/matrix
rediscovery. A successful result takes ownership again and repaints all 64 pads.

Push matrix callbacks have the shape `value velocity x y ...`. Push's physical row 7
is the bottom row, so chess rank is `8 - y`; file is `A + x`. The adapter stores the
latest velocity in `GridState[x][y]`. For chord ranks, v0.4.4 also parses the raw Push
pad note stream: notes `36–67` map bottom-left A1 through top-right H4. Since Live API
notifications are deferred, the raw strike velocity is cached first and correlated
with the matching matrix press; it replaces a fixed matrix value only when coordinate
and press/release state agree. The matrix value remains the fallback. WP2 sends
normalized events only to the device display and does not emit MIDI or LED updates.
That remains the accepted adapter baseline; the integrated WP4 runtime returns LED
values through a separate native-bridge inlet.

The JavaScript is embedded in a reproducibly frozen AMXD. The dependency cache declares
the script, the frozen footer contains exactly that script, and the manifest reports no
unembedded runtime dependency.

## WP4 integrated graph

```text
live_set root/scale observers ───────────────┐
Base Octave parameter ──────────────────────┤
Reload Grid button ─▶ release + rediscover ─┤
                                            ▼
Push matrix ───────────────┐
raw pad velocity (36–67) ──┴▶ grid adapter ─▶ coordinate router ─▶ WP3 musical engine
                              │              │                 ├▶ nearest-history scorer
                              │              │                 ├▶ exact chord feedback
                              │              │                 ├▶ active snapshot stack ─▶ Playing
                              │              │                 │
                              │              └───────────────▶ active-note flush
                              └──────────────────────────────▶ LED state/diff cache
                                                                  │
                     acquire/release ◀── clear-before-release ─────┘
                                                            note/CC lists ─▶ midiformat
external MIDI ────────────────────────────────────────────────────────┤
                                                                    ▼
                                                                 midiout
```

`live-scale-adapter.js` observes `root_note`, `scale_intervals`, `scale_name`, and
`scale_mode` on `live_set`. Root and interval snapshots drive the pitch engine; name
and mode are retained as observed metadata. Scale Mode being off does not replace the
last Live root/scale values. LiveAPI delivers observed changes as a single array
argument, while initial `get` values may be direct or property-prefixed; the adapter
normalizes both shapes before parsing and forwarding one complete scale snapshot.

`runtime-adapter.js` is the only coordinate-to-music boundary. It classifies all 64
pads: 32 chords, four quality controls, four extension controls, three chord-voicing
controls, one Nearest control, three bass-register controls, one bass toggle, and 16
reserved pads. Controls
and reserved pads return no note-on. Musical presses enter
the accepted WP3 engine, and releases use the exact stored owner snapshot.

The same adapter maps all 64 coordinates to Push palette values. A new matrix owner
receives one complete frame; control changes, holds, releases, scale changes, and base
octave changes then emit only values that differ from the cache. Reserved pads remain
explicitly off. Before ownership release, every active device color is sent as zero.
The native bridge targets the resolved matrix via `call send_value x y color`, a
pattern proven by an installed Push-aware device and supported by the public LOM.

Generated notes enter `midiformat`'s note inlet; CC123 enters its control-change inlet.
The resulting raw bytes merge with unchanged external MIDI at `midiout`. Focus loss or
disable flushes active notes before the adapter releases the matrix. Manual reload
performs the same flush before rediscovery. Max's deletion notification performs the
same flush for device deletion and Set teardown.

All six JavaScript runtime files are embedded in the reproducibly frozen AMXD.

### Push playing display

`runtime-adapter.js` keeps a coordinate-keyed map of the same immutable snapshots
used for musical presses plus a newest-held order. Its sixth outlet emits a
deterministic code whenever a chord is pressed, retriggered, released, or flushed.
Code 0 is `--`; codes 1–960 cover 12 roots, five resolved qualities, and all 16
6/m7/M7/9 masks. Releasing the newest overlap exposes the previous stored snapshot,
so current controls or scale changes cannot relabel a chord that is still sounding.

The generated graph sends the code through `prepend set` to an inactive,
non-mappable `live.tab` named **Playing**. The first Push bank is exactly **Base
Octave**, **Playing**, then six empty slots. This uses Live's public device-parameter
bank rather than a private control-surface notification or Remote Script. The
`live.tab` has no outgoing patchline and cannot affect MIDI, LEDs, ownership, or
harmony state. Lifecycle cleanup clears the active display map and emits `--` along
with the existing note/LED release.

## WP5 Live hardening

Each `push-grid-adapter.js` instance registers a flat numeric member record in the
named Max `Global("push_chord_grid_wp5")`. Flat records are deliberate: Live's Max
runtime did not preserve the first nested-object registry implementation. A named
`receive push_chord_grid_arbitration` object connects a deferred reconciliation bus to
every generated instance; deferral avoids the synchronous recursive broadcast that
Live exposed as a Max JavaScript stack overflow.

Members publish Live device ID, parent track ID, visible device-order index,
enablement, Push/matrix availability, and heartbeat. On the selected track, the first
eligible registered device in chain order wins, with device ID as a stable tie-break.
Registrations and leases older than three seconds are discarded. The shared state
contains only arbitration metadata: scale state, modifiers, nearest history, active
note owners, velocity correlation, and LED diff caches remain per instance.

Transfer is two-phase. If the winner changes, the old owner first executes the normal
lifecycle flush, sends zero to its owned LEDs, releases the native `Button_Matrix`,
and clears the global lease. Only then can the new winner claim the lease, grab the
matrix, and repaint one complete frame. Standby instances show `duplicate standby`,
receive no gated matrix events, and emit no grid-generated MIDI or LED commands.

The reviewed WP5 Set is a binary release input at
`release/PushChordGrid-v0.5.1-RC Project/PushChordGrid-v0.5.1-RC.als`. It contains one
source chain—Push Chord Grid, MIDI Monitor, then Live's Arpeggiator—and one armed,
Monitor-In Drift destination fed from the source's Post FX MIDI. The manifest hashes
both AMXD and Set. Deterministic packaging copies their
exact bytes with fixed ZIP metadata, enforces a closed inventory, and writes AMXD/ZIP
SHA-256 sidecars. Producer Pal, network access, and desktop helpers are neither runtime
dependencies nor release-Set contents.
Runtime dependencies remain limited to native Max, Max `js`, and the public Live Object
Model.

## WP3 deterministic core

The pure ES5-compatible core has four boundaries:

```text
Live scale snapshot ─▶ harmony/state ─▶ diatonic chord pitch snapshot
                                             │
physical pad owner + velocity ───────────────▼
                                      active-note manager ─▶ plain MIDI events
                                             ▲
focus loss / disable / delete / Set close ───┘
```

`harmony.js` treats `scale_intervals` as root-relative, strictly increasing values
whose first degree is `0`, matching the Live Object Model. Auto chords stack scale
degrees 1/3/5, deriving major, minor, diminished, and modal qualities directly from
Live. Momentary manual types use fixed Dim/Min/Maj/Sus intervals; independent
extensions add +9/+10/+11/+14 semitones for 6/m7/M7/9. Voicing repeatedly raises the
lowest or lowers the highest chord tone by an octave. Optional bass follows the chord
root through a separate octave state. H is tonic +12. Ranks 1–4 add 0/12/24/36
semitones to the Base Octave, whose Live label convention makes C3 MIDI 60.

When D7 Nearest mode is on, `harmony.js` scores the manual-voicing baseline plus every
MIDI-safe inversion within one chord rotation against the prior chord-tone snapshot.
The symmetric score sums each side's distance to its closest opposing tone; ties keep
the smallest absolute adjustment and then the lower signed adjustment. Bass is added
after selection and cannot steer the inversion. Mode/manual-voicing/scale/Base Octave
changes and lifecycle flushes clear history; ordinary release does not.

`state.js` owns only future-trigger state: Live scale, Base Octave, momentary chord
type/extensions, persistent chord/Nearest/bass voicing, and the prior chord-tone
snapshot. The generated snapshot also carries root, resolved quality, extensions,
inversion adjustment, chord tones, and final pitches to the dedicated feedback line.
`runtime-adapter.js` separately indexes those immutable snapshots while they are held
for the Push **Playing** display; ordinary release removes only active display state
and leaves last-chord feedback intact. A held pad's pitch array is copied
into `active-notes.js`; later state changes therefore cannot change its release. Each
pitch is emitted on the first
owner transition from zero to one and released on the last transition from one to zero.
A repeated press from the same owner releases its old snapshot before taking the new
one. All loss-of-ownership lifecycle events emit the exact remaining note-offs in
ascending pitch order, then CC123 All Notes Off, and clear all ownership state.
