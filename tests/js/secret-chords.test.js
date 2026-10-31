"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const harmony = require("../../src/core/harmony.js");
const state = require("../../src/core/state.js");
const runtime = require("../../src/max/runtime-adapter.js");

const formulas = {
    major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6],
    suspended: [0, 5, 7], augmented: [0, 4, 8], power: [0, 7],
    quartal: [0, 5, 10], dominant: [0, 4, 7, 10]
};
const sevenths = {major: 11, minor: 10, diminished: 9, suspended: 10,
    augmented: 11, power: 10, quartal: 10, dominant: 10};
const qualities = {A8: "major", B8: "minor", C8: "diminished", D8: "suspended",
    A7: "augmented", B7: "power", C7: "quartal", D7: "dominant"};
const extensions = {sixth: false, seventh: true, ninth: false};
const on = (pitch, velocity) => ({type: "note_on", pitch, velocity});
const off = (pitch) => ({type: "note_off", pitch, velocity: 0});

test("eight fixed formulas, Power placement, and MIDI bounds are exact", () => {
    for (const [quality, intervals] of Object.entries(formulas)) {
        for (const root of [0, 60, 120, 127]) {
            assert.deepEqual(harmony.qualityChordPitches(root, quality),
                intervals.map((interval) => root + interval).filter((pitch) => pitch <= 127));
        }
    }
    assert.deepEqual(harmony.applyVoicing(harmony.qualityChordPitches(60, "power"), 1), [67, 72]);
    assert.deepEqual(harmony.qualityChordPitches(60, "dominant"), [60, 64, 67, 70]);
});

test("contextual seventh and every 6/7/9 mask follow fixed manual formulas", () => {
    for (const [quality, intervals] of Object.entries(formulas)) {
        for (let mask = 0; mask < 8; mask++) {
            const musical = state.createState();
            state.setChordType(musical, quality);
            ["sixth", "seventh", "ninth"].forEach((name, bit) =>
                state.setExtension(musical, name, !!(mask & (1 << bit))));
            const added = [9, sevenths[quality], 14].filter((_, bit) => mask & (1 << bit));
            const snapshot = state.chordSnapshotForPad(musical, 1, 1);
            assert.deepEqual(snapshot.pitches, [...new Set([...intervals, ...added])]
                .sort((a, b) => a - b).map((pitch) => pitch + 60));
            assert.equal(snapshot.seventhPitch, mask & 2 ? 60 + sevenths[quality] : null);
            assert.equal(snapshot.seventhInterval, mask & 2 ? sevenths[quality] : null);
        }
    }
    const musical = state.createState();
    assert.deepEqual(musical.extensions, {sixth: false, seventh: false, ninth: false});
    for (const legacy of ["minor_seventh", "major_seventh"]) {
        assert.throws(() => state.setExtension(musical, legacy, true), /extension/);
    }
});

test("automatic seventh retains press-time scale, row, degree 8, and high pitch", () => {
    const musical = state.createState();
    const tonic = state.chordSnapshotForPad(musical, 1, 1);
    const dominant = state.chordSnapshotForPad(musical, 1, 5);
    assert.equal(tonic.automaticSeventhPitch, 71);
    assert.equal(dominant.automaticSeventhPitch, 77);
    state.updateScale(musical, 9, [0, 2, 3, 5, 7, 8, 10]);
    assert.deepEqual(state.retargetChordSnapshot(tonic, "auto", extensions).pitches, [60, 64, 67, 71]);
    assert.deepEqual(state.retargetChordSnapshot(dominant, "auto", extensions).pitches, [67, 71, 74, 77]);
    state.updateScale(musical, 0, [0, 2, 4, 7, 9]);
    state.setExtension(musical, "seventh", true);
    assert.equal(state.chordSnapshotForPad(musical, 2, 8).automaticSeventhPitch, 98);
    state.updateScale(musical, 0, [0]);
    const sparse = state.chordSnapshotForPad(musical, 1, 1);
    assert.equal(sparse.automaticSeventhPitch, 132);
    assert.equal(sparse.seventhInterval, 72);
    assert.deepEqual(sparse.pitches, [60, 84, 108]);
    state.updateScale(musical, 0, [0, 2, 4, 5, 7, 9, 11]);
    state.updateBaseOctave(musical, 8);
    const high = state.chordSnapshotForPad(musical, 1, 1);
    assert.equal(high.automaticSeventhPitch, 131);
    assert.deepEqual(high.pitches, [120, 124, 127]);
});

test("both quality rows share one edge-safe stack and exact reserved coordinates", () => {
    const instance = runtime.createRuntime();
    assert.deepEqual(runtime.QUALITY_CONTROLS, qualities);
    assert.deepEqual(runtime.EXTENSION_CONTROLS, {E8: "sixth", F8: "seventh", H8: "ninth"});
    assert.deepEqual(runtime.VOICING_CONTROLS, {A6: -1, B6: 0, C6: 1});
    assert.equal(runtime.VOICE_LEADING_CONTROL, "D6");
    const reserved = ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5", "E6", "F6", "G6", "H6", "G8"];
    assert.deepEqual(Object.keys(runtime.gridContract()).filter((pad) =>
        runtime.roleForCoordinate(pad) === "reserved").sort(), reserved.sort());
    for (const pad of reserved) {
        assert.deepEqual(runtime.processGridEvent(instance, pad, 100), []);
        assert.equal(runtime.ledColorForCoordinate(instance, pad), 0);
    }
    for (const [pad, quality] of Object.entries(qualities)) {
        assert.deepEqual(runtime.processGridEvent(instance, pad, 100), []);
        assert.equal(instance.musical.chordType, quality);
        runtime.processGridEvent(instance, pad, 80);
    }
    assert.equal(instance.qualityOrder.length, 8);
    for (const pad of Object.keys(qualities).reverse()) {
        runtime.processGridEvent(instance, pad, 0);
        const remaining = instance.qualityOrder;
        assert.equal(instance.musical.chordType, remaining.length ? qualities[remaining.at(-1)] : "auto");
    }
});

test("overlapping auto sevenths retain each velocity and restore original scale", () => {
    const instance = runtime.createRuntime();
    runtime.processGridEvent(instance, "A1", 37);
    runtime.processGridEvent(instance, "E1", 111);
    assert.deepEqual(runtime.processGridEvent(instance, "F8", 100), [on(77, 111)]);
    assert.deepEqual(instance.activeChordSnapshots.A1.pitches, [60, 64, 67, 71]);
    assert.deepEqual(instance.activeChordSnapshots.E1.pitches, [67, 71, 74, 77]);
    runtime.applyScaleSnapshot(instance, 9, [0, 2, 3, 5, 7, 8, 10]);
    assert.deepEqual(runtime.processGridEvent(instance, "A8", 100), [off(77), on(78, 111)]);
    assert.deepEqual(runtime.processGridEvent(instance, "A8", 0), [off(78), on(77, 111)]);
    assert.deepEqual(runtime.processGridEvent(instance, "F8", 0), [off(77)]);
    runtime.processLifecycle(instance, "panic");
    assert.equal(runtime.playingDisplayLabel(instance), "--");
});

test("Quartal and Dominant seventh edges update feedback with no MIDI", () => {
    for (const pad of ["C7", "D7"]) {
        const instance = runtime.createRuntime();
        runtime.processGridEvent(instance, pad, 100);
        runtime.processGridEvent(instance, "A1", 72);
        const initial = instance.activeChordSnapshots.A1.pitches.slice();
        assert.deepEqual(runtime.processGridEvent(instance, "F8", 100), []);
        assert.deepEqual(instance.activeChordSnapshots.A1.pitches, initial);
        assert.match(runtime.playingDisplayLabel(instance), /\+m7$/);
        assert.deepEqual(runtime.processGridEvent(instance, "F8", 0), []);
        assert.deepEqual(runtime.processGridEvent(instance, "A1", 0), initial.map(off));
    }
});


test("contextual seventh rejects invalid recipes instead of guessing", () => {
    assert.throws(() => harmony.contextualSeventhPitch(60, "unknown", 71), /chord type/);
    assert.throws(() => harmony.contextualSeventhPitch(60, "toString", 71), /chord type/);
    assert.throws(() => harmony.qualityChordPitches(60, "toString"), /chord type/);
    assert.throws(() => harmony.contextualSeventhPitch(60, "auto", undefined), /automatic seventh/);
    assert.throws(() => harmony.addExtensions([60], 60, extensions), /seventh pitch/);
});

test("all quality retargets retain press placement, bass, velocity, and release", () => {
    for (const [pad, quality] of Object.entries(qualities)) {
        const instance = runtime.createRuntime({rootNote: 9, scaleIntervals: [0, 2, 3, 5, 7, 8, 10]});
        runtime.processGridEvent(instance, "C6", 100);
        runtime.processGridEvent(instance, "C6", 0);
        runtime.processGridEvent(instance, "D6", 100);
        runtime.processGridEvent(instance, "D6", 0);
        runtime.processGridEvent(instance, "H7", 100);
        runtime.processGridEvent(instance, "H7", 0);
        runtime.processGridEvent(instance, "A1", 31);
        runtime.processGridEvent(instance, "D1", 103);
        const before = structuredClone(instance.activeChordSnapshots);
        const sounding = new Set(Object.keys(instance.notes.counts).map((key) => Number(key.slice(1))));
        const events = runtime.processGridEvent(instance, pad, 100);
        const after = instance.activeChordSnapshots;
        const expected = new Set(Object.values(after).flatMap((snapshot) => snapshot.pitches));
        assert.deepEqual(events.filter((event) => event.type === "note_off").map((event) => event.pitch),
            [...sounding].filter((pitch) => !expected.has(pitch)).sort((a, b) => a - b));
        for (const event of events.filter((event) => event.type === "note_on")) {
            assert.equal(sounding.has(event.pitch), false);
            assert.equal(event.velocity, after.D1.pitches.includes(event.pitch) ? 103 : 31);
        }
        for (const coordinate of ["A1", "D1"]) {
            assert.equal(after[coordinate].requestedQuality, quality);
            for (const field of ["rootPitch", "automaticSeventhPitch", "manualVoicing",
                "nearestAdjustment", "voiceLeadingEnabled", "bassEnabled", "bassOctave"]) {
                assert.equal(after[coordinate][field], before[coordinate][field]);
            }
        }
        runtime.processGridEvent(instance, pad, 0);
        assert.deepEqual(instance.activeChordSnapshots.A1.pitches, before.A1.pitches);
        assert.deepEqual(instance.activeChordSnapshots.D1.pitches, before.D1.pitches);
        assert.deepEqual(runtime.processGridEvent(instance, pad, 0), []);
        runtime.processLifecycle(instance, "panic");
        assert.deepEqual(instance.notes.counts, Object.create(null));
    }
});

test("Power, triadic, Dominant and MIDI-boundary Nearest golden vectors", () => {
    const vectors = [
        [[67, 74], [60, 67], [62, 67], -1, 4],
        [[67, 71, 74, 77], [60, 64, 67], [59, 62, 65, 67], -3, 6],
        [[65, 70, 75], [60, 65, 70], [63, 65, 70], -1, 5],
        [[65, 69, 73], [60, 64, 68], [61, 65, 69], -1, 6],
        [[0, 7], [5, 12], [7, 12], 1, 4],
        [[117, 121, 124, 127], [116, 120, 123, 126], [117, 121, 124, 127], 0, 8],
        [[72, 79], [48, 55], [67, 72], -1, 60],
        [[72, 76, 79, 82], [48, 52, 55, 58], [64, 67, 70, 72], -3, 84]
    ];
    for (const [current, previous, pitches, adjustment, score] of vectors) {
        assert.deepEqual(harmony.nearestVoicing(current, previous), {pitches, adjustment, score});
    }
});

test("every quality publishes exact resolved seventh and owner note feedback", () => {
    const suffixes = {major: "", minor: "m", diminished: "dim", suspended: "sus",
        augmented: "aug", power: "5", quartal: "quart", dominant: "7"};
    const labels = runtime.playingDisplayLabels();
    for (const [pad, quality] of Object.entries(qualities)) {
        const instance = runtime.createRuntime();
        runtime.processGridEvent(instance, pad, 100);
        runtime.processGridEvent(instance, "F8", 100);
        runtime.processGridEvent(instance, "A1", 85);
        const seventh = {9: "d7", 10: "m7", 11: "M7"}[sevenths[quality]];
        const expected = `C${suffixes[quality]} +${seventh}`;
        assert.equal(runtime.playingDisplayLabel(instance), expected);
        assert.equal(labels[runtime.playingDisplayCode(instance)], expected);
        assert.match(runtime.selectionText(instance), /Ext 7$/);
        assert.ok(runtime.feedbackText(instance).includes(`| Ext ${seventh} |`));
        const notes = instance.activeChordSnapshots.A1.pitches.map((pitch) =>
            `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][pitch % 12]}${Math.floor(pitch / 12) - 2}(${pitch})`);
        assert.ok(runtime.feedbackText(instance).endsWith(`MIDI ${notes.join(" ")}`));
        runtime.processGridEvent(instance, "H8", 100);
        assert.equal(runtime.playingDisplayLabel(instance), expected + "+9");
        runtime.processGridEvent(instance, "E8", 100);
        assert.equal(runtime.playingDisplayLabel(instance), `C${suffixes[quality]} +6+${seventh}+9`);
    }
    const instance = runtime.createRuntime();
    runtime.processGridEvent(instance, "F8", 100);
    runtime.processGridEvent(instance, "E1", 100);
    assert.equal(runtime.feedbackText(instance),
        "Last: G | Quality Maj | Ext m7 | Inv Voice 0 | MIDI G3(67) B3(71) D4(74) F4(77)");
});

test("Playing catalog covers every supported scale and clipping with code agreement", () => {
    const labels = runtime.playingDisplayLabels();
    for (let mask = 0; mask < 2048; mask++) {
        const intervals = [0, ...Array.from({length: 11}, (_, i) => i + 1)
            .filter((interval) => mask & (1 << (interval - 1)))];
        const musical = state.createState({baseOctave: 0, scaleIntervals: intervals});
        state.setExtension(musical, "seventh", true);
        for (let degree = 1; degree <= 8; degree++) {
            const snapshot = state.chordSnapshotForPad(musical, 1, degree);
            assert.equal(labels[runtime.playingDisplayCodeForSnapshot(snapshot)],
                runtime.playingDisplayLabelForSnapshot(snapshot));
        }
        state.updateBaseOctave(musical, 8);
        const clipped = state.chordSnapshotForPad(musical, 1, 1);
        assert.equal(labels[runtime.playingDisplayCodeForSnapshot(clipped)],
            runtime.playingDisplayLabelForSnapshot(clipped));
    }
    const invalid = {rootPitch: 60, resolvedQuality: "unknown", extensions: []};
    assert.throws(() => runtime.playingDisplayCodeForSnapshot(invalid), /quality/);
    invalid.resolvedQuality = "major";
    invalid.extensions = ["minor_seventh"];
    assert.throws(() => runtime.playingDisplayCodeForSnapshot(invalid), /extension/);
    invalid.extensions = ["seventh"];
    assert.throws(() => runtime.playingDisplayCodeForSnapshot(invalid), /seventh/);
    invalid.seventhInterval = 72;
    assert.throws(() => runtime.playingDisplayCodeForSnapshot(invalid), /unsupported/);
});

test("newest retargeted overlap survives future-only controls and all lifecycle flushes", () => {
    for (const lifecycle of ["focus_lost", "disabled", "reload", "deleted", "set_closed", "panic"]) {
        const instance = runtime.createRuntime();
        runtime.setLedOwnership(instance, true);
        runtime.processGridEvent(instance, "A1", 40);
        runtime.processGridEvent(instance, "D1", 110);
        runtime.processGridEvent(instance, "A7", 100);
        runtime.processGridEvent(instance, "F8", 100);
        assert.equal(runtime.playingDisplayLabel(instance), "Faug +M7");
        runtime.processGridEvent(instance, "D1", 0);
        assert.equal(runtime.playingDisplayLabel(instance), "Caug +M7");
        const snapshot = structuredClone(instance.activeChordSnapshots.A1);
        for (const pad of ["C6", "D6", "E7", "H7"]) runtime.processGridEvent(instance, pad, 100);
        runtime.applyScaleSnapshot(instance, 9, [0, 2, 3, 5, 7, 8, 10]);
        state.updateBaseOctave(instance.musical, 4);
        assert.deepEqual(instance.activeChordSnapshots.A1, snapshot);
        assert.equal(runtime.playingDisplayLabel(instance), "Caug +M7");
        assert.deepEqual(runtime.processLifecycle(instance, lifecycle),
            [...snapshot.pitches.map(off), {type: "control_change", controller: 123, value: 0}]);
        assert.equal(runtime.playingDisplayCode(instance), 0);
        assert.deepEqual(instance.activeChordVelocities, Object.create(null));
        assert.deepEqual(instance.qualityOrder, []);
        assert.deepEqual(instance.musical.extensions, {sixth: false, seventh: false, ninth: false});
        assert.equal(instance.musical.voicing, 1);
        assert.equal(instance.musical.voiceLeadingEnabled, true);
        assert.ok(runtime.setLedOwnership(instance, false).every((entry) => entry.value === 0));
    }
});

test("Max include path initializes catalog and emits contextual MIDI and Playing", () => {
    const fs = require("node:fs");
    const vm = require("node:vm");
    const outputs = [];
    const context = vm.createContext({outlet: (...args) => outputs.push(args)});
    context.include = (filename) => vm.runInContext(
        fs.readFileSync(require.resolve(`../../src/core/${filename}`), "utf8"), context);
    vm.runInContext(fs.readFileSync(require.resolve("../../src/max/runtime-adapter.js"), "utf8"), context);
    context.grid_event("A7", 100);
    context.grid_event("F8", 100);
    context.grid_event("A1", 85);
    assert.deepEqual(outputs.filter(([port]) => port === 0), [[0, 60, 85], [0, 64, 85], [0, 68, 85], [0, 71, 85]]);
    assert.equal(runtime.playingDisplayLabels()[outputs.filter(([port]) => port === 5).at(-1)[1]], "Caug +M7");
    context.lifecycle("panic");
    assert.deepEqual(outputs.filter(([port]) => port === 1).at(-1), [1, 123, 0]);
    assert.deepEqual(outputs.filter(([port]) => port === 5).at(-1), [5, 0]);
});
