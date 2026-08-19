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
            reserved: 16,
            voicing_control: 3,
            voice_leading_control: 1,
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
            "voicing_control", "voicing_control", "voicing_control", "voice_leading_control",
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

test("Orchid quality and extension pads are momentary chord modifiers", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "B8", 100);
    integration.processGridEvent(runtime, "E8", 100);
    integration.processGridEvent(runtime, "F8", 100);
    integration.processGridEvent(runtime, "G8", 100);
    integration.processGridEvent(runtime, "H8", 100);
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Min | Voice 0 | Nearest off | Bass off | Ext 6+m7+M7+9"
    );
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 90), [
        noteOn(60, 90), noteOn(63, 90), noteOn(67, 90), noteOn(69, 90),
        noteOn(70, 90), noteOn(71, 90), noteOn(74, 90)
    ]);

    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(63), noteOff(67), noteOff(69),
        noteOff(70), noteOff(71), noteOff(74)
    ]);
    ["B8", "E8", "F8", "G8", "H8"].forEach((coordinate) => {
        assert.deepEqual(integration.processGridEvent(runtime, coordinate, 0), []);
    });
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -"
    );
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

test("live held-chord behavior has no legacy mode state", () => {
    const runtime = integration.createRuntime();
    assert.equal("holdMode" in runtime, false);
    assert.equal(integration.setHoldMode, undefined);
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -"
    );
});

test("quality and extension edges always retarget held chords", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "A1", 88);
    assert.deepEqual(integration.processGridEvent(runtime, "B8", 100), [
        noteOff(64), noteOn(63, 88)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "H8", 100), [noteOn(74, 88)]);
    assert.deepEqual(runtime.notes.owners.$A1, [60, 63, 67, 74]);
    assert.equal(integration.playingDisplayLabel(runtime), "Cm +9");
    assert.equal(runtime.lastHoldMutation, true);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(63), noteOff(67), noteOff(74)
    ]);
});

test("quality press and release retarget an automatic minor hold", () => {
    const runtime = integration.createRuntime({
        rootNote: 9,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 73), [
        noteOn(69, 73), noteOn(72, 73), noteOn(76, 73)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "C8", 100), [
        noteOff(72), noteOn(73, 73)
    ]);
    assert.equal(runtime.lastHoldMutation, true);
    assert.deepEqual(runtime.notes.owners.$A1, [69, 73, 76]);
    assert.equal(integration.playingDisplayLabel(runtime), "A");
    assert.match(integration.feedbackText(runtime), /^Last: A \| Quality Maj/);
    assert.deepEqual(integration.processGridEvent(runtime, "C8", 80), []);
    assert.equal(runtime.lastHoldMutation, false);
    assert.deepEqual(integration.processGridEvent(runtime, "C8", 0), [
        noteOff(73), noteOn(72, 73)
    ]);
    assert.deepEqual(runtime.notes.owners.$A1, [69, 72, 76]);
    assert.equal(integration.playingDisplayLabel(runtime), "Am");
});

test("live 9ths retain each overlapping owner's physical velocity", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "A1", 40);
    integration.processGridEvent(runtime, "C1", 110);
    assert.deepEqual(integration.processGridEvent(runtime, "H8", 100), [
        noteOn(74, 40), noteOn(78, 110)
    ]);
    assert.deepEqual(runtime.notes.owners.$A1, [60, 64, 67, 74]);
    assert.deepEqual(runtime.notes.owners.$C1, [64, 67, 71, 78]);
    assert.equal(integration.playingDisplayLabel(runtime), "Em +9");
    assert.deepEqual(integration.processGridEvent(runtime, "H8", 0), [
        noteOff(74), noteOff(78)
    ]);
});

test("overlapping quality mutation is globally atomic", () => {
    const runtime = integration.createRuntime({
        rootNote: 0,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    integration.processGridEvent(runtime, "A1", 40);
    integration.processGridEvent(runtime, "C1", 110);
    assert.deepEqual(integration.processGridEvent(runtime, "C8", 100), [
        noteOn(64, 40)
    ]);
    assert.equal(runtime.notes.counts.$63, 1);
    assert.equal(runtime.notes.counts.$67, 2);
    assert.deepEqual(integration.processGridEvent(runtime, "C8", 0), [noteOff(64)]);
    assert.equal(runtime.notes.counts.$63, 2);
    assert.equal(runtime.notes.counts.$67, 2);
});

test("retrigger replaces the retained velocity for later live extensions", () => {
    const runtime = integration.createRuntime({
        rootNote: 9,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    integration.processGridEvent(runtime, "C8", 100);
    integration.processGridEvent(runtime, "A1", 55);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 99), [
        noteOff(69), noteOff(73), noteOff(76),
        noteOn(69, 99), noteOn(73, 99), noteOn(76, 99)
    ]);
    assert.equal(runtime.activeChordVelocities.A1, 99);
    assert.deepEqual(integration.processGridEvent(runtime, "H8", 100), [noteOn(83, 99)]);
});

test("lifecycle flushes a live held-chord replacement", () => {
    const runtime = integration.createRuntime({
        rootNote: 9,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    integration.processGridEvent(runtime, "A1", 73);
    integration.processGridEvent(runtime, "C8", 100);
    assert.deepEqual(integration.processLifecycle(runtime, "focus_lost"), [
        noteOff(69), noteOff(73), noteOff(76),
        {type: "control_change", controller: 123, value: 0}
    ]);
    assert.equal("holdMode" in runtime, false);
    assert.deepEqual(runtime.activeChordVelocities, Object.create(null));
    assert.equal(integration.playingDisplayLabel(runtime), "--");
    assert.equal(integration.feedbackText(runtime), "Last: --");
});

test("unrelated state changes do not retarget a held owner", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "A1", 91);
    integration.applyScaleSnapshot(runtime, 9, [0, 2, 3, 5, 7, 8, 10]);
    integration.processGridEvent(runtime, "C7", 100);
    integration.processGridEvent(runtime, "D7", 100);
    integration.processGridEvent(runtime, "H7", 100);
    assert.deepEqual(runtime.notes.owners.$A1, [60, 64, 67]);
    assert.deepEqual(runtime.activeChordSnapshots.A1.pitches, [60, 64, 67]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(64), noteOff(67)
    ]);
});

test("voicing and bass controls persist and only step once per physical press", () => {
    const runtime = integration.createRuntime();
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -"
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
        "Scale C Major | Chord: Auto | Voice 1 | Nearest off | Bass -2 | Ext -"
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

test("D7 toggles nearest voice leading once per press and never emits MIDI", () => {
    const runtime = integration.createRuntime();
    integration.setLedOwnership(runtime, true);
    assert.deepEqual(integration.processGridEvent(runtime, "D7", 100), []);
    assert.equal(runtime.musical.voiceLeadingEnabled, true);
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Auto | Voice 0 | Nearest on | Bass off | Ext -"
    );
    assert.deepEqual(integration.renderLedDiff(runtime), [
        {coordinate: "D7", x: 3, y: 1, value: 13}
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "D7", 80), []);
    assert.equal(runtime.musical.voiceLeadingEnabled, true);
    assert.deepEqual(integration.processGridEvent(runtime, "D7", 0), []);
    assert.deepEqual(integration.processGridEvent(runtime, "D7", 127), []);
    assert.equal(runtime.musical.voiceLeadingEnabled, false);
});

test("nearest mode follows the exact C major I-IV-V-I golden progression", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "D7", 100);
    integration.processGridEvent(runtime, "D7", 0);
    const progression = [
        ["A1", [60, 64, 67], 0, 0],
        ["D1", [60, 65, 69], -1, 6],
        ["E1", [59, 62, 67], -2, 10],
        ["A1", [60, 64, 67], 0, 6]
    ];
    progression.forEach(([coordinate, pitches, adjustment, score]) => {
        integration.processGridEvent(runtime, coordinate, 91);
        assert.deepEqual(runtime.lastChordSnapshot.chordPitches, pitches);
        assert.equal(runtime.lastChordSnapshot.nearestAdjustment, adjustment);
        assert.equal(runtime.lastChordSnapshot.nearestScore, score);
        integration.processGridEvent(runtime, coordinate, 0);
    });
});

test("live held-chord mutation updates enabled Nearest history to the newest hold", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "D7", 100);
    integration.processGridEvent(runtime, "D7", 0);
    integration.processGridEvent(runtime, "A1", 50);
    integration.processGridEvent(runtime, "D1", 90);
    integration.processGridEvent(runtime, "B8", 100);
    assert.deepEqual(
        runtime.musical.voiceLeadingPitches,
        runtime.activeChordSnapshots.D1.chordPitches
    );
    assert.deepEqual(runtime.lastChordSnapshot, runtime.activeChordSnapshots.D1);
});

test("last-chord feedback is the complete owner snapshot, including shared pitches", () => {
    const runtime = integration.createRuntime();
    assert.equal(integration.feedbackText(runtime), "Last: --");
    integration.processGridEvent(runtime, "A1", 100);
    assert.equal(
        integration.feedbackText(runtime),
        "Last: C | Quality Maj | Ext - | Inv Voice 0 | MIDI C3(60) E3(64) G3(67)"
    );
    assert.deepEqual(integration.processGridEvent(runtime, "C1", 80), [noteOn(71, 80)]);
    assert.equal(
        integration.feedbackText(runtime),
        "Last: Em | Quality Min | Ext - | Inv Voice 0 | MIDI E3(64) G3(67) B3(71)"
    );
    integration.processGridEvent(runtime, "C1", 0);
    assert.match(integration.feedbackText(runtime), /^Last: Em/);
    integration.processLifecycle(runtime, "focus_lost");
    assert.equal(integration.feedbackText(runtime), "Last: --");
});

test("feedback identifies extensions, bass, manual quality, and nearest inversion", () => {
    const runtime = integration.createRuntime();
    integration.processGridEvent(runtime, "B8", 100);
    integration.processGridEvent(runtime, "H8", 100);
    integration.processGridEvent(runtime, "H7", 100);
    integration.processGridEvent(runtime, "H7", 0);
    integration.processGridEvent(runtime, "D7", 100);
    integration.processGridEvent(runtime, "D7", 0);
    integration.processGridEvent(runtime, "A1", 64);
    integration.processGridEvent(runtime, "A1", 0);
    integration.processGridEvent(runtime, "D1", 64);
    assert.equal(
        integration.feedbackText(runtime),
        "Last: Fm | Quality Min | Ext 9 | Inv VL -2 | MIDI F2(53) C3(60) F3(65) G3(67) G#3(68)"
    );
});

test("Push Playing enum has exact deterministic chord labels and codes", () => {
    const labels = integration.playingDisplayLabels();
    assert.equal(labels.length, 961);
    assert.equal(new Set(labels).size, 961);
    assert.equal(labels[0], "--");
    assert.equal(labels[1], "C");
    assert.equal(labels[27], "Cm +m7+9");
    assert.equal(labels[960], "Bauto +6+m7+M7+9");
    assert.equal(
        integration.playingDisplayCodeForSnapshot({
            rootPitch: 60,
            resolvedQuality: "minor",
            extensions: ["minor_seventh", "ninth"]
        }),
        27
    );
    assert.equal(
        integration.playingDisplayLabelForSnapshot({
            rootPitch: 60,
            resolvedQuality: "minor",
            extensions: ["minor_seventh", "ninth"]
        }),
        "Cm +m7+9"
    );
    assert.equal(integration.playingDisplayCodeForSnapshot(null), 0);
    assert.equal(integration.playingDisplayLabelForSnapshot(null), "--");
});

test("Push Playing follows newest live overlapping hold and retrigger", () => {
    const runtime = integration.createRuntime({
        rootNote: 0,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    assert.equal(integration.playingDisplayCode(runtime), 0);
    assert.equal(integration.playingDisplayLabel(runtime), "--");

    integration.processGridEvent(runtime, "A1", 88);
    assert.equal(integration.playingDisplayLabel(runtime), "Cm");
    integration.processGridEvent(runtime, "C1", 73);
    assert.equal(integration.playingDisplayLabel(runtime), "D#");

    integration.applyScaleSnapshot(runtime, 9, [0, 2, 3, 5, 7, 8, 10]);
    integration.processGridEvent(runtime, "H8", 100);
    assert.equal(integration.playingDisplayLabel(runtime), "D# +9");

    integration.processGridEvent(runtime, "C1", 0);
    assert.equal(integration.playingDisplayLabel(runtime), "Cm +9");
    integration.processGridEvent(runtime, "A1", 99);
    assert.equal(integration.playingDisplayLabel(runtime), "Am +9");
    assert.equal(runtime.activeChordOrder.length, 1);

    integration.processGridEvent(runtime, "A1", 0);
    assert.equal(integration.playingDisplayCode(runtime), 0);
    assert.equal(integration.playingDisplayLabel(runtime), "--");
});

test("Push Playing ignores controls and clears on every lifecycle", () => {
    const lifecycles = ["panic", "focus_lost", "disabled", "reload", "deleted", "set_closed"];
    lifecycles.forEach((lifecycle) => {
        const runtime = integration.createRuntime();
        integration.processGridEvent(runtime, "B8", 100);
        integration.processGridEvent(runtime, "F8", 100);
        integration.processGridEvent(runtime, "H8", 100);
        assert.equal(integration.playingDisplayLabel(runtime), "--");
        integration.processGridEvent(runtime, "A1", 64);
        assert.equal(integration.playingDisplayLabel(runtime), "Cm +m7+9");
        integration.processLifecycle(runtime, lifecycle);
        assert.equal(integration.playingDisplayCode(runtime), 0);
        assert.equal(integration.playingDisplayLabel(runtime), "--");
        assert.deepEqual(runtime.activeChordSnapshots, Object.create(null));
        assert.deepEqual(runtime.activeChordVelocities, Object.create(null));
        assert.deepEqual(runtime.activeChordOrder, []);
    });
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

test("duplicate runtimes isolate scale, history, owners, controls, and LEDs", () => {
    const first = integration.createRuntime();
    const second = integration.createRuntime({
        rootNote: 9,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10]
    });
    integration.setLedOwnership(first, true);
    integration.setLedOwnership(second, true);
    integration.processGridEvent(first, "D7", 100);
    integration.processGridEvent(first, "D7", 0);
    integration.processGridEvent(second, "B8", 100);
    integration.processGridEvent(second, "H8", 100);

    assert.deepEqual(integration.processGridEvent(first, "A1", 31), [
        noteOn(60, 31), noteOn(64, 31), noteOn(67, 31)
    ]);
    assert.deepEqual(integration.processGridEvent(second, "A1", 117), [
        noteOn(69, 117), noteOn(72, 117), noteOn(76, 117), noteOn(83, 117)
    ]);
    assert.equal(first.musical.voiceLeadingEnabled, true);
    assert.equal(second.musical.voiceLeadingEnabled, false);
    assert.equal(first.musical.chordType, "auto");
    assert.equal(second.musical.chordType, "minor");
    assert.deepEqual(first.notes.owners.$A1, [60, 64, 67]);
    assert.deepEqual(second.notes.owners.$A1, [69, 72, 76, 83]);

    assert.deepEqual(integration.processLifecycle(first, "focus_lost"), [
        noteOff(60), noteOff(64), noteOff(67),
        {type: "control_change", controller: 123, value: 0}
    ]);
    assert.deepEqual(second.notes.owners.$A1, [69, 72, 76, 83]);
    assert.equal(second.ledActive, true);
    assert.equal(second.musical.chordType, "minor");
    assert.deepEqual(integration.processGridEvent(second, "A1", 0), [
        noteOff(69), noteOff(72), noteOff(76), noteOff(83)
    ]);
});

test("C Major to C Minor to A Minor changes preserve a held owner snapshot", () => {
    const runtime = integration.createRuntime();
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 88), [
        noteOn(60, 88), noteOn(64, 88), noteOn(67, 88)
    ]);
    integration.applyScaleSnapshot(runtime, 0, [0, 2, 3, 5, 7, 8, 10]);
    integration.applyScaleSnapshot(runtime, 9, [0, 2, 3, 5, 7, 8, 10]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(60), noteOff(64), noteOff(67)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 99), [
        noteOn(69, 99), noteOn(72, 99), noteOn(76, 99)
    ]);
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 0), [
        noteOff(69), noteOff(72), noteOff(76)
    ]);
});

test("30-minute-equivalent hardening sequence leaves no unmatched notes", () => {
    const runtime = integration.createRuntime();
    const sounding = new Set();
    const scales = [
        [0, [0, 2, 4, 5, 7, 9, 11]],
        [0, [0, 2, 3, 5, 7, 8, 10]],
        [9, [0, 2, 3, 5, 7, 8, 10]]
    ];
    const lifecycles = ["focus_lost", "disabled", "reload", "deleted", "set_closed"];
    let eventCount = 0;

    function record(events) {
        events.forEach((event) => {
            eventCount += 1;
            if (event.type === "note_on") {
                assert.equal(sounding.has(event.pitch), false, `duplicate note-on ${event.pitch}`);
                sounding.add(event.pitch);
            } else if (event.type === "note_off") {
                assert.equal(sounding.delete(event.pitch), true, `unmatched note-off ${event.pitch}`);
            } else {
                assert.deepEqual(event, {type: "control_change", controller: 123, value: 0});
                assert.equal(sounding.size, 0);
            }
        });
    }

    integration.processGridEvent(runtime, "D7", 100);
    integration.processGridEvent(runtime, "D7", 0);
    for (let second = 0; second < 30 * 60; second += 1) {
        const velocity = (second % 127) + 1;
        const first = `${"ABCDEFGH"[second % 8]}${(second % 4) + 1}`;
        const secondCoordinate = `${"ABCDEFGH"[(second + 2) % 8]}${(second % 4) + 1}`;
        record(integration.processGridEvent(runtime, first, velocity));
        record(integration.processGridEvent(runtime, secondCoordinate, 127 - (second % 126)));
        if (second % 3 === 0) {
            const [root, intervals] = scales[Math.floor(second / 3) % scales.length];
            integration.applyScaleSnapshot(runtime, root, intervals);
        }
        if (second % 37 === 0) {
            record(integration.processLifecycle(
                runtime,
                lifecycles[Math.floor(second / 37) % lifecycles.length]
            ));
        } else {
            record(integration.processGridEvent(runtime, first, 0));
            record(integration.processGridEvent(runtime, secondCoordinate, 0));
        }
        assert.equal(sounding.size, 0, `notes remain after simulated second ${second}`);
    }

    assert.ok(eventCount > 10000);
    assert.deepEqual(runtime.notes.owners, Object.create(null));
    assert.deepEqual(runtime.notes.counts, Object.create(null));
    assert.equal(sounding.size, 0);
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
    assert.equal("holdMode" in runtime, false);
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Major | Chord: Auto | Voice 1 | Nearest off | Bass -1 | Ext -"
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
    assert.deepEqual(byCoordinate.D7, {coordinate: "D7", x: 3, y: 1, value: 2});
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
