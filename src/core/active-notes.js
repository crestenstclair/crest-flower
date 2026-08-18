"use strict";

/* Physical owners retain snapshots; MIDI pitches are shared through reference counts. */

var MIDI_MAX_VALUE = 127;
var ALL_NOTES_OFF_CONTROLLER = 123;
var FLUSH_LIFECYCLES = {
    panic: true,
    focus_lost: true,
    disabled: true,
    deleted: true,
    set_closed: true
};

function emptyMap() {
    return Object.create(null);
}

function createActiveNotes() {
    return {owners: emptyMap(), counts: emptyMap()};
}

function ownerKey(owner) {
    if (typeof owner !== "string" || owner.length === 0) {
        throw new TypeError("owner must be a non-empty string");
    }
    return "$" + owner;
}

function pitchKey(pitch) {
    return "$" + pitch;
}

function noteEvent(type, pitch, velocity) {
    return {type: type, pitch: pitch, velocity: velocity};
}

function normalizedPitches(pitches) {
    if (!Array.isArray(pitches)) {
        throw new TypeError("pitches must be an array");
    }
    var seen = emptyMap();
    var result = [];
    pitches.forEach(function (pitch) {
        if (typeof pitch !== "number" ||
            pitch % 1 !== 0 || pitch < 0 || pitch > MIDI_MAX_VALUE) {
            throw new RangeError("pitch must be an integer from 0 to 127");
        }
        var key = pitchKey(pitch);
        if (!seen[key]) {
            seen[key] = true;
            result.push(pitch);
        }
    });
    return result;
}

function releaseOwner(state, owner) {
    var key = ownerKey(owner);
    var snapshot = state.owners[key];
    if (!snapshot) {
        return [];
    }
    var events = [];
    snapshot.forEach(function (pitch) {
        var countKey = pitchKey(pitch);
        if (state.counts[countKey] === 1) {
            delete state.counts[countKey];
            events.push(noteEvent("note_off", pitch, 0));
        } else {
            state.counts[countKey] -= 1;
        }
    });
    delete state.owners[key];
    return events;
}

function pressOwner(state, owner, pitches, velocity) {
    if (typeof velocity !== "number" ||
        velocity % 1 !== 0 || velocity < 1 || velocity > MIDI_MAX_VALUE) {
        throw new RangeError("velocity must be an integer from 1 to 127");
    }
    var key = ownerKey(owner);
    var normalized = normalizedPitches(pitches);
    var events = releaseOwner(state, owner);
    state.owners[key] = normalized;
    normalized.forEach(function (pitch) {
        var countKey = pitchKey(pitch);
        var count = state.counts[countKey] || 0;
        state.counts[countKey] = count + 1;
        if (count === 0) {
            events.push(noteEvent("note_on", pitch, velocity));
        }
    });
    return events;
}

function referenceCount(state, pitch) {
    return state.counts[pitchKey(pitch)] || 0;
}

function panic(state) {
    var pitches = Object.keys(state.counts).map(function (key) {
        return parseInt(key.slice(1), 10);
    }).sort(function (left, right) {
        return left - right;
    });
    var events = pitches.map(function (pitch) {
        return noteEvent("note_off", pitch, 0);
    });
    events.push({type: "control_change", controller: ALL_NOTES_OFF_CONTROLLER, value: 0});
    state.owners = emptyMap();
    state.counts = emptyMap();
    return events;
}

function flushForLifecycle(state, lifecycle) {
    if (!FLUSH_LIFECYCLES[lifecycle]) {
        throw new RangeError("unknown lifecycle event: " + lifecycle);
    }
    return panic(state);
}

var activeNotes = {
    createActiveNotes: createActiveNotes,
    flushForLifecycle: flushForLifecycle,
    normalizedPitches: normalizedPitches,
    panic: panic,
    pressOwner: pressOwner,
    referenceCount: referenceCount,
    releaseOwner: releaseOwner
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = activeNotes;
}
