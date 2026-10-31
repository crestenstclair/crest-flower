"use strict";

/* Musical selection state. Active-note ownership intentionally lives separately. */

var stateHarmony = typeof module !== "undefined" && module.exports ?
    require("./harmony.js") : harmony;
var DEFAULT_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
var CHORD_TYPES = ["auto"].concat(stateHarmony.CHORD_TYPES);
var EXTENSIONS = stateHarmony.EXTENSION_ORDER;

function emptyExtensions() {
    return {
        sixth: false,
        seventh: false,
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
        voiceLeadingEnabled: false,
        voiceLeadingPitches: [],
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
    resetVoiceLeadingHistory(state);
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
    resetVoiceLeadingHistory(state);
}

function resetVoiceLeadingHistory(state) {
    state.voiceLeadingPitches = [];
}

function toggleVoiceLeading(state) {
    state.voiceLeadingEnabled = !state.voiceLeadingEnabled;
    resetVoiceLeadingHistory(state);
    return state.voiceLeadingEnabled;
}

function updateScale(state, rootNote, intervals) {
    var normalized = stateHarmony.validateScaleIntervals(intervals);
    stateHarmony.tonicPitch(rootNote, state.baseOctave);
    state.rootNote = rootNote;
    state.scaleIntervals = normalized;
    resetVoiceLeadingHistory(state);
}

function updateBaseOctave(state, baseOctave) {
    stateHarmony.tonicPitch(state.rootNote, baseOctave);
    state.baseOctave = baseOctave;
    resetVoiceLeadingHistory(state);
}

function resolvedQuality(rootPitch, chordPitches, requestedType) {
    if (requestedType !== "auto") {
        return requestedType;
    }
    var intervals = chordPitches.map(function (pitch) {
        return (pitch - rootPitch + 120) % 12;
    });
    if (intervals.indexOf(3) !== -1 && intervals.indexOf(6) !== -1) {
        return "diminished";
    }
    if (intervals.indexOf(3) !== -1 && intervals.indexOf(7) !== -1) {
        return "minor";
    }
    if (intervals.indexOf(4) !== -1 && intervals.indexOf(7) !== -1) {
        return "major";
    }
    if (intervals.indexOf(5) !== -1 && intervals.indexOf(7) !== -1) {
        return "suspended";
    }
    return "auto";
}

function checkedExtensions(extensions) {
    if (!extensions || typeof extensions !== "object") {
        throw new TypeError("extensions must be an object");
    }
    var result = emptyExtensions();
    EXTENSIONS.forEach(function (extension) {
        if (typeof extensions[extension] !== "boolean") {
            throw new TypeError("extension state must be boolean");
        }
        result[extension] = extensions[extension];
    });
    return result;
}

function retargetChordSnapshot(snapshot, chordType, extensions) {
    if (!snapshot || typeof snapshot !== "object") {
        throw new TypeError("snapshot must be an object");
    }
    if (CHORD_TYPES.indexOf(chordType) === -1) {
        throw new RangeError("unknown chord type");
    }
    if (!Array.isArray(snapshot.automaticChordPitches)) {
        throw new TypeError("snapshot has no automatic chord context");
    }
    var normalizedExtensions = checkedExtensions(extensions);
    var triad = chordType === "auto" ?
        snapshot.automaticChordPitches.slice() :
        stateHarmony.qualityChordPitches(snapshot.rootPitch, chordType);
    var quality = chordType === "auto" ? snapshot.automaticQuality : chordType;
    var seventhPitch = normalizedExtensions.seventh ? stateHarmony.contextualSeventhPitch(
        snapshot.rootPitch, chordType, snapshot.automaticSeventhPitch
    ) : null;
    var chordPitches = stateHarmony.addExtensions(
        triad,
        snapshot.rootPitch,
        normalizedExtensions,
        seventhPitch
    );
    chordPitches = stateHarmony.applyVoicing(chordPitches, snapshot.manualVoicing);
    if (snapshot.voiceLeadingEnabled) {
        chordPitches = stateHarmony.applyVoicing(
            chordPitches,
            snapshot.nearestAdjustment
        );
    }
    return {
        rootPitch: snapshot.rootPitch,
        requestedQuality: chordType,
        resolvedQuality: quality,
        automaticQuality: snapshot.automaticQuality,
        automaticChordPitches: snapshot.automaticChordPitches.slice(),
        automaticSeventhPitch: snapshot.automaticSeventhPitch,
        seventhPitch: seventhPitch,
        seventhInterval: seventhPitch === null ? null : seventhPitch - snapshot.rootPitch,
        extensions: EXTENSIONS.filter(function (extension) {
            return normalizedExtensions[extension];
        }),
        manualVoicing: snapshot.manualVoicing,
        voiceLeadingEnabled: snapshot.voiceLeadingEnabled,
        nearestAdjustment: snapshot.nearestAdjustment,
        nearestScore: snapshot.nearestScore,
        bassEnabled: snapshot.bassEnabled,
        bassOctave: snapshot.bassOctave,
        chordPitches: chordPitches.slice(),
        pitches: stateHarmony.addBass(
            chordPitches,
            snapshot.rootPitch,
            snapshot.bassEnabled,
            snapshot.bassOctave
        )
    };
}

function chordSnapshotForPad(state, row, degree) {
    var baseRoot = stateHarmony.degreeRoot(
        state.rootNote,
        state.scaleIntervals,
        state.baseOctave,
        degree
    );
    var rootPitch = baseRoot === null ? null : baseRoot + (row - 1) * 12;
    if (rootPitch === null || rootPitch > 127) {
        return null;
    }
    var automaticTriad = stateHarmony.diatonicChordPitches(
        state.rootNote,
        state.scaleIntervals,
        state.baseOctave,
        row,
        degree
    );
    var triad = state.chordType === "auto" ?
        automaticTriad : stateHarmony.qualityChordPitches(rootPitch, state.chordType);
    var automaticSeventhPitch = stateHarmony.diatonicSeventhPitch(
        state.rootNote, state.scaleIntervals, state.baseOctave, row, degree
    );
    var seventhPitch = state.extensions.seventh ? stateHarmony.contextualSeventhPitch(
        rootPitch, state.chordType, automaticSeventhPitch
    ) : null;
    var chordPitches = stateHarmony.addExtensions(triad, rootPitch, state.extensions, seventhPitch);
    chordPitches = stateHarmony.applyVoicing(chordPitches, state.voicing);
    var nearest = {pitches: chordPitches, adjustment: 0, score: 0};
    if (state.voiceLeadingEnabled && state.voiceLeadingPitches.length > 0) {
        nearest = stateHarmony.nearestVoicing(chordPitches, state.voiceLeadingPitches);
    }
    chordPitches = nearest.pitches;
    if (state.voiceLeadingEnabled) {
        state.voiceLeadingPitches = chordPitches.slice();
    }
    return {
        rootPitch: rootPitch,
        requestedQuality: state.chordType,
        resolvedQuality: resolvedQuality(rootPitch, triad, state.chordType),
        automaticQuality: resolvedQuality(rootPitch, automaticTriad, "auto"),
        automaticChordPitches: automaticTriad.slice(),
        automaticSeventhPitch: automaticSeventhPitch,
        seventhPitch: seventhPitch,
        seventhInterval: seventhPitch === null ? null : seventhPitch - rootPitch,
        extensions: EXTENSIONS.filter(function (extension) {
            return state.extensions[extension];
        }),
        manualVoicing: state.voicing,
        voiceLeadingEnabled: state.voiceLeadingEnabled,
        nearestAdjustment: nearest.adjustment,
        nearestScore: nearest.score,
        bassEnabled: state.bassEnabled,
        bassOctave: state.bassOctave,
        chordPitches: chordPitches.slice(),
        pitches: stateHarmony.addBass(
            chordPitches,
            rootPitch,
            state.bassEnabled,
            state.bassOctave
        )
    };
}

function chordForPad(state, row, degree) {
    var snapshot = chordSnapshotForPad(state, row, degree);
    return snapshot === null ? [] : snapshot.pitches;
}

var musicalState = {
    chordSnapshotForPad: chordSnapshotForPad,
    chordForPad: chordForPad,
    createState: createState,
    retargetChordSnapshot: retargetChordSnapshot,
    resetMomentaryModifiers: resetMomentaryModifiers,
    resetVoiceLeadingHistory: resetVoiceLeadingHistory,
    setBassOctave: setBassOctave,
    setChordType: setChordType,
    setExtension: setExtension,
    setVoicing: setVoicing,
    shiftBassOctave: shiftBassOctave,
    shiftVoicing: shiftVoicing,
    toggleBass: toggleBass,
    toggleVoiceLeading: toggleVoiceLeading,
    updateBaseOctave: updateBaseOctave,
    updateScale: updateScale
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = musicalState;
}
