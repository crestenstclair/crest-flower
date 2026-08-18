"use strict";

/* Musical selection state. Active-note ownership intentionally lives separately. */

var stateHarmony = typeof module !== "undefined" && module.exports ?
    require("./harmony.js") : harmony;
var DEFAULT_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
var CHORD_TYPES = ["auto", "diminished", "minor", "major", "suspended"];
var EXTENSIONS = ["sixth", "minor_seventh", "major_seventh", "ninth"];

function emptyExtensions() {
    return {
        sixth: false,
        minor_seventh: false,
        major_seventh: false,
        ninth: false
    };
}

function createState(options) {
    var supplied = options || {};
    var intervals = supplied.scaleIntervals === undefined ?
        DEFAULT_SCALE_INTERVALS : supplied.scaleIntervals;
    var rootNote = supplied.rootNote === undefined ? 0 : supplied.rootNote;
    var baseOctave = supplied.baseOctave === undefined ? 3 : supplied.baseOctave;
    stateHarmony.tonicPitch(rootNote, baseOctave);
    return {
        chordType: "auto",
        extensions: emptyExtensions(),
        voicing: 0,
        bassEnabled: false,
        bassOctave: -1,
        rootNote: rootNote,
        scaleIntervals: stateHarmony.validateScaleIntervals(intervals),
        baseOctave: baseOctave
    };
}

function setChordType(state, chordType) {
    if (CHORD_TYPES.indexOf(chordType) === -1) {
        throw new RangeError("unknown chord type");
    }
    state.chordType = chordType;
}

function setExtension(state, extension, enabled) {
    if (EXTENSIONS.indexOf(extension) === -1) {
        throw new RangeError("unknown chord extension");
    }
    if (typeof enabled !== "boolean") {
        throw new TypeError("extension enabled state must be boolean");
    }
    state.extensions[extension] = enabled;
}

function setVoicing(state, voicing) {
    stateHarmony.applyVoicing([], voicing);
    state.voicing = voicing;
}

function shiftVoicing(state, direction) {
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("voicing direction must be -1 or 1");
    }
    setVoicing(state, Math.max(-16, Math.min(16, state.voicing + direction)));
    return state.voicing;
}

function toggleBass(state) {
    state.bassEnabled = !state.bassEnabled;
    return state.bassEnabled;
}

function setBassOctave(state, bassOctave) {
    stateHarmony.addBass([], 60, false, bassOctave);
    state.bassOctave = bassOctave;
}

function shiftBassOctave(state, direction) {
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("bass octave direction must be -1 or 1");
    }
    setBassOctave(state, Math.max(-4, Math.min(1, state.bassOctave + direction)));
    return state.bassOctave;
}

function resetMomentaryModifiers(state) {
    setChordType(state, "auto");
    EXTENSIONS.forEach(function (extension) {
        state.extensions[extension] = false;
    });
}

function updateScale(state, rootNote, intervals) {
    var normalized = stateHarmony.validateScaleIntervals(intervals);
    stateHarmony.tonicPitch(rootNote, state.baseOctave);
    state.rootNote = rootNote;
    state.scaleIntervals = normalized;
}

function updateBaseOctave(state, baseOctave) {
    stateHarmony.tonicPitch(state.rootNote, baseOctave);
    state.baseOctave = baseOctave;
}

function chordForPad(state, row, degree) {
    return stateHarmony.orchidChordPitches(
        state.rootNote,
        state.scaleIntervals,
        state.baseOctave,
        row,
        degree,
        state.chordType,
        state.extensions,
        state.voicing,
        state.bassEnabled,
        state.bassOctave
    );
}

var musicalState = {
    chordForPad: chordForPad,
    createState: createState,
    resetMomentaryModifiers: resetMomentaryModifiers,
    setBassOctave: setBassOctave,
    setChordType: setChordType,
    setExtension: setExtension,
    setVoicing: setVoicing,
    shiftBassOctave: shiftBassOctave,
    shiftVoicing: shiftVoicing,
    toggleBass: toggleBass,
    updateBaseOctave: updateBaseOctave,
    updateScale: updateScale
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = musicalState;
}
