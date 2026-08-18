/* Observe Live Set scale state and forward normalized snapshots to the WP4 runtime. */

if (typeof outlet !== "undefined") {
    autowatch = 0;
    inlets = 1;
    outlets = 1;
}

var DEFAULT_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
var runtimeAvailable = typeof LiveAPI !== "undefined" && typeof outlet !== "undefined";
var rootNote = 0;
var scaleIntervals = DEFAULT_INTERVALS.slice();
var scaleName = "Major";
var scaleMode = 1;
var observers = [];

function valuesWithoutProperty(args, property) {
    var values = Array.prototype.slice.call(args || []);
    if (values.length && String(values[0]) === property) {
        values.shift();
    }
    return values;
}

function lastInteger(args, fallback) {
    var values = Array.prototype.slice.call(args || []);
    var index;
    for (index = values.length - 1; index >= 0; index -= 1) {
        var parsed = parseInt(values[index], 10);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }
    return fallback;
}

function normalizedIntervals(args) {
    var values = valuesWithoutProperty(args, "scale_intervals");
    var result = values.map(function (value) { return parseInt(value, 10); });
    var index;
    if (!result.length || result[0] !== 0) {
        return null;
    }
    for (index = 0; index < result.length; index += 1) {
        if (isNaN(result[index]) || result[index] < 0 || result[index] > 11 ||
                (index > 0 && result[index] <= result[index - 1])) {
            return null;
        }
    }
    return result;
}

function emitScale() {
    if (runtimeAvailable) {
        outlet(0, ["scale", rootNote].concat(scaleIntervals));
    }
}

function rootChanged() {
    rootNote = lastInteger(valuesWithoutProperty(arguments, "root_note"), rootNote);
    emitScale();
}

function intervalsChanged() {
    var normalized = normalizedIntervals(arguments);
    if (normalized !== null) {
        scaleIntervals = normalized;
        emitScale();
    }
}

function nameChanged() {
    var values = valuesWithoutProperty(arguments, "scale_name");
    if (values.length) {
        scaleName = values.join(" ");
        if (runtimeAvailable) {
            outlet(0, ["scale_name", scaleName]);
        }
    }
}

function modeChanged() {
    scaleMode = lastInteger(valuesWithoutProperty(arguments, "scale_mode"), scaleMode) !== 0 ? 1 : 0;
    if (runtimeAvailable) {
        outlet(0, "scale_mode", scaleMode);
    }
}

function callbackValues(value) {
    if (value && typeof value !== "string" && value.length !== undefined) {
        return Array.prototype.slice.call(value);
    }
    return [value];
}

function observe(property, callback) {
    var api = new LiveAPI(callback, "live_set");
    var initial = api.get(property);
    callback.apply(null, callbackValues(initial));
    api.property = property;
    observers.push(api);
}

function initialized() {
    if (!runtimeAvailable || observers.length) {
        return;
    }
    observe("root_note", rootChanged);
    observe("scale_intervals", intervalsChanged);
    observe("scale_name", nameChanged);
    observe("scale_mode", modeChanged);
}

function notifydeleted() {
    observers.forEach(function (api) {
        try {
            api.property = "";
        } catch (ignored) {
            // Live may already have invalidated observers during Set teardown.
        }
    });
    observers = [];
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DEFAULT_INTERVALS: DEFAULT_INTERVALS,
        callbackValues: callbackValues,
        lastInteger: lastInteger,
        normalizedIntervals: normalizedIntervals,
        valuesWithoutProperty: valuesWithoutProperty
    };
}
