"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const active = require("../../src/core/active-notes.js");
const harmony = require("../../src/core/harmony.js");
const layout = require("../../src/core/note-layout.js");
const musicalState = require("../../src/core/state.js");
const goldenVectors = require("../fixtures/wp3-golden-vectors.json");

function noteOn(pitch, velocity) {
    return {type: "note_on", pitch, velocity};
}

function noteOff(pitch) {
    return {type: "note_off", pitch, velocity: 0};
}

test("core modules load through their Max-compatible global path", () => {
    const sandbox = {harmony, noteLayout: layout};
    ["note-layout.js", "state.js"].forEach((filename) => {
        const path = require.resolve(`../../src/core/${filename}`);
        vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, {filename: path});
    });
    assert.equal(sandbox.noteLayout.noteForPad(0, [0, 2, 4, 5, 7, 9, 11], 3, 1, 1), 60);
    assert.deepEqual(
        Array.from(sandbox.musicalState.chordForDegree(sandbox.musicalState.createState(), 1)),
        [60, 64, 67]
    );
});

test("C major, E minor, and D Dorian match table-driven golden vectors", () => {
    goldenVectors.forEach((vector) => {
        const state = musicalState.createState({
            rootNote: vector.rootNote,
            scaleIntervals: vector.intervals,
            baseOctave: 3
        });
        musicalState.selectQuality(state, vector.quality);
        if (vector.seventh) musicalState.toggleExtension(state, 7);
        if (vector.ninth) musicalState.toggleExtension(state, 9);

        assert.deepEqual(
            Array.from({length: 8}, (_, index) => harmony.degreeRoot(
                vector.rootNote,
                vector.intervals,
                3,
                index + 1
            )),
            vector.degreeRoots,
            `${vector.name} degree roots`
        );
        assert.deepEqual(layout.threeRowLayout(vector.rootNote, vector.intervals, 3), vector.layout);
        assert.deepEqual(musicalState.chordForDegree(state, vector.degree), vector.chord);
    });
});

test("degree 8 is tonic plus an octave even for a non-heptatonic scale", () => {
    const pentatonic = [0, 2, 4, 7, 9];
    assert.equal(harmony.degreeRoot(0, pentatonic, 3, 8), 72);
    assert.equal(harmony.scaleDegreePitch(0, pentatonic, 3, 5), 72);
    assert.deepEqual(
        Array.from({length: 7}, (_, index) => harmony.degreeRoot(0, pentatonic, 3, index + 1)),
        [60, 62, 64, 67, 69, 72, 74]
    );
});

test("all quality and independent extension formulas are exact", () => {
    const vectors = [
        ["major", false, false, [60, 64, 67]],
        ["minor", true, false, [60, 63, 67, 70]],
        ["diminished", false, true, [60, 63, 66, 74]],
        ["sus", true, true, [60, 65, 67, 70, 74]]
    ];
    vectors.forEach(([quality, seventh, ninth, expected]) => {
        assert.deepEqual(harmony.chordPitches(60, quality, seventh, ninth), expected);
    });
    assert.deepEqual(harmony.chordPitches(null, "major", false, false), []);
    assert.deepEqual(harmony.chordPitches(120, "major", true, true), [120, 124, 127]);
});

test("quality is a radio selection and extensions toggle independently", () => {
    const state = musicalState.createState();
    assert.deepEqual(state, {
        quality: "major",
        seventhEnabled: false,
        ninthEnabled: false,
        rootNote: 0,
        scaleIntervals: [0, 2, 4, 5, 7, 9, 11],
        baseOctave: 3
    });
    musicalState.selectQuality(state, "minor");
    assert.equal(state.quality, "minor");
    assert.equal(musicalState.toggleExtension(state, 7), true);
    assert.equal(musicalState.toggleExtension(state, 9), true);
    assert.equal(musicalState.toggleExtension(state, 7), false);
    assert.equal(musicalState.toggleExtension(state, 9), false);
});

test("scale updates and note-pad lookup use the current state", () => {
    const state = musicalState.createState({baseOctave: 4});
    musicalState.updateScale(state, 4, [0, 2, 3, 5, 7, 8, 10]);
    assert.equal(musicalState.noteForPad(state, 2, 1), 81);
    assert.equal(musicalState.noteForPad(state, 3, 8), 98);
});

test("velocity is preserved and shared pitches use reference counts", () => {
    const notes = active.createActiveNotes();
    assert.deepEqual(active.pressOwner(notes, "A4", [60, 64, 67], 91), [
        noteOn(60, 91), noteOn(64, 91), noteOn(67, 91)
    ]);
    assert.deepEqual(active.pressOwner(notes, "D4", [65, 69, 72], 37), [
        noteOn(65, 37), noteOn(69, 37), noteOn(72, 37)
    ]);
    assert.deepEqual(active.pressOwner(notes, "B4", [62, 65, 69], 110), [
        noteOn(62, 110)
    ]);
    assert.equal(active.referenceCount(notes, 65), 2);
    assert.equal(active.referenceCount(notes, 69), 2);
    assert.equal(active.referenceCount(notes, 99), 0);
    assert.deepEqual(active.releaseOwner(notes, "D4"), [noteOff(72)]);
    assert.deepEqual(active.releaseOwner(notes, "B4"), [noteOff(62), noteOff(65), noteOff(69)]);
    assert.deepEqual(active.releaseOwner(notes, "missing"), []);
});

test("held owners release their exact note-on snapshot after state changes", () => {
    const state = musicalState.createState();
    const notes = active.createActiveNotes();
    const original = musicalState.chordForDegree(state, 1);
    assert.deepEqual(active.pressOwner(notes, "A4", original, 88), [
        noteOn(60, 88), noteOn(64, 88), noteOn(67, 88)
    ]);

    musicalState.selectQuality(state, "diminished");
    musicalState.toggleExtension(state, 7);
    musicalState.updateScale(state, 4, [0, 2, 3, 5, 7, 8, 10]);
    assert.deepEqual(active.releaseOwner(notes, "A4"), [noteOff(60), noteOff(64), noteOff(67)]);
});

test("retriggering one physical owner releases its old snapshot before the new press", () => {
    const notes = active.createActiveNotes();
    active.pressOwner(notes, "C2", [64, 67], 40);
    assert.deepEqual(active.pressOwner(notes, "C2", [65, 69], 120), [
        noteOff(64), noteOff(67), noteOn(65, 120), noteOn(69, 120)
    ]);
    assert.deepEqual(active.normalizedPitches([60, 60, 64]), [60, 64]);
});

test("panic always flushes exact notes in pitch order and finishes with CC123", () => {
    const notes = active.createActiveNotes();
    active.pressOwner(notes, "H4", [72, 76, 79], 127);
    active.pressOwner(notes, "A1", [60], 1);
    assert.deepEqual(active.panic(notes), [
        noteOff(60), noteOff(72), noteOff(76), noteOff(79),
        {type: "control_change", controller: 123, value: 0}
    ]);
    assert.deepEqual(active.releaseOwner(notes, "H4"), []);
    assert.deepEqual(active.panic(notes), [
        {type: "control_change", controller: 123, value: 0}
    ]);
});

test("every note-loss lifecycle path performs the same all-notes-off flush", () => {
    ["panic", "focus_lost", "disabled", "deleted", "set_closed"].forEach((lifecycle) => {
        const notes = active.createActiveNotes();
        active.pressOwner(notes, "A4", [60], 64);
        assert.deepEqual(active.flushForLifecycle(notes, lifecycle), [
            noteOff(60),
            {type: "control_change", controller: 123, value: 0}
        ]);
        assert.equal(active.referenceCount(notes, 60), 0);
    });
    assert.throws(
        () => active.flushForLifecycle(active.createActiveNotes(), "selected"),
        /unknown lifecycle/
    );
});

test("invalid musical inputs fail deterministically", () => {
    assert.throws(() => harmony.validateScaleIntervals(null), TypeError);
    assert.throws(() => harmony.validateScaleIntervals([]), TypeError);
    assert.throws(() => harmony.validateScaleIntervals([1, 3, 5]), /first scale interval/);
    assert.throws(() => harmony.validateScaleIntervals([0, 3, 3]), /strictly increasing/);
    assert.throws(() => harmony.validateScaleIntervals([0, 12]), /scale interval/);
    assert.throws(() => harmony.tonicPitch(-1, 3), /root note/);
    assert.throws(() => harmony.tonicPitch(0, 9), /base octave/);
    assert.throws(() => harmony.scaleDegreePitch(0, [0, 2], 3, -1), /degree index/);
    assert.throws(() => harmony.degreeRoot(0, [0, 2], 3, 0), /degree/);
    assert.throws(() => harmony.chordPitches(60, "other", false, false), /unknown chord/);
    assert.throws(() => harmony.chordPitches(128, "major", false, false), /chord root/);
    assert.throws(() => layout.noteForPad(0, [0, 2], 3, 0, 1), /row/);
    assert.throws(() => layout.noteForPad(0, [0, 2], 3, 1, 9), /column/);
    assert.throws(() => musicalState.selectQuality(musicalState.createState(), "other"), /quality/);
    assert.throws(() => musicalState.toggleExtension(musicalState.createState(), 11), /extension/);
    assert.throws(() => musicalState.updateScale(musicalState.createState(), 12, [0]), /root note/);
    assert.throws(() => musicalState.createState({baseOctave: -1}), /base octave/);
    assert.throws(() => musicalState.createState({scaleIntervals: null}), /scale intervals/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", [60], 0), /velocity/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "", [60], 10), /owner/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", null, 10), /pitches/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", [128], 10), /pitch/);
});

test("out-of-range high notes return null and create no MIDI pitch", () => {
    const state = musicalState.createState({rootNote: 11, scaleIntervals: [0, 11], baseOctave: 8});
    assert.equal(harmony.degreeRoot(11, [0], 8, 8), null);
    assert.equal(harmony.scaleDegreePitch(11, [0, 11], 8, 1), null);
    assert.equal(musicalState.noteForPad(state, 3, 8), null);
    assert.deepEqual(musicalState.chordForDegree(state, 1), []);
});
