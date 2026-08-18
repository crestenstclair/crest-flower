"use strict";

/* Deterministic harmony functions shared by Node tests and Max's ES5 `js` runtime. */

var QUALITY_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    sus: [0, 5, 7]
};
var MIDI_MAX_PITCH = 127;
var LIVE_OCTAVE_OFFSET = 2;

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

function scaleDegreePitch(rootNote, intervals, baseOctave, degreeIndex) {
    var normalized = validateScaleIntervals(intervals);
    assertIntegerInRange(degreeIndex, 0, 127, "degree index");
    var octave = Math.floor(degreeIndex / normalized.length);
    var pitch = tonicPitch(rootNote, baseOctave) +
        normalized[degreeIndex % normalized.length] + octave * 12;
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

function chordPitches(rootPitch, quality, seventhEnabled, ninthEnabled) {
    if (rootPitch === null) {
        return [];
    }
    assertIntegerInRange(rootPitch, 0, MIDI_MAX_PITCH, "chord root");
    if (!Object.prototype.hasOwnProperty.call(QUALITY_INTERVALS, quality)) {
        throw new RangeError("unknown chord quality: " + quality);
    }
    var intervals = QUALITY_INTERVALS[quality].slice();
    if (seventhEnabled) {
        intervals.push(10);
    }
    if (ninthEnabled) {
        intervals.push(14);
    }
    return intervals.map(function (interval) {
        return rootPitch + interval;
    }).filter(function (pitch) {
        return pitch <= MIDI_MAX_PITCH;
    });
}

var harmony = {
    QUALITY_INTERVALS: QUALITY_INTERVALS,
    chordPitches: chordPitches,
    degreeRoot: degreeRoot,
    scaleDegreePitch: scaleDegreePitch,
    tonicPitch: tonicPitch,
    validateScaleIntervals: validateScaleIntervals
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = harmony;
}
