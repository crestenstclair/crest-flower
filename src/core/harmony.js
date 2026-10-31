"use strict";

/* Deterministic harmony functions shared by Node tests and Max's ES5 `js` runtime. */

var MIDI_MAX_PITCH = 127;
var LIVE_OCTAVE_OFFSET = 2;
var CHORD_INTERVALS = {
    diminished: [0, 3, 6],
    minor: [0, 3, 7],
    major: [0, 4, 7],
    suspended: [0, 5, 7],
    augmented: [0, 4, 8],
    power: [0, 7],
    quartal: [0, 5, 10],
    dominant: [0, 4, 7, 10]
};
var SEVENTH_INTERVALS = {
    major: 11, minor: 10, diminished: 9, suspended: 10,
    augmented: 11, power: 10, quartal: 10, dominant: 10
};
var EXTENSION_INTERVALS = {
    sixth: 9,
    ninth: 14
};
var EXTENSION_ORDER = ["sixth", "seventh", "ninth"];

function assertIntegerInRange(value, minimum, maximum, name) {
    if (typeof value !== "number" || value % 1 !== 0 || value < minimum || value > maximum) {
        throw new RangeError(name + " must be an integer from " + minimum + " to " + maximum);
    }
}

function validateScaleIntervals(intervals) {
    if (!Array.isArray(intervals) || intervals.length === 0) {
        throw new TypeError("scale intervals must be a non-empty array");
    }
    var previous = -1;
    var index;
    for (index = 0; index < intervals.length; index += 1) {
        assertIntegerInRange(intervals[index], 0, 11, "scale interval");
        if (intervals[index] <= previous) {
            throw new RangeError("scale intervals must be strictly increasing");
        }
        previous = intervals[index];
    }
    if (intervals[0] !== 0) {
        throw new RangeError("the first scale interval must be 0");
    }
    return intervals.slice();
}

function tonicPitch(rootNote, baseOctave) {
    assertIntegerInRange(rootNote, 0, 11, "root note");
    assertIntegerInRange(baseOctave, 0, 8, "base octave");
    return (baseOctave + LIVE_OCTAVE_OFFSET) * 12 + rootNote;
}

function unboundedScaleDegreePitch(rootNote, intervals, baseOctave, degreeIndex) {
    var normalized = validateScaleIntervals(intervals);
    assertIntegerInRange(degreeIndex, 0, 127, "degree index");
    var octave = Math.floor(degreeIndex / normalized.length);
    return tonicPitch(rootNote, baseOctave) +
        normalized[degreeIndex % normalized.length] + octave * 12;
}

function scaleDegreePitch(rootNote, intervals, baseOctave, degreeIndex) {
    var pitch = unboundedScaleDegreePitch(rootNote, intervals, baseOctave, degreeIndex);
    return pitch <= MIDI_MAX_PITCH ? pitch : null;
}

function degreeRoot(rootNote, intervals, baseOctave, degree) {
    assertIntegerInRange(degree, 1, 8, "degree");
    if (degree === 8) {
        var octaveTonic = tonicPitch(rootNote, baseOctave) + 12;
        return octaveTonic <= MIDI_MAX_PITCH ? octaveTonic : null;
    }
    return scaleDegreePitch(rootNote, intervals, baseOctave, degree - 1);
}

function normalizedPitches(pitches) {
    var seen = {};
    var result = [];
    pitches.forEach(function (pitch) {
        assertIntegerInRange(pitch, 0, MIDI_MAX_PITCH, "pitch");
        if (!seen[pitch]) {
            seen[pitch] = true;
            result.push(pitch);
        }
    });
    return result.sort(function (left, right) { return left - right; });
}

function pitchesForIntervals(rootPitch, intervals) {
    assertIntegerInRange(rootPitch, 0, MIDI_MAX_PITCH, "chord root");
    return intervals.map(function (interval) {
        return rootPitch + interval;
    }).filter(function (pitch) {
        return pitch <= MIDI_MAX_PITCH;
    });
}

function qualityChordPitches(rootPitch, chordType) {
    if (!Object.prototype.hasOwnProperty.call(CHORD_INTERVALS, chordType)) {
        throw new RangeError("unknown fixed chord type");
    }
    return pitchesForIntervals(rootPitch, CHORD_INTERVALS[chordType]);
}

function diatonicChordPitches(rootNote, intervals, baseOctave, row, degree) {
    var normalized = validateScaleIntervals(intervals);
    assertIntegerInRange(row, 1, 4, "chord row");
    assertIntegerInRange(degree, 1, 8, "degree");
    var anchorIndex = degree === 8 ? normalized.length : degree - 1;
    return [0, 2, 4].map(function (offset) {
        var pitch = scaleDegreePitch(rootNote, normalized, baseOctave, anchorIndex + offset);
        return pitch === null ? null : pitch + (row - 1) * 12;
    }).filter(function (pitch) {
        return pitch !== null && pitch <= MIDI_MAX_PITCH;
    });
}

/* Keep the unvoiced scale candidate even above MIDI range for later retargets. */
function diatonicSeventhPitch(rootNote, intervals, baseOctave, row, degree) {
    var normalized = validateScaleIntervals(intervals);
    assertIntegerInRange(row, 1, 4, "chord row");
    assertIntegerInRange(degree, 1, 8, "degree");
    var anchorIndex = degree === 8 ? normalized.length : degree - 1;
    return unboundedScaleDegreePitch(rootNote, normalized, baseOctave, anchorIndex + 6) +
        (row - 1) * 12;
}

function contextualSeventhPitch(rootPitch, chordType, automaticPitch) {
    if (chordType === "auto") {
        assertIntegerInRange(automaticPitch, rootPitch + 6, rootPitch + 72, "automatic seventh");
        return automaticPitch;
    }
    if (!Object.prototype.hasOwnProperty.call(SEVENTH_INTERVALS, chordType)) {
        throw new RangeError("unknown fixed chord type");
    }
    return rootPitch + SEVENTH_INTERVALS[chordType];
}

function addExtensions(pitches, rootPitch, extensions, seventhPitch) {
    var result = pitches.slice();
    EXTENSION_ORDER.forEach(function (extension) {
        var pitch;
        if (extensions[extension]) {
            pitch = extension === "seventh" ? seventhPitch :
                rootPitch + EXTENSION_INTERVALS[extension];
            if (extension === "seventh") {
                assertIntegerInRange(pitch, rootPitch + 6, rootPitch + 72, "seventh pitch");
            }
            if (pitch <= MIDI_MAX_PITCH) {
                result.push(pitch);
            }
        }
    });
    return normalizedPitches(result);
}

function applyVoicing(pitches, steps) {
    assertIntegerInRange(steps, -16, 16, "voicing");
    var result = normalizedPitches(pitches);
    var shifted;
    var remaining = Math.abs(steps);
    while (remaining > 0 && result.length > 0) {
        if (steps > 0) {
            shifted = result.shift() + 12;
            if (shifted > MIDI_MAX_PITCH) {
                result.unshift(shifted - 12);
                break;
            }
            result.push(shifted);
        } else {
            shifted = result.pop() - 12;
            if (shifted < 0) {
                result.push(shifted + 12);
                break;
            }
            result.push(shifted);
        }
        result = normalizedPitches(result);
        remaining -= 1;
    }
    return result;
}

function closestPitchDistance(pitch, pitches) {
    var closest = MIDI_MAX_PITCH + 1;
    pitches.forEach(function (candidate) {
        closest = Math.min(closest, Math.abs(pitch - candidate));
    });
    return closest;
}

function symmetricVoiceLeadingDistance(pitches, previousPitches) {
    var current = normalizedPitches(pitches);
    var previous = normalizedPitches(previousPitches);
    if (current.length === 0 || previous.length === 0) {
        return 0;
    }
    var score = 0;
    current.forEach(function (pitch) {
        score += closestPitchDistance(pitch, previous);
    });
    previous.forEach(function (pitch) {
        score += closestPitchDistance(pitch, current);
    });
    return score;
}

function nearestVoicing(pitches, previousPitches) {
    var baseline = normalizedPitches(pitches);
    var previous = normalizedPitches(previousPitches);
    if (baseline.length === 0 || previous.length === 0) {
        return {pitches: baseline, adjustment: 0, score: 0};
    }
    var best = null;
    var seen = {};
    var maximumAdjustment = baseline.length - 1;
    var adjustment;
    for (adjustment = -maximumAdjustment;
        adjustment <= maximumAdjustment;
        adjustment += 1) {
        var candidatePitches = applyVoicing(baseline, adjustment);
        if (candidatePitches.length !== baseline.length) {
            continue;
        }
        var key = candidatePitches.join(",");
        if (seen[key]) {
            continue;
        }
        seen[key] = true;
        var candidate = {
            pitches: candidatePitches,
            adjustment: adjustment === 0 ? 0 : adjustment,
            score: symmetricVoiceLeadingDistance(candidatePitches, previous)
        };
        if (
            best === null ||
            candidate.score < best.score ||
            (candidate.score === best.score &&
                Math.abs(candidate.adjustment) < Math.abs(best.adjustment))
        ) {
            best = candidate;
        }
    }
    return best;
}

function addBass(pitches, rootPitch, enabled, bassOctave) {
    assertIntegerInRange(bassOctave, -4, 1, "bass octave");
    var result = pitches.slice();
    var pitch = rootPitch + bassOctave * 12;
    if (enabled && pitch >= 0 && pitch <= MIDI_MAX_PITCH) {
        result.push(pitch);
    }
    return normalizedPitches(result);
}

function orchidChordPitches(
    rootNote,
    intervals,
    baseOctave,
    row,
    degree,
    chordType,
    extensions,
    voicing,
    bassEnabled,
    bassOctave
) {
    assertIntegerInRange(row, 1, 4, "chord row");
    var baseRoot = degreeRoot(rootNote, intervals, baseOctave, degree);
    var rootPitch = baseRoot === null ? null : baseRoot + (row - 1) * 12;
    if (rootPitch === null || rootPitch > MIDI_MAX_PITCH) {
        return [];
    }
    var pitches = chordType === "auto" ?
        diatonicChordPitches(rootNote, intervals, baseOctave, row, degree) :
        qualityChordPitches(rootPitch, chordType);
    var seventhPitch = contextualSeventhPitch(rootPitch, chordType,
        diatonicSeventhPitch(rootNote, intervals, baseOctave, row, degree));
    pitches = addExtensions(pitches, rootPitch, extensions, seventhPitch);
    pitches = applyVoicing(pitches, voicing);
    return addBass(pitches, rootPitch, bassEnabled, bassOctave);
}

var harmony = {
    CHORD_TYPES: Object.keys(CHORD_INTERVALS),
    EXTENSION_ORDER: EXTENSION_ORDER,
    addBass: addBass,
    addExtensions: addExtensions,
    applyVoicing: applyVoicing,
    contextualSeventhPitch: contextualSeventhPitch,
    degreeRoot: degreeRoot,
    diatonicChordPitches: diatonicChordPitches,
    diatonicSeventhPitch: diatonicSeventhPitch,
    normalizedPitches: normalizedPitches,
    nearestVoicing: nearestVoicing,
    orchidChordPitches: orchidChordPitches,
    qualityChordPitches: qualityChordPitches,
    scaleDegreePitch: scaleDegreePitch,
    symmetricVoiceLeadingDistance: symmetricVoiceLeadingDistance,
    tonicPitch: tonicPitch,
    validateScaleIntervals: validateScaleIntervals
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = harmony;
}
