"use strict";

/* Three rows, with each higher row beginning three scale degrees above the last. */

var layoutHarmony = typeof module !== "undefined" && module.exports ?
    require("./harmony.js") : harmony;
var ROW_START_DEGREE_OFFSET = 3;

function noteForPad(rootNote, intervals, baseOctave, row, column) {
    if (typeof row !== "number" || row % 1 !== 0 || row < 1 || row > 3) {
        throw new RangeError("row must be an integer from 1 to 3");
    }
    if (typeof column !== "number" || column % 1 !== 0 || column < 1 || column > 8) {
        throw new RangeError("column must be an integer from 1 to 8");
    }
    return layoutHarmony.scaleDegreePitch(
        rootNote,
        intervals,
        baseOctave,
        (row - 1) * ROW_START_DEGREE_OFFSET + (column - 1)
    );
}

function threeRowLayout(rootNote, intervals, baseOctave) {
    var rows = [];
    var row;
    var column;
    for (row = 1; row <= 3; row += 1) {
        rows[row - 1] = [];
        for (column = 1; column <= 8; column += 1) {
            rows[row - 1].push(noteForPad(rootNote, intervals, baseOctave, row, column));
        }
    }
    return rows;
}

var noteLayout = {
    noteForPad: noteForPad,
    threeRowLayout: threeRowLayout
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = noteLayout;
}
