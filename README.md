# Push Chord Grid

Push Chord Grid is a generated Max for Live MIDI Effect targeting Ableton Live 12 and
Push 3 Standalone. WP1–WP4 are accepted. The WP4 build combines the
proven Push matrix adapter with the deterministic musical engine and emits generated
MIDI for a downstream instrument or recording track.

The 8×8 surface has exactly one role per coordinate: ranks 1–4 each play scale-degree
chords 1–8, with every higher rank one octave above the last. Live's current root and
scale automatically determine every default chord quality and pitch. Inspired by
Telepathic Instruments Orchid, A8–D8 momentarily override Dim/Min/Maj/Sus, E8–H8 add
independent 6/m7/M7/9 notes, and rank 7 controls inversion and an optional root bass
voice. D7 toggles a persistent Nearest mode that chooses the closest deterministic
inversion to the previously triggered chord while preserving the selected octave row
and manual Voice baseline.
Held pads retain exact pitch snapshots; shared pitches are reference-counted; focus,
disable, and deletion lifecycles flush active notes plus CC123.

Version 0.4.4 correlates each lower-half physical Push pad's raw strike velocity with
its matrix coordinate before generating a chord. Every note in that chord receives
the pad velocity; the matrix callback remains a safe fallback, and external MIDI
continues through unchanged.

Version 0.4.5 makes grid recovery explicit. Re-enabling the device automatically
rediscovers Push before reacquisition, and the device face includes a **Reload Grid**
button that safely flushes notes, releases stale ownership, rediscovers the matrix,
reacquires it, and repaints the complete LED frame.

Version 0.4.6 adds nearest voice leading and a dedicated last-chord display. The
display names the resolved chord, extensions, manual/nearest inversion, and the exact
note-name/MIDI-number snapshot sent to ownership and recording. D7 and all other
controls remain silent MIDI controls.

Version 0.4.7 fixes live scale changes after device initialization. LiveAPI observer
callbacks are normalized in their actual array-wrapped runtime shape, and the device
face now shows the detected scale (for example, `Scale C Minor`) before the current
chord controls.

The owned grid is state-lit: active modifiers, voicing, and bass state use an accent;
chord pads share a blue family with distinct tonics; held musical pads turn white; and
reserved pads remain off. Rendering sends one complete frame after
matrix acquisition, then only changed pads, and clears device colors before release.

Push Standalone testing remains deferred to WP6 by user decision. WP4 uses only native
Max, Max `js`, and the public Live Object Model, preserving standalone compatibility.

## Build

Requirements: Python 3.11+, Node 23.11.0, Git, and network access for the one-time
bootstrap.

```bash
make bootstrap
make test
make build
make validate
make package
```

Outputs:

- `dist/PushChordGrid.amxd` — self-contained WP4 integration device
- `dist/manifest.json` — deterministic artifact metadata and checksum
- `dist/PushChordGrid-WP4.zip` — ready-to-install hardware-test bundle

Open the self-contained [usage and proposed-feature guide](docs/USAGE_GUIDE.html) in a
browser for the interactive 8×8 map, concrete chord examples, current controls, and
the scoped follow-up roadmap. The release bundle includes that guide, the exact
hardware card, and the [Orchid capability/adaptation study](docs/ORCHID_ADAPTATION.md).
The official public manual snapshot retained for research reproducibility is not a
runtime dependency.

Strum and Arp are intentionally handled by downstream Ableton MIDI devices rather than
embedded here. Push Chord Grid owns harmony, extensions, voicing, and bass; Live's
composable MIDI-effect chain owns timed transformations.

The local acceptance workspace also contains the MCP-maintained
`dist/PushChordGrid-WP1-Test Project/PushChordGrid-WP4-Test.als` with the source,
Post-FX recording route, and Drift destination. It is test evidence, not a reproducible
release artifact produced by `make`.

## WP4 hardware evidence

The MCP-configured test Set contains only **Producer Pal Control**, **Push Chord
Grid**, and an armed **Chord Recorder + Drift** track fed from Post FX. The agent
installed v0.4.5 and completed Live-side scale, focus, routing, automatic
disable/re-enable recovery, and manual Reload Grid checks. The device returned to
`Status: matrix acquired` after both recovery paths. The user confirmed the complete
musical interaction before reporting the now-corrected dark-grid recovery defect.

## Status

WP4's automated gate covers every coordinate role, no-trigger controls/reserved pads,
automatic and manual chord golden vectors, all four Orchid extensions, inversion,
bass, note ownership and lifecycle flushes, Live scale callback normalization, frozen
artifact structure, forbidden dependencies, manifest completeness, and byte-for-byte
reproducibility.

WP4 was accepted on 2026-08-17 after the user confirmed the hardware interaction works
great. Version 0.4.1 added the requested LED renderer, 0.4.2 added the four-row
automatic diatonic chord layout, and 0.4.3 adds the Orchid harmonic surface without
beginning WP5. Version 0.4.4 fixes physical chord-pad velocity propagation and records
the proposed harmonic feature set as approved direction. Version 0.4.5 adds automatic
and manual grid recovery without implementing WP5.
Version 0.4.6 implements the approved P1 nearest-voice-leading mode and clearer
snapshot feedback. Version 0.4.7 repairs live scale-change observation and makes the
detected scale visible without beginning WP5; Advanced holds, Secret Chords,
performance snapshots, and split output remain separate future changes.
