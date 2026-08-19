"use strict";

/* Physical owners retain snapshots; MIDI pitches are shared through reference counts. */

var MIDI_MAX_VALUE = 127;
var ALL_NOTES_OFF_CONTROLLER = 123;
var FLUSH_LIFECYCLES = {
    panic: true,
    focus_lost: true,
    disabled: true,
    reload: true,
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

function checkedStrikeVelocity(velocity) {
    if (typeof velocity !== "number" ||
        velocity % 1 !== 0 || velocity < 1 || velocity > MIDI_MAX_VALUE) {
        throw new RangeError("velocity must be an integer from 1 to 127");
    }
    return velocity;
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
    checkedStrikeVelocity(velocity);
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

function copiedOwners(owners) {
    var result = emptyMap();
    Object.keys(owners).forEach(function (key) {
        result[key] = owners[key].slice();
    });
    return result;
}

function countsForOwners(owners) {
    var counts = emptyMap();
    Object.keys(owners).forEach(function (key) {
        owners[key].forEach(function (pitch) {
            var countKey = pitchKey(pitch);
            counts[countKey] = (counts[countKey] || 0) + 1;
        });
    });
    return counts;
}

function sortedCountPitches(oldCounts, newCounts) {
    var seen = emptyMap();
    Object.keys(oldCounts).concat(Object.keys(newCounts)).forEach(function (key) {
        seen[key] = true;
    });
    return Object.keys(seen).map(function (key) {
        return parseInt(key.slice(1), 10);
    }).sort(function (left, right) {
        return left - right;
    });
}

function retargetOwners(state, replacements) {
    if (!Array.isArray(replacements)) {
        throw new TypeError("replacements must be an array");
    }
    if (replacements.length === 0) {
        return [];
    }
    var prospectiveOwners = copiedOwners(state.owners);
    var replacementKeys = emptyMap();
    var normalized = replacements.map(function (replacement) {
        if (!replacement || typeof replacement !== "object") {
            throw new TypeError("replacement must be an object");
        }
        var key = ownerKey(replacement.owner);
        if (replacementKeys[key]) {
            throw new RangeError("replacement owners must be unique");
        }
        if (!state.owners[key]) {
            throw new RangeError("replacement owner must already be active");
        }
        replacementKeys[key] = true;
        return {
            key: key,
            pitches: normalizedPitches(replacement.pitches),
            velocity: checkedStrikeVelocity(replacement.velocity)
        };
    });
    normalized.forEach(function (replacement) {
        prospectiveOwners[replacement.key] = replacement.pitches;
    });
    var prospectiveCounts = countsForOwners(prospectiveOwners);
    var pitches = sortedCountPitches(state.counts, prospectiveCounts);
    var events = [];
    pitches.forEach(function (pitch) {
        if ((state.counts[pitchKey(pitch)] || 0) > 0 &&
            (prospectiveCounts[pitchKey(pitch)] || 0) === 0) {
            events.push(noteEvent("note_off", pitch, 0));
        }
    });
    pitches.forEach(function (pitch) {
        var oldCount = state.counts[pitchKey(pitch)] || 0;
        var newCount = prospectiveCounts[pitchKey(pitch)] || 0;
        var index;
        if (oldCount !== 0 || newCount === 0) {
            return;
        }
        for (index = normalized.length - 1; index >= 0; index -= 1) {
            if (normalized[index].pitches.indexOf(pitch) !== -1) {
                events.push(noteEvent("note_on", pitch, normalized[index].velocity));
                break;
            }
        }
    });
    state.owners = prospectiveOwners;
    state.counts = prospectiveCounts;
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
    releaseOwner: releaseOwner,
    retargetOwners: retargetOwners
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = activeNotes;
}
