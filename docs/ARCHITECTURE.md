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

## WP1 graph

```text
midiin ───────────────▶ midiout

Base Octave ──────────▶ private Max send (stored value sink only)
```

The parameter's private send prevents an orphaned-control warning but is not connected
to the MIDI path. Raw MIDI byte passthrough is used instead of `notein`/`noteout`, so the smoke test does
not intentionally discard controller, pressure, pitch-bend, program, clock, or SysEx
messages.

## Future runtime boundaries

After the WP1 gate, the planned runtime layers are Push discovery/grid ownership, focus
management, Live scale observation, coordinate routing, deterministic harmony/state,
active-note ownership, and MIDI output. Runtime dependencies remain limited to native
Max, Max `js`, and the public Live Object Model.
