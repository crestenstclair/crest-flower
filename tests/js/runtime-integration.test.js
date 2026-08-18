"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const integration = require("../../src/max/runtime-adapter.js");
const scaleAdapter = require("../../src/max/live-scale-adapter.js");
const goldenVectors = require("../fixtures/wp3-golden-vectors.json");

function noteOn(pitch, velocity) {
    return {type: "note_on", pitch, velocity};
}

function noteOff(pitch) {
    return {type: "note_off", pitch, velocity: 0};
}

test("all 64 coordinates have one documented role", () => {
    const contract = integration.gridContract();
    assert.equal(Object.keys(contract).length, 64);
    assert.deepEqual(
        Object.values(contract).reduce((counts, role) => {
            counts[role] = (counts[role] || 0) + 1;
            return counts;
        }, {}),
        {
            chord: 32,
            reserved: 17,
            voicing_control: 3,
            bass_voicing_control: 3,
            bass_toggle_control: 1,
            quality_control: 4,
            extension_control: 4
        }
    );
    assert.deepEqual(
        ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"].map(
            (coordinate) => contract[coordinate]
        ),
        [
            "quality_control", "quality_control", "quality_control", "quality_control",
            "extension_control", "extension_control", "extension_control", "extension_control"
        ]
    );
    assert.deepEqual(
        ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"].map(
            (coordinate) => contract[coordinate]
        ),
        [
            "voicing_control", "voicing_control", "voicing_control", "reserved",
            "bass_voicing_control", "bass_voicing_control", "bass_voicing_control",
            "bass_toggle_control"
        ]
    );
    assert.throws(() => integration.roleForCoordinate("I4"), /coordinate/);
});

test("reserved and control pads emit no musical trigger", () => {
    const runtime = integration.createRuntime();
    Object.entries(integration.gridContract())
        .filter(([, role]) => role !== "chord")
        .forEach(([coordinate]) => {
            assert.deepEqual(integration.processGridEvent(runtime, coordinate, 100), []);
            assert.deepEqual(integration.processGridEvent(runtime, coordinate, 0), []);
        });
    assert.equal(Object.keys(runtime.notes.owners).length, 0);
    assert.equal(Object.keys(runtime.notes.counts).length, 0);
    assert.equal(runtime.musical.chordType, "auto");
    assert.deepEqual(runtime.musical.extensions, {
        sixth: false,
        minor_seventh: false,
        major_seventh: false,
        ninth: false
    });
});

test("integrated grid events match every automatic diatonic golden vector", () => {
    goldenVectors.forEach((vector) => {
        for (let row = 1; row <= 4; row += 1) {
            vector.triads.forEach((chord, degreeIndex) => {
                const runtime = integration.createRuntime({
                    rootNote: vector.rootNote,
                    scaleIntervals: vector.intervals,
                    baseOctave: 3
                });
                const coordinate = `${"ABCDEFGH"[degreeIndex]}${row}`;
                const pitches = chord.map((pitch) => pitch + (row - 1) * 12)
                    .filter((pitch) => pitch <= 127);
                assert.deepEqual(
                    integration.processGridEvent(runtime, coordinate, 91),
                    pitches.map((pitch) => noteOn(pitch, 91)),
                    `${vector.name} ${coordinate}`
                );
                assert.deepEqual(
                    integration.processGridEvent(runtime, coordinate, 0),
                    pitches.map(noteOff),
                    `${vector.name} ${coordinate} release`
                );
            });
        }
    });
});

test("four chord rows are octave-spaced and reject invalid velocities", () => {
    const runtime = integration.createRuntime();
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 73), [
        noteOn(60, 73), noteOn(64, 73), noteOn(67, 73)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(64), noteOff(67)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "H4", 127), [
        noteOn(108, 127), noteOn(112, 127), noteOn(115, 127)
    ]);
    assert.throws(() => integration.processGridEvent(runtime, "A1", 128), /velocity/);
});

test("Orchid quality and extension pads are momentary snapshot modifiers", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "B8", 100);
    integration.processGridEvent(runtime, "E8", 100);
    integration.processGridEvent(runtime, "F8", 100);
    integration.processGridEvent(runtime, "G8", 100);
    integration.processGridEvent(runtime, "H8", 100);
    assert.equal(
        integration.selectionText(runtime),
        "Chord: Min | Voice 0 | Bass off | Ext 6+m7+M7+9"
    );
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 90), [
        noteOn(60, 90), noteOn(63, 90), noteOn(67, 90), noteOn(69, 90),
        noteOn(70, 90), noteOn(71, 90), noteOn(74, 90)
    ]);

    ["B8", "E8", "F8", "G8", "H8"].forEach((coordinate) => {
        assert.deepEqual(integration.processGridEvent(runtime, coordinate, 0), []);
    });
    assert.equal(
        integration.selectionText(runtime),
        "Chord: Auto | Voice 0 | Bass off | Ext -"
    );
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(63), noteOff(67), noteOff(69),
        noteOff(70), noteOff(71), noteOff(74)
    ]);
});

test("last-held quality wins and releasing it restores the previous held quality", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "A8", 100);
    assert.equal(runtime.musical.chordType, "diminished");
    integration.processGridEvent(runtime, "C8", 100);
    integration.processGridEvent(runtime, "C8", 80);
    assert.equal(runtime.musical.chordType, "major");
    integration.processGridEvent(runtime, "C8", 0);
    assert.equal(runtime.musical.chordType, "diminished");
    integration.processGridEvent(runtime, "A8", 0);
    integration.processGridEvent(runtime, "A8", 0);
    assert.equal(runtime.musical.chordType, "auto");
});

test("voicing and bass controls persist and only step once per physical press", () => {
    const runtime = integration.createRuntime();
    assert.equal(
        integration.selectionText(runtime),
        "Chord: Auto | Voice 0 | Bass off | Ext -"
    );

    integration.processGridEvent(runtime, "C7", 100);
    integration.processGridEvent(runtime, "C7", 80);
    assert.equal(runtime.musical.voicing, 1);
    integration.processGridEvent(runtime, "C7", 0);
    integration.processGridEvent(runtime, "A7", 100);
    assert.equal(runtime.musical.voicing, 0);
    integration.processGridEvent(runtime, "A7", 0);
    integration.processGridEvent(runtime, "C7", 100);
    integration.processGridEvent(runtime, "C7", 0);

    integration.processGridEvent(runtime, "H7", 100);
    integration.processGridEvent(runtime, "H7", 0);
    integration.processGridEvent(runtime, "E7", 100);
    integration.processGridEvent(runtime, "E7", 0);
    assert.equal(
        integration.selectionText(runtime),
        "Chord: Auto | Voice 1 | Bass -2 | Ext -"
    );
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 64), [
        noteOn(36, 64), noteOn(64, 64), noteOn(67, 64), noteOn(72, 64)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(36), noteOff(64), noteOff(67), noteOff(72)
    ]);

    integration.processGridEvent(runtime, "B7", 100);
    integration.processGridEvent(runtime, "B7", 0);
    integration.processGridEvent(runtime, "F7", 100);
    integration.processGridEvent(runtime, "F7", 0);
    integration.processGridEvent(runtime, "G7", 100);
    integration.processGridEvent(runtime, "G7", 0);
    assert.equal(runtime.musical.voicing, 0);
    assert.equal(runtime.musical.bassOctave, 0);
});

test("overlapping holds reference-count shared voices and lifecycle flushes", () => {
    const runtime = integration.createRuntime();
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 100), [
        noteOn(60, 100), noteOn(64, 100), noteOn(67, 100)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "C1", 80), [noteOn(71, 80)]);
    assert.deepEqual(integration.processGridEvent(runtime, "C1", 0), [noteOff(71)]);
    assert.deepEqual(integration.processLifecycle(runtime, "focus_lost"), [
        noteOff(60), noteOff(64), noteOff(67),
        {type: "control_change", controller: 123, value: 0}
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), []);
});

test("lifecycle clears held modifiers but preserves voicing and bass selections", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "D8", 100);
    integration.processGridEvent(runtime, "H8", 100);
    integration.processGridEvent(runtime, "C7", 100);
    integration.processGridEvent(runtime, "C7", 0);
    integration.processGridEvent(runtime, "H7", 100);
    integration.processGridEvent(runtime, "H7", 0);
    integration.processLifecycle(runtime, "disabled");
    assert.equal(runtime.musical.chordType, "auto");
    assert.equal(runtime.musical.extensions.ninth, false);
    assert.equal(runtime.musical.voicing, 1);
    assert.equal(runtime.musical.bassEnabled, true);
    assert.equal(
        integration.selectionText(runtime),
        "Chord: Auto | Voice 1 | Bass -1 | Ext -"
    );
});

test("LED ownership paints one complete documented frame then stays diff-only", () => {
    const runtime = integration.createRuntime();
    const frame = integration.setLedOwnership(runtime, true);
    const byCoordinate = Object.fromEntries(
        frame.map((entry) => [entry.coordinate, entry])
    );

    assert.equal(frame.length, 64);
    assert.deepEqual(byCoordinate.A8, {coordinate: "A8", x: 0, y: 0, value: 21});
    assert.deepEqual(byCoordinate.E8, {coordinate: "E8", x: 4, y: 0, value: 1});
    assert.deepEqual(byCoordinate.A7, {coordinate: "A7", x: 0, y: 1, value: 2});
    assert.deepEqual(byCoordinate.B7, {coordinate: "B7", x: 1, y: 1, value: 13});
    assert.deepEqual(byCoordinate.D7, {coordinate: "D7", x: 3, y: 1, value: 0});
    assert.deepEqual(byCoordinate.F7, {coordinate: "F7", x: 5, y: 1, value: 13});
    assert.deepEqual(byCoordinate.H7, {coordinate: "H7", x: 7, y: 1, value: 1});
    assert.deepEqual(byCoordinate.A4, {coordinate: "A4", x: 0, y: 4, value: 49});
    assert.deepEqual(byCoordinate.B4, {coordinate: "B4", x: 1, y: 4, value: 45});
    assert.deepEqual(byCoordinate.A1, {coordinate: "A1", x: 0, y: 7, value: 49});
    assert.deepEqual(byCoordinate.B1, {coordinate: "B1", x: 1, y: 7, value: 45});
    assert.deepEqual(integration.renderLedDiff(runtime), []);
});

test("LED modifiers, selections, and held pads update only affected coordinates", () => {
    const runtime = integration.createRuntime();
    integration.setLedOwnership(runtime, true);

    integration.processGridEvent(runtime, "E8", 100);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "E8", x: 4, y: 0, value: 13}
    ]);
    integration.processGridEvent(runtime, "E8", 0);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "E8", x: 4, y: 0, value: 1}
    ]);
    integration.processGridEvent(runtime, "C8", 100);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "C8", x: 2, y: 0, value: 13}
    ]);
    integration.processGridEvent(runtime, "C8", 0);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "C8", x: 2, y: 0, value: 21}
    ]);
    integration.processGridEvent(runtime, "C7", 100);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "B7", x: 1, y: 1, value: 2},
        {coordinate: "C7", x: 2, y: 1, value: 13}
    ]);
    integration.processGridEvent(runtime, "C7", 0);
    integration.renderLedDiff(runtime);
    integration.processGridEvent(runtime, "A1", 90);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "A1", x: 0, y: 7, value: 3}
    ]);
    integration.processGridEvent(runtime, "A1", 0);
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "A1", x: 0, y: 7, value: 49}
    ]);
});

test("LED lifecycle clears held state and ownership clears before release", () => {
    const runtime = integration.createRuntime();
    integration.setLedOwnership(runtime, true);
    integration.processGridEvent(runtime, "B4", 100);
    integration.processGridEvent(runtime, "H8", 100);
    integration.renderLedDiff(runtime);

    integration.processLifecycle(runtime, "focus_lost");
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "B4", x: 1, y: 4, value: 45},
        {coordinate: "H8", x: 7, y: 0, value: 1}
    ]);
    const cleared = integration.setLedOwnership(runtime, false);
    assert.ok(cleared.length > 0);
    assert.ok(cleared.every((entry) => entry.value === 0));
    assert.deepEqual(integration.setLedOwnership(runtime, false), []);
    assert.deepEqual(integration.renderLedDiff(runtime), []);
});

test("Live scale callback normalization accepts property-prefixed values", () => {
    assert.deepEqual(scaleAdapter.callbackValues("Major"), ["Major"]);
    assert.deepEqual(scaleAdapter.callbackValues(["root_note", 4]), ["root_note", 4]);
    assert.deepEqual(
        scaleAdapter.valuesWithoutProperty(["root_note", 4], "root_note"),
        [4]
    );
    assert.equal(scaleAdapter.lastInteger(["scale_mode", 0], 1), 0);
    assert.deepEqual(
        scaleAdapter.normalizedIntervals(["scale_intervals", 0, 2, 3, 5, 7, 8, 10]),
        [0, 2, 3, 5, 7, 8, 10]
    );
    assert.equal(scaleAdapter.normalizedIntervals([0, 3, 3]), null);
    assert.equal(scaleAdapter.normalizedIntervals([]), null);
});
