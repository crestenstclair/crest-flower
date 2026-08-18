# Deterministic core (WP3, integrated in WP4)

These ES5-compatible modules are the Push-independent musical engine:

- `harmony.js` maps Live root-relative scale intervals to automatic chords, manual
  qualities, extensions, inversions, and bass;
- `state.js` owns momentary harmonic selection plus persistent voicing/bass state; and
- `active-notes.js` snapshots every physical owner, reference-counts shared pitches,
  and applies the same exact note/CC123 flush to focus, disable, reload, and teardown.

The core emits plain event data. WP4's `runtime-adapter.js` connects it to the proven
matrix adapter and native Max MIDI output. Development tests use Node, but the artifact
runtime uses only Max-native objects and Max `js`; Node is not a runtime dependency.
