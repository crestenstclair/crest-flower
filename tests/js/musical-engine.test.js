"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const active = require("../../src/core/active-notes.js");
const harmony = require("../../src/core/harmony.js");
const musicalState = require("../../src/core/state.js");
const goldenVectors = require("../fixtures/wp3-golden-vectors.json");

function noteOn(pitch, velocity) {
    return {type: "note_on", pitch, velocity};
}

function noteOff(pitch) {
    return {type: "note_off", pitch, velocity: 0};
}

test("core modules load through their Max-compatible global path", () => {
    const sandbox = {harmony};
    const path = require.resolve("../../src/core/state.js");
    vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, {filename: path});
    assert.deepEqual(
        Array.from(sandbox.musicalState.chordForPad(sandbox.musicalState.createState(), 1, 1)),
        [60, 64, 67]
    );
});

test("C major, A natural minor, and D Dorian auto-harmonize all four rows", () => {
    goldenVectors.forEach((vector) => {
        const state = musicalState.createState({
            rootNote: vector.rootNote,
            scaleIntervals: vector.intervals,
            baseOctave: 3
        });
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
        for (let row = 1; row <= 4; row += 1) {
            assert.deepEqual(
                Array.from({length: 8}, (_, index) =>
                    musicalState.chordForPad(state, row, index + 1)
                ),
                vector.triads.map((chord) => chord.map((pitch) => pitch + (row - 1) * 12)
                    .filter((pitch) => pitch <= 127)),
                `${vector.name} row ${row}`
            );
        }
        ["sixth", "minor_seventh", "major_seventh", "ninth"].forEach((extension) => {
            musicalState.setExtension(state, extension, true);
        });
        assert.deepEqual(
            musicalState.chordForPad(state, 1, vector.extendedDegree),
            vector.extendedChord
        );
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

test("Orchid chord types and four independent extensions use exact intervals", () => {
    assert.deepEqual(harmony.qualityChordPitches(60, "diminished"), [60, 63, 66]);
    assert.deepEqual(harmony.qualityChordPitches(60, "minor"), [60, 63, 67]);
    assert.deepEqual(harmony.qualityChordPitches(60, "major"), [60, 64, 67]);
    assert.deepEqual(harmony.qualityChordPitches(60, "suspended"), [60, 65, 67]);
    assert.deepEqual(
        harmony.addExtensions([60, 64, 67], 60, {
            sixth: true,
            minor_seventh: true,
            major_seventh: true,
            ninth: true
        }),
        [60, 64, 67, 69, 70, 71, 74]
    );
    assert.deepEqual(
        harmony.addExtensions([120, 124, 127], 120, {
            sixth: true,
            minor_seventh: true,
            major_seventh: true,
            ninth: true
        }),
        [120, 124, 127]
    );
});

test("voicing walks the lowest or highest chord tone by exact octaves", () => {
    assert.deepEqual(harmony.applyVoicing([60, 64, 67], 0), [60, 64, 67]);
    assert.deepEqual(harmony.applyVoicing([60, 64, 67], 1), [64, 67, 72]);
    assert.deepEqual(harmony.applyVoicing([60, 64, 67], 3), [72, 76, 79]);
    assert.deepEqual(harmony.applyVoicing([60, 64, 67], -1), [55, 60, 64]);
    assert.deepEqual(harmony.applyVoicing([60, 64, 67], -3), [48, 52, 55]);
    assert.deepEqual(harmony.applyVoicing([127], 1), [127]);
    assert.deepEqual(harmony.applyVoicing([120, 124, 127], 1), [120, 124, 127]);
    assert.deepEqual(harmony.applyVoicing([0], -1), [0]);
    assert.deepEqual(harmony.applyVoicing([], 4), []);
    assert.deepEqual(harmony.normalizedPitches([64, 60, 64]), [60, 64]);
});

test("nearest voicing searches one rotation and uses deterministic symmetric scoring", () => {
    assert.deepEqual(harmony.nearestVoicing([65, 69, 72], [60, 64, 67]), {
        pitches: [60, 65, 69], adjustment: -1, score: 6
    });
    assert.deepEqual(harmony.nearestVoicing([67, 71, 74], [60, 64, 67]), {
        pitches: [59, 62, 67], adjustment: -2, score: 6
    });
    assert.deepEqual(harmony.nearestVoicing([62, 65, 69, 72], [60, 64, 67]), {
        pitches: [60, 62, 65, 69], adjustment: -1, score: 8
    });
    assert.equal(harmony.symmetricVoiceLeadingDistance([60, 65, 69], [60, 64, 67]), 6);
    assert.equal(harmony.symmetricVoiceLeadingDistance([], [60]), 0);
    assert.deepEqual(harmony.nearestVoicing([], [60]), {
        pitches: [], adjustment: 0, score: 0
    });
    assert.deepEqual(harmony.nearestVoicing([60, 64, 67], []), {
        pitches: [60, 64, 67], adjustment: 0, score: 0
    });
});

test("nearest voicing removes boundary duplicates and applies stable tie breaks", () => {
    assert.deepEqual(harmony.nearestVoicing([120, 124, 127], [119, 123, 127]), {
        pitches: [120, 124, 127], adjustment: 0, score: 4
    });
    assert.deepEqual(harmony.nearestVoicing([60], [72]), {
        pitches: [60], adjustment: 0, score: 24
    });
    assert.deepEqual(harmony.nearestVoicing([60, 72], [66]), {
        pitches: [60, 72], adjustment: 0, score: 18
    });
    assert.deepEqual(harmony.nearestVoicing([48, 55, 58], [48, 51, 56]), {
        pitches: [48, 55, 58], adjustment: 0, score: 7
    });
});

test("state controls affect future chords and lifecycle reset preserves persistent choices", () => {
    const state = musicalState.createState();
    assert.deepEqual(state, {
        chordType: "auto",
        extensions: {
            sixth: false,
            minor_seventh: false,
            major_seventh: false,
            ninth: false
        },
        voicing: 0,
        voiceLeadingEnabled: false,
        voiceLeadingPitches: [],
        bassEnabled: false,
        bassOctave: -1,
        rootNote: 0,
        scaleIntervals: [0, 2, 4, 5, 7, 9, 11],
        baseOctave: 3
    });

    musicalState.setChordType(state, "minor");
    musicalState.setExtension(state, "ninth", true);
    musicalState.setVoicing(state, 1);
    assert.equal(musicalState.shiftVoicing(state, -1), 0);
    assert.equal(musicalState.shiftVoicing(state, 1), 1);
    assert.equal(musicalState.toggleBass(state), true);
    musicalState.setBassOctave(state, -2);
    assert.equal(musicalState.shiftBassOctave(state, 1), -1);
    assert.equal(musicalState.shiftBassOctave(state, -1), -2);
    assert.deepEqual(musicalState.chordForPad(state, 1, 1), [36, 63, 67, 72, 74]);

    musicalState.resetMomentaryModifiers(state);
    assert.equal(state.chordType, "auto");
    assert.deepEqual(state.extensions, {
        sixth: false,
        minor_seventh: false,
        major_seventh: false,
        ninth: false
    });
    assert.equal(state.voicing, 1);
    assert.deepEqual(state.voiceLeadingPitches, []);
    assert.equal(state.bassEnabled, true);
    assert.equal(state.bassOctave, -2);

    musicalState.setVoicing(state, 16);
    assert.equal(musicalState.shiftVoicing(state, 1), 16);
    musicalState.setVoicing(state, -16);
    assert.equal(musicalState.shiftVoicing(state, -1), -16);
    musicalState.setBassOctave(state, 1);
    assert.equal(musicalState.shiftBassOctave(state, 1), 1);
    musicalState.setBassOctave(state, -4);
    assert.equal(musicalState.shiftBassOctave(state, -1), -4);
    assert.equal(musicalState.toggleBass(state), false);
});

test("nearest voice leading is opt-in, stateful, and publishes exact chord snapshots", () => {
    const state = musicalState.createState();
    assert.equal(musicalState.toggleVoiceLeading(state), true);
    const tonic = musicalState.chordSnapshotForPad(state, 1, 1);
    assert.deepEqual(tonic, {
        rootPitch: 60,
        requestedQuality: "auto",
        resolvedQuality: "major",
        extensions: [],
        manualVoicing: 0,
        voiceLeadingEnabled: true,
        nearestAdjustment: 0,
        nearestScore: 0,
        chordPitches: [60, 64, 67],
        pitches: [60, 64, 67]
    });
    const subdominant = musicalState.chordSnapshotForPad(state, 1, 4);
    assert.deepEqual(subdominant.chordPitches, [60, 65, 69]);
    assert.equal(subdominant.resolvedQuality, "major");
    assert.equal(subdominant.nearestAdjustment, -1);
    assert.equal(subdominant.nearestScore, 6);
    assert.deepEqual(state.voiceLeadingPitches, [60, 65, 69]);
    assert.equal(musicalState.toggleVoiceLeading(state), false);
    assert.deepEqual(state.voiceLeadingPitches, []);
    assert.deepEqual(musicalState.chordForPad(state, 1, 4), [65, 69, 72]);
});

test("nearest history ignores bass and handles extension cardinality changes", () => {
    const state = musicalState.createState();
    musicalState.toggleVoiceLeading(state);
    musicalState.chordSnapshotForPad(state, 1, 1);
    musicalState.setExtension(state, "ninth", true);
    musicalState.toggleBass(state);
    musicalState.setBassOctave(state, -2);
    const extended = musicalState.chordSnapshotForPad(state, 1, 2);
    assert.deepEqual(extended.chordPitches, [62, 64, 65, 69]);
    assert.deepEqual(extended.pitches, [38, 62, 64, 65, 69]);
    assert.equal(extended.nearestAdjustment, -1);
    assert.equal(extended.nearestScore, 9);
    assert.equal(extended.resolvedQuality, "minor");
    assert.deepEqual(extended.extensions, ["ninth"]);
});

test("voice-leading history clears at every declared context boundary", () => {
    const state = musicalState.createState();
    musicalState.toggleVoiceLeading(state);
    musicalState.chordForPad(state, 1, 1);
    assert.notDeepEqual(state.voiceLeadingPitches, []);
    musicalState.setVoicing(state, 1);
    assert.deepEqual(state.voiceLeadingPitches, []);
    musicalState.chordForPad(state, 1, 1);
    musicalState.updateScale(state, 9, [0, 2, 3, 5, 7, 8, 10]);
    assert.deepEqual(state.voiceLeadingPitches, []);
    musicalState.chordForPad(state, 1, 1);
    musicalState.updateBaseOctave(state, 2);
    assert.deepEqual(state.voiceLeadingPitches, []);
    musicalState.chordForPad(state, 1, 1);
    musicalState.resetMomentaryModifiers(state);
    assert.deepEqual(state.voiceLeadingPitches, []);
    assert.equal(state.voiceLeadingEnabled, true);
});

test("snapshot quality resolves automatic and manual chord identities", () => {
    const state = musicalState.createState();
    assert.equal(musicalState.chordSnapshotForPad(state, 1, 2).resolvedQuality, "minor");
    assert.equal(musicalState.chordSnapshotForPad(state, 1, 7).resolvedQuality, "diminished");
    musicalState.setChordType(state, "suspended");
    assert.equal(musicalState.chordSnapshotForPad(state, 1, 1).resolvedQuality, "suspended");
    musicalState.updateScale(state, 0, [0, 1]);
    musicalState.setChordType(state, "auto");
    assert.equal(musicalState.chordSnapshotForPad(state, 1, 1).resolvedQuality, "auto");
    musicalState.updateScale(state, 0, [0, 1, 5, 6, 7]);
    assert.equal(musicalState.chordSnapshotForPad(state, 1, 1).resolvedQuality, "suspended");
});

test("scale and octave updates affect future chord rows", () => {
    const state = musicalState.createState({baseOctave: 4});
    musicalState.updateScale(state, 4, [0, 2, 3, 5, 7, 8, 10]);
    musicalState.updateBaseOctave(state, 5);
    assert.deepEqual(musicalState.chordForPad(state, 1, 1), [88, 91, 95]);
    assert.deepEqual(musicalState.chordForPad(state, 2, 8), [112, 115, 119]);
});

test("bass is independent from chord voicing and remains MIDI-safe", () => {
    assert.deepEqual(harmony.addBass([60, 64, 67], 60, false, -1), [60, 64, 67]);
    assert.deepEqual(harmony.addBass([64, 67, 72], 60, true, -1), [48, 64, 67, 72]);
    assert.deepEqual(harmony.addBass([4, 7], 4, true, -1), [4, 7]);
    assert.deepEqual(harmony.addBass([120], 120, true, 1), [120]);
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
    const original = musicalState.chordForPad(state, 1, 1);
    assert.deepEqual(active.pressOwner(notes, "A4", original, 88), [
        noteOn(60, 88), noteOn(64, 88), noteOn(67, 88)
    ]);

    musicalState.setChordType(state, "minor");
    musicalState.setExtension(state, "ninth", true);
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
    ["panic", "focus_lost", "disabled", "reload", "deleted", "set_closed"].forEach((lifecycle) => {
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
    assert.throws(() => harmony.normalizedPitches([128]), /pitch/);
    assert.throws(() => harmony.qualityChordPitches(60, "auto"), /chord type/);
    assert.throws(() => harmony.qualityChordPitches(128, "major"), /chord root/);
    assert.throws(
        () => harmony.diatonicChordPitches(0, [0, 2], 3, 0, 1),
        /chord row/
    );
    assert.throws(
        () => harmony.diatonicChordPitches(0, [0, 2], 3, 1, 9),
        /degree/
    );
    assert.throws(() => harmony.applyVoicing([60], 17), /voicing/);
    assert.throws(() => harmony.addBass([], 60, false, 2), /bass octave/);

    const state = musicalState.createState();
    assert.throws(() => musicalState.setChordType(state, "power"), /chord type/);
    assert.throws(() => musicalState.setExtension(state, "eleventh", true), /extension/);
    assert.throws(() => musicalState.setExtension(state, "ninth", 1), /boolean/);
    assert.throws(() => musicalState.setVoicing(state, -17), /voicing/);
    assert.throws(() => musicalState.shiftVoicing(state, 0), /direction/);
    assert.throws(() => musicalState.setBassOctave(state, -5), /bass octave/);
    assert.throws(() => musicalState.shiftBassOctave(state, 0), /direction/);
    assert.throws(() => musicalState.updateScale(state, 12, [0]), /root note/);
    assert.throws(() => musicalState.updateBaseOctave(state, 9), /base octave/);
    assert.throws(() => musicalState.createState({baseOctave: -1}), /base octave/);
    assert.throws(() => musicalState.createState({scaleIntervals: null}), /scale intervals/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", [60], 0), /velocity/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "", [60], 10), /owner/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", null, 10), /pitches/);
    assert.throws(() => active.pressOwner(active.createActiveNotes(), "A1", [128], 10), /pitch/);
});

test("out-of-range high notes return no MIDI pitch", () => {
    const state = musicalState.createState({rootNote: 11, scaleIntervals: [0, 11], baseOctave: 8});
    assert.equal(harmony.degreeRoot(11, [0], 8, 8), null);
    assert.equal(harmony.scaleDegreePitch(11, [0, 11], 8, 1), null);
    assert.deepEqual(musicalState.chordForPad(state, 4, 8), []);
    assert.deepEqual(harmony.qualityChordPitches(127, "major"), [127]);
    assert.deepEqual(
        harmony.diatonicChordPitches(0, [0, 2, 4, 5, 7, 9, 11], 8, 1, 2),
        [122, 125]
    );
    assert.deepEqual(
        harmony.diatonicChordPitches(0, [0, 2, 4, 5, 7, 9, 11], 7, 2, 2),
        [122, 125]
    );
    assert.deepEqual(
        harmony.orchidChordPitches(
            0,
            [0, 2, 4, 5, 7, 9, 11],
            8,
            2,
            1,
            "auto",
            {sixth: false, minor_seventh: false, major_seventh: false, ninth: false},
            0,
            false,
            -1
        ),
        []
    );
    assert.deepEqual(
        harmony.orchidChordPitches(
            11,
            [0],
            8,
            1,
            8,
            "auto",
            {sixth: false, minor_seventh: false, major_seventh: false, ninth: false},
            0,
            false,
            -1
        ),
        []
    );
    assert.deepEqual(
        harmony.orchidChordPitches(
            0,
            [0, 2, 4, 5, 7, 9, 11],
            3,
            1,
            1,
            "minor",
            {sixth: false, minor_seventh: false, major_seventh: false, ninth: false},
            0,
            false,
            -1
        ),
        [60, 63, 67]
    );
    assert.deepEqual(
        harmony.orchidChordPitches(
            0,
            [0, 2, 4, 5, 7, 9, 11],
            3,
            1,
            1,
            "auto",
            {sixth: false, minor_seventh: false, major_seventh: false, ninth: false},
            0,
            false,
            -1
        ),
        [60, 64, 67]
    );
    assert.deepEqual(
        harmony.orchidChordPitches(
            0,
            [0, 2, 4, 5, 7, 9, 11],
            7,
            4,
            1,
            "auto",
            {sixth: false, minor_seventh: false, major_seventh: false, ninth: false},
            0,
            false,
            -1
        ),
        []
    );
});
