/* Push Chord Grid WP4 deterministic grid-to-MIDI integration. */

var runtimeMusicalState;
var runtimeActiveNotes;

if (typeof module !== "undefined" && module.exports) {
    runtimeMusicalState = require("../core/state.js");
    runtimeActiveNotes = require("../core/active-notes.js");
} else {
    include("harmony.js");
    include("state.js");
    include("active-notes.js");
    runtimeMusicalState = musicalState;
    runtimeActiveNotes = activeNotes;
}

if (typeof outlet !== "undefined") {
    autowatch = 0;
    inlets = 1;
    outlets = 6;
}

var FILES = "ABCDEFGH";
var QUALITY_CONTROLS = {
    A8: "diminished",
    B8: "minor",
    C8: "major",
    D8: "suspended"
};
var EXTENSION_CONTROLS = {
    E8: "sixth",
    F8: "minor_seventh",
    G8: "major_seventh",
    H8: "ninth"
};
var VOICING_CONTROLS = {A7: -1, B7: 0, C7: 1};
var VOICE_LEADING_CONTROL = "D7";
var BASS_VOICING_CONTROLS = {E7: -1, F7: 0, G7: 1};
var BASS_TOGGLE_CONTROL = "H7";
var QUALITY_LABELS = {
    auto: "Auto",
    diminished: "Dim",
    minor: "Min",
    major: "Maj",
    suspended: "Sus"
};
var EXTENSION_LABELS = {
    sixth: "6",
    minor_seventh: "m7",
    major_seventh: "M7",
    ninth: "9"
};
var DISPLAY_QUALITY_ORDER = ["major", "minor", "diminished", "suspended", "auto"];
var DISPLAY_EXTENSION_ORDER = ["sixth", "minor_seventh", "major_seventh", "ninth"];
var LED_COLORS = {
    off: 0,
    dimNeutral: 1,
    note: 2,
    held: 3,
    controlOn: 13,
    quality: 21,
    chord: 45,
    tonicChord: 49
};

function emptyMap() {
    return Object.create(null);
}

function parsedCoordinate(coordinate) {
    var match = /^([A-H])([1-8])$/.exec(String(coordinate));
    if (!match) {
        throw new RangeError("coordinate must be A1 through H8");
    }
    return {file: match[1], column: FILES.indexOf(match[1]) + 1, rank: parseInt(match[2], 10)};
}

function roleForCoordinate(coordinate) {
    var parsed = parsedCoordinate(coordinate);
    if (parsed.rank <= 4) {
        return "chord";
    }
    if (QUALITY_CONTROLS[coordinate]) {
        return "quality_control";
    }
    if (EXTENSION_CONTROLS[coordinate]) {
        return "extension_control";
    }
    if (VOICING_CONTROLS[coordinate] !== undefined) {
        return "voicing_control";
    }
    if (coordinate === VOICE_LEADING_CONTROL) {
        return "voice_leading_control";
    }
    if (BASS_VOICING_CONTROLS[coordinate] !== undefined) {
        return "bass_voicing_control";
    }
    if (coordinate === BASS_TOGGLE_CONTROL) {
        return "bass_toggle_control";
    }
    return "reserved";
}

function gridContract() {
    var contract = {};
    var column;
    var rank;
    var coordinate;
    for (rank = 1; rank <= 8; rank += 1) {
        for (column = 0; column < 8; column += 1) {
            coordinate = FILES.charAt(column) + String(rank);
            contract[coordinate] = roleForCoordinate(coordinate);
        }
    }
    return contract;
}

function createRuntime(options) {
    return {
        musical: runtimeMusicalState.createState(options),
        notes: runtimeActiveNotes.createActiveNotes(),
        held: emptyMap(),
        controlHeld: emptyMap(),
        heldQualities: emptyMap(),
        qualityOrder: [],
        ledActive: false,
        ledCache: emptyMap(),
        scaleName: "Major",
        scaleMode: 1,
        lastChordSnapshot: null,
        activeChordSnapshots: emptyMap(),
        activeChordVelocities: emptyMap(),
        activeChordOrder: [],
        lastHoldMutation: false
    };
}

function checkedVelocity(velocity) {
    var parsed = typeof velocity === "number" ? velocity : parseInt(velocity, 10);
    if (isNaN(parsed) || parsed % 1 !== 0 || parsed < 0 || parsed > 127) {
        throw new RangeError("velocity must be an integer from 0 to 127");
    }
    return parsed;
}

function removeCoordinate(values, coordinate) {
    return values.filter(function (value) { return value !== coordinate; });
}

function updateQualityControl(runtime, coordinate, pressed) {
    var previous = runtime.musical.chordType;
    if (pressed && !runtime.controlHeld[coordinate]) {
        runtime.controlHeld[coordinate] = true;
        runtime.heldQualities[coordinate] = QUALITY_CONTROLS[coordinate];
        runtime.qualityOrder.push(coordinate);
    } else if (!pressed && runtime.controlHeld[coordinate]) {
        delete runtime.controlHeld[coordinate];
        delete runtime.heldQualities[coordinate];
        runtime.qualityOrder = removeCoordinate(runtime.qualityOrder, coordinate);
    }
    var last = runtime.qualityOrder.length ?
        runtime.qualityOrder[runtime.qualityOrder.length - 1] : null;
    runtimeMusicalState.setChordType(
        runtime.musical,
        last === null ? "auto" : runtime.heldQualities[last]
    );
    return previous !== runtime.musical.chordType;
}

function updateMomentaryExtension(runtime, coordinate, pressed) {
    var extension = EXTENSION_CONTROLS[coordinate];
    var previous = runtime.musical.extensions[extension];
    runtime.controlHeld[coordinate] = pressed;
    if (!pressed) {
        delete runtime.controlHeld[coordinate];
    }
    runtimeMusicalState.setExtension(
        runtime.musical,
        extension,
        pressed
    );
    return previous !== runtime.musical.extensions[extension];
}

function retargetHeldChords(runtime) {
    if (runtime.activeChordOrder.length === 0) {
        return [];
    }
    var replacements = [];
    var snapshots = emptyMap();
    runtime.activeChordOrder.forEach(function (coordinate) {
        var snapshot = runtimeMusicalState.retargetChordSnapshot(
            runtime.activeChordSnapshots[coordinate],
            runtime.musical.chordType,
            runtime.musical.extensions
        );
        snapshots[coordinate] = snapshot;
        replacements.push({
            owner: coordinate,
            pitches: snapshot.pitches,
            velocity: runtime.activeChordVelocities[coordinate]
        });
    });
    var events = runtimeActiveNotes.retargetOwners(runtime.notes, replacements);
    runtime.activeChordOrder.forEach(function (coordinate) {
        runtime.activeChordSnapshots[coordinate] = snapshots[coordinate];
    });
    var newest = runtime.activeChordOrder[runtime.activeChordOrder.length - 1];
    runtime.lastChordSnapshot = runtime.activeChordSnapshots[newest];
    if (runtime.musical.voiceLeadingEnabled) {
        runtime.musical.voiceLeadingPitches = runtime.lastChordSnapshot.chordPitches.slice();
    }
    return events;
}

function updateSteppedControl(runtime, coordinate, role, pressed) {
    if (!pressed) {
        delete runtime.controlHeld[coordinate];
        return;
    }
    if (runtime.controlHeld[coordinate]) {
        return;
    }
    runtime.controlHeld[coordinate] = true;
    if (role === "voicing_control") {
        if (VOICING_CONTROLS[coordinate] === 0) {
            runtimeMusicalState.setVoicing(runtime.musical, 0);
        } else {
            runtimeMusicalState.shiftVoicing(runtime.musical, VOICING_CONTROLS[coordinate]);
        }
    } else if (role === "voice_leading_control") {
        runtimeMusicalState.toggleVoiceLeading(runtime.musical);
    } else if (role === "bass_voicing_control") {
        if (BASS_VOICING_CONTROLS[coordinate] === 0) {
            runtimeMusicalState.setBassOctave(runtime.musical, -1);
        } else {
            runtimeMusicalState.shiftBassOctave(
                runtime.musical,
                BASS_VOICING_CONTROLS[coordinate]
            );
        }
    } else {
        runtimeMusicalState.toggleBass(runtime.musical);
    }
}

function processGridEvent(runtime, coordinate, velocity) {
    var parsed = parsedCoordinate(coordinate);
    var role = roleForCoordinate(coordinate);
    var normalizedVelocity = checkedVelocity(velocity);
    var pressed = normalizedVelocity > 0;
    var snapshot;
    var changed;
    runtime.lastHoldMutation = false;
    if (role === "reserved") {
        return [];
    }
    if (role === "quality_control") {
        changed = updateQualityControl(runtime, coordinate, pressed);
        if (changed && runtime.activeChordOrder.length > 0) {
            runtime.lastHoldMutation = true;
            return retargetHeldChords(runtime);
        }
        return [];
    }
    if (role === "extension_control") {
        changed = updateMomentaryExtension(runtime, coordinate, pressed);
        if (changed && runtime.activeChordOrder.length > 0) {
            runtime.lastHoldMutation = true;
            return retargetHeldChords(runtime);
        }
        return [];
    }
    if (
        role === "voicing_control" ||
        role === "voice_leading_control" ||
        role === "bass_voicing_control" ||
        role === "bass_toggle_control"
    ) {
        updateSteppedControl(runtime, coordinate, role, pressed);
        return [];
    }
    if (!pressed) {
        delete runtime.held[coordinate];
        delete runtime.activeChordSnapshots[coordinate];
        delete runtime.activeChordVelocities[coordinate];
        runtime.activeChordOrder = removeCoordinate(runtime.activeChordOrder, coordinate);
        return runtimeActiveNotes.releaseOwner(runtime.notes, coordinate);
    }
    snapshot = runtimeMusicalState.chordSnapshotForPad(
        runtime.musical,
        parsed.rank,
        parsed.column
    );
    runtime.held[coordinate] = true;
    runtime.activeChordOrder = removeCoordinate(runtime.activeChordOrder, coordinate);
    if (snapshot !== null) {
        runtime.lastChordSnapshot = snapshot;
        runtime.activeChordSnapshots[coordinate] = snapshot;
        runtime.activeChordVelocities[coordinate] = normalizedVelocity;
        runtime.activeChordOrder.push(coordinate);
    } else {
        delete runtime.activeChordSnapshots[coordinate];
        delete runtime.activeChordVelocities[coordinate];
    }
    return runtimeActiveNotes.pressOwner(
        runtime.notes,
        coordinate,
        snapshot === null ? [] : snapshot.pitches,
        normalizedVelocity
    );
}

function processLifecycle(runtime, lifecycle) {
    runtime.held = emptyMap();
    runtime.controlHeld = emptyMap();
    runtime.heldQualities = emptyMap();
    runtime.qualityOrder = [];
    runtime.lastChordSnapshot = null;
    runtime.activeChordSnapshots = emptyMap();
    runtime.activeChordVelocities = emptyMap();
    runtime.activeChordOrder = [];
    runtime.lastHoldMutation = false;
    runtimeMusicalState.resetMomentaryModifiers(runtime.musical);
    return runtimeActiveNotes.flushForLifecycle(runtime.notes, lifecycle);
}

function ledPosition(coordinate) {
    var parsed = parsedCoordinate(coordinate);
    return {x: parsed.column - 1, y: 8 - parsed.rank};
}

function directionalControlActive(value, neutral, direction) {
    if (direction === 0) {
        return value === neutral;
    }
    return direction < 0 ? value < neutral : value > neutral;
}

function ledColorForCoordinate(runtime, coordinate) {
    var parsed = parsedCoordinate(coordinate);
    var role = roleForCoordinate(coordinate);
    if (role === "chord") {
        if (runtime.held[coordinate]) {
            return LED_COLORS.held;
        }
        return parsed.column === 1 || parsed.column === 8 ?
            LED_COLORS.tonicChord : LED_COLORS.chord;
    }
    if (role === "quality_control") {
        return runtime.musical.chordType === QUALITY_CONTROLS[coordinate] ?
            LED_COLORS.controlOn : LED_COLORS.quality;
    }
    if (role === "extension_control") {
        return runtime.musical.extensions[EXTENSION_CONTROLS[coordinate]] ?
            LED_COLORS.controlOn : LED_COLORS.dimNeutral;
    }
    if (role === "voicing_control") {
        return directionalControlActive(
            runtime.musical.voicing,
            0,
            VOICING_CONTROLS[coordinate]
        ) ? LED_COLORS.controlOn : LED_COLORS.note;
    }
    if (role === "voice_leading_control") {
        return runtime.musical.voiceLeadingEnabled ?
            LED_COLORS.controlOn : LED_COLORS.note;
    }
    if (role === "bass_voicing_control") {
        return directionalControlActive(
            runtime.musical.bassOctave,
            -1,
            BASS_VOICING_CONTROLS[coordinate]
        ) ? LED_COLORS.controlOn : LED_COLORS.note;
    }
    if (role === "bass_toggle_control") {
        return runtime.musical.bassEnabled ? LED_COLORS.controlOn : LED_COLORS.dimNeutral;
    }
    return LED_COLORS.off;
}

function ledFrame(runtime) {
    var frame = [];
    var column;
    var rank;
    var coordinate;
    var position;
    for (rank = 1; rank <= 8; rank += 1) {
        for (column = 0; column < 8; column += 1) {
            coordinate = FILES.charAt(column) + String(rank);
            position = ledPosition(coordinate);
            frame.push({
                coordinate: coordinate,
                x: position.x,
                y: position.y,
                value: ledColorForCoordinate(runtime, coordinate)
            });
        }
    }
    return frame;
}

function renderLedDiff(runtime) {
    if (!runtime.ledActive) {
        return [];
    }
    var changes = [];
    ledFrame(runtime).forEach(function (entry) {
        if (runtime.ledCache[entry.coordinate] !== entry.value) {
            runtime.ledCache[entry.coordinate] = entry.value;
            changes.push(entry);
        }
    });
    return changes;
}

function setLedOwnership(runtime, owned) {
    var changes = [];
    if (owned) {
        runtime.ledActive = true;
        runtime.ledCache = emptyMap();
        return renderLedDiff(runtime);
    }
    if (!runtime.ledActive) {
        return changes;
    }
    Object.keys(runtime.ledCache).forEach(function (coordinate) {
        if (runtime.ledCache[coordinate] !== LED_COLORS.off) {
            var position = ledPosition(coordinate);
            changes.push({coordinate: coordinate, x: position.x, y: position.y, value: 0});
        }
    });
    runtime.ledActive = false;
    runtime.ledCache = emptyMap();
    return changes;
}

var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function selectionText(runtime) {
    var extensions = [];
    Object.keys(EXTENSION_CONTROLS).forEach(function (coordinate) {
        var extension = EXTENSION_CONTROLS[coordinate];
        if (runtime.musical.extensions[extension]) {
            extensions.push(EXTENSION_LABELS[extension]);
        }
    });
    return "Scale " + NOTE_NAMES[runtime.musical.rootNote] + " " + runtime.scaleName +
        " | Chord: " + QUALITY_LABELS[runtime.musical.chordType] +
        " | Voice " + runtime.musical.voicing +
        " | Nearest " + (runtime.musical.voiceLeadingEnabled ? "on" : "off") +
        " | Bass " + (runtime.musical.bassEnabled ? runtime.musical.bassOctave : "off") +
        " | Ext " + (extensions.length ? extensions.join("+") : "-");
}

var QUALITY_SUFFIXES = {
    auto: "",
    diminished: "dim",
    minor: "m",
    major: "",
    suspended: "sus"
};
var DISPLAY_QUALITY_SUFFIXES = {
    auto: "auto",
    diminished: "dim",
    minor: "m",
    major: "",
    suspended: "sus"
};

function activeChordSnapshot(runtime) {
    if (runtime.activeChordOrder.length === 0) {
        return null;
    }
    return runtime.activeChordSnapshots[
        runtime.activeChordOrder[runtime.activeChordOrder.length - 1]
    ] || null;
}

function displayExtensionMask(extensions) {
    var mask = 0;
    extensions.forEach(function (extension) {
        var index = DISPLAY_EXTENSION_ORDER.indexOf(extension);
        if (index === -1) {
            throw new RangeError("unknown chord extension in display snapshot");
        }
        mask += Math.pow(2, index);
    });
    return mask;
}

function playingDisplayCodeForSnapshot(snapshot) {
    if (snapshot === null) {
        return 0;
    }
    var qualityIndex = DISPLAY_QUALITY_ORDER.indexOf(snapshot.resolvedQuality);
    if (qualityIndex === -1) {
        throw new RangeError("unknown resolved chord quality in display snapshot");
    }
    var rootPitchClass = ((snapshot.rootPitch % 12) + 12) % 12;
    return 1 + rootPitchClass * 80 + qualityIndex * 16 +
        displayExtensionMask(snapshot.extensions);
}

function playingDisplayCode(runtime) {
    return playingDisplayCodeForSnapshot(activeChordSnapshot(runtime));
}

function playingDisplayLabelForSnapshot(snapshot) {
    if (snapshot === null) {
        return "--";
    }
    var root = NOTE_NAMES[((snapshot.rootPitch % 12) + 12) % 12];
    var suffix = DISPLAY_QUALITY_SUFFIXES[snapshot.resolvedQuality];
    if (suffix === undefined) {
        throw new RangeError("unknown resolved chord quality in display snapshot");
    }
    var extensions = DISPLAY_EXTENSION_ORDER.filter(function (extension) {
        return snapshot.extensions.indexOf(extension) !== -1;
    }).map(function (extension) {
        return EXTENSION_LABELS[extension];
    });
    return root + suffix + (extensions.length ? " +" + extensions.join("+") : "");
}

function playingDisplayLabel(runtime) {
    return playingDisplayLabelForSnapshot(activeChordSnapshot(runtime));
}

function playingDisplayLabels() {
    var labels = ["--"];
    var root;
    var quality;
    var mask;
    var extensions;
    for (root = 0; root < NOTE_NAMES.length; root += 1) {
        for (quality = 0; quality < DISPLAY_QUALITY_ORDER.length; quality += 1) {
            for (mask = 0; mask < 16; mask += 1) {
                extensions = DISPLAY_EXTENSION_ORDER.filter(function (extension, index) {
                    return (mask & Math.pow(2, index)) !== 0;
                });
                labels.push(playingDisplayLabelForSnapshot({
                    rootPitch: root,
                    resolvedQuality: DISPLAY_QUALITY_ORDER[quality],
                    extensions: extensions
                }));
            }
        }
    }
    return labels;
}

function signedInteger(value) {
    return value > 0 ? "+" + value : String(value);
}

function noteName(pitch) {
    return NOTE_NAMES[pitch % 12] + String(Math.floor(pitch / 12) - 2);
}

function feedbackText(runtime) {
    var snapshot = runtime.lastChordSnapshot;
    if (snapshot === null) {
        return "Last: --";
    }
    var root = NOTE_NAMES[snapshot.rootPitch % 12];
    var chordName = root + QUALITY_SUFFIXES[snapshot.resolvedQuality];
    var extensions = snapshot.extensions.map(function (extension) {
        return EXTENSION_LABELS[extension];
    });
    var inversion = snapshot.voiceLeadingEnabled ?
        "VL " + signedInteger(snapshot.nearestAdjustment) :
        "Voice " + signedInteger(snapshot.manualVoicing);
    var pitches = snapshot.pitches.map(function (pitch) {
        return noteName(pitch) + "(" + pitch + ")";
    });
    return "Last: " + chordName +
        " | Quality " + QUALITY_LABELS[snapshot.resolvedQuality] +
        " | Ext " + (extensions.length ? extensions.join("+") : "-") +
        " | Inv " + inversion +
        " | MIDI " + (pitches.length ? pitches.join(" ") : "-");
}

var maxRuntime = createRuntime();

function emitEvents(events) {
    if (typeof outlet === "undefined") {
        return;
    }
    events.forEach(function (event) {
        if (event.type === "control_change") {
            outlet(1, event.controller, event.value);
        } else {
            outlet(0, event.pitch, event.velocity);
        }
    });
}

function emitSelection() {
    if (typeof outlet !== "undefined") {
        outlet(2, selectionText(maxRuntime));
    }
}

function emitFeedback() {
    if (typeof outlet !== "undefined") {
        outlet(4, feedbackText(maxRuntime));
    }
}

function emitPlaying() {
    if (typeof outlet !== "undefined") {
        outlet(5, playingDisplayCode(maxRuntime));
    }
}

function emitLedEvents(events) {
    if (typeof outlet === "undefined") {
        return;
    }
    events.forEach(function (event) {
        outlet(3, event.x, event.y, event.value);
    });
}

function grid_event(coordinate, velocity) {
    var role = roleForCoordinate(String(coordinate));
    emitEvents(processGridEvent(maxRuntime, String(coordinate), velocity));
    if (role !== "chord" && role !== "reserved") {
        emitSelection();
    }
    if (role === "chord") {
        emitFeedback();
        emitPlaying();
    } else if (maxRuntime.lastHoldMutation) {
        emitFeedback();
        emitPlaying();
    }
    emitLedEvents(renderLedDiff(maxRuntime));
}

function lifecycle(name) {
    emitEvents(processLifecycle(maxRuntime, String(name)));
    emitSelection();
    emitFeedback();
    emitPlaying();
    emitLedEvents(renderLedDiff(maxRuntime));
}

function grid_ownership(value) {
    emitLedEvents(setLedOwnership(maxRuntime, parseInt(value, 10) !== 0));
}

function applyScaleSnapshot(runtime, rootNote, intervals) {
    runtimeMusicalState.updateScale(runtime.musical, rootNote, intervals);
}

function scale() {
    var values = Array.prototype.slice.call(arguments);
    var rootNote = parseInt(values.shift(), 10);
    var intervals = values.map(function (value) { return parseInt(value, 10); });
    applyScaleSnapshot(maxRuntime, rootNote, intervals);
    emitSelection();
    emitLedEvents(renderLedDiff(maxRuntime));
}

function scale_name() {
    maxRuntime.scaleName = Array.prototype.slice.call(arguments).join(" ");
    emitSelection();
}

function scale_mode(value) {
    maxRuntime.scaleMode = parseInt(value, 10) !== 0 ? 1 : 0;
    emitSelection();
}

function base_octave(value) {
    runtimeMusicalState.updateBaseOctave(maxRuntime.musical, parseInt(value, 10));
    emitLedEvents(renderLedDiff(maxRuntime));
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        BASS_TOGGLE_CONTROL: BASS_TOGGLE_CONTROL,
        BASS_VOICING_CONTROLS: BASS_VOICING_CONTROLS,
        EXTENSION_CONTROLS: EXTENSION_CONTROLS,
        LED_COLORS: LED_COLORS,
        QUALITY_CONTROLS: QUALITY_CONTROLS,
        VOICING_CONTROLS: VOICING_CONTROLS,
        VOICE_LEADING_CONTROL: VOICE_LEADING_CONTROL,
        activeChordSnapshot: activeChordSnapshot,
        applyScaleSnapshot: applyScaleSnapshot,
        createRuntime: createRuntime,
        feedbackText: feedbackText,
        gridContract: gridContract,
        ledColorForCoordinate: ledColorForCoordinate,
        ledFrame: ledFrame,
        ledPosition: ledPosition,
        parsedCoordinate: parsedCoordinate,
        playingDisplayCode: playingDisplayCode,
        playingDisplayCodeForSnapshot: playingDisplayCodeForSnapshot,
        playingDisplayLabel: playingDisplayLabel,
        playingDisplayLabelForSnapshot: playingDisplayLabelForSnapshot,
        playingDisplayLabels: playingDisplayLabels,
        processGridEvent: processGridEvent,
        processLifecycle: processLifecycle,
        renderLedDiff: renderLedDiff,
        retargetHeldChords: retargetHeldChords,
        roleForCoordinate: roleForCoordinate,
        selectionText: selectionText,
        setLedOwnership: setLedOwnership
    };
}
