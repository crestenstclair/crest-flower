# Max runtime adapters

`push-grid-adapter.js` is the matrix runtime proven in WP2. It dynamically discovers Push,
owns and observes `Button_Matrix` according to device/track lifecycle, and normalizes
callbacks to A1–H8. For chord ranks, it also correlates Max-native `midiparse` note
messages `36–67` with the matching deferred matrix event so the raw physical strike
velocity drives the generated chord. It is embedded into the frozen AMXD during
generation.

Device enablement also triggers fresh native discovery. The momentary **Reload Grid**
control sends a safe reload lifecycle, releases stale ownership, rediscovers Push and
`Button_Matrix`, then reacquires and schedules a complete LED repaint.

`live-scale-adapter.js` observes the four Live Set scale properties, normalizes both
initial values and LiveAPI's array-wrapped change callbacks, and forwards complete
root/interval snapshots.
`runtime-adapter.js` assigns every coordinate one role, implements Orchid-style
momentary qualities/extensions plus persistent voicing/bass controls, consumes every
control/reserved pad, and connects musical pads to the WP3 snapshot/reference-count
engine. A8–D8 and A7–D7 form one eight-quality momentary stack; E8/F8/H8
provide 6/contextual 7/9 and G8 is reserved. Voice moves to A6–C6. D6 is an
edge-safe Nearest toggle, and the adapter formats current settings
plus the exact last generated chord snapshot on separate device-face lines. Quality
and extension edges always retarget held owners as one atomic core transaction while
preserving press context and velocity; no legacy hold mode is exposed. Its note
and CC events are formatted by native Max objects. The same adapter
derives a 64-pad LED frame from musical state and held owners, caches the last color
per coordinate, and emits only differences after its acquisition repaint. The native
bridge converts each `x y color` list to `call send_value x y color` on
`Button_Matrix`.

The sixth runtime outlet drives the inactive, non-mappable Push **Playing** enum.
The first device bank is Base Octave, Playing, then six empty slots.

Exported pure functions are exercised by Node's built-in test runner; Node is
development-only and is never part of the runtime artifact.
