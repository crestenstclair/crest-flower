# Deterministic core (WP3)

These ES5-compatible modules are the Push-independent musical engine:

- `harmony.js` maps Live root-relative scale intervals to degree roots and chords;
- `note-layout.js` builds the overlapping-fourths three-row layout;
- `state.js` owns the latching quality and independent extension selections; and
- `active-notes.js` snapshots every physical owner and reference-counts shared pitches.

The core emits plain event data. WP4 will connect that data to the proven matrix adapter
and Max MIDI output. Development tests use Node, but the artifact runtime will continue
to use Max-native objects and Max `js`; Node is not a runtime dependency.
