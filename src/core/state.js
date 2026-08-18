"use strict";

/* Musical selection state. Active-note ownership intentionally lives separately. */

var stateHarmony = typeof module !== "undefined" && module.exports ?
    require("./harmony.js") : harmony;
var stateLayout = typeof module !== "undefined" && module.exports ?
    require("./note-layout.js") : noteLayout;
var DEFAULT_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

function createState(options) {
    var supplied = options || {};
    var intervals = supplied.scaleIntervals === undefined ?
        DEFAULT_SCALE_INTERVALS : supplied.scaleIntervals;
    var rootNote = supplied.rootNote === undefined ? 0 : supplied.rootNote;
    var baseOctave = supplied.baseOctave === undefined ? 3 : supplied.baseOctave;
    stateHarmony.tonicPitch(rootNote, baseOctave);
    return {
        quality: "major",
        seventhEnabled: false,
        ninthEnabled: false,
        rootNote: rootNote,
        scaleIntervals: stateHarmony.validateScaleIntervals(intervals),
        baseOctave: baseOctave
    };
}

function selectQuality(state, quality) {
    if (!Object.prototype.hasOwnProperty.call(stateHarmony.QUALITY_INTERVALS, quality)) {
        throw new RangeError("unknown chord quality: " + quality);
    }
    state.quality = quality;
}

function toggleExtension(state, extension) {
    if (extension === 7) {
        state.seventhEnabled = !state.seventhEnabled;
        return state.seventhEnabled;
    }
    if (extension === 9) {
        state.ninthEnabled = !state.ninthEnabled;
        return state.ninthEnabled;
    }
    throw new RangeError("extension must be 7 or 9");
}

function updateScale(state, rootNote, intervals) {
    var normalized = stateHarmony.validateScaleIntervals(intervals);
    stateHarmony.tonicPitch(rootNote, state.baseOctave);
    state.rootNote = rootNote;
    state.scaleIntervals = normalized;
}

function chordForDegree(state, degree) {
    var root = stateHarmony.degreeRoot(
        state.rootNote,
        state.scaleIntervals,
        state.baseOctave,
        degree
    );
    return stateHarmony.chordPitches(
        root,
        state.quality,
        state.seventhEnabled,
        state.ninthEnabled
    );
}

function noteForPad(state, row, column) {
    return stateLayout.noteForPad(
        state.rootNote,
        state.scaleIntervals,
        state.baseOctave,
        row,
        column
    );
}

var musicalState = {
    chordForDegree: chordForDegree,
    createState: createState,
    noteForPad: noteForPad,
    selectQuality: selectQuality,
    toggleExtension: toggleExtension,
    updateScale: updateScale
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = musicalState;
}
