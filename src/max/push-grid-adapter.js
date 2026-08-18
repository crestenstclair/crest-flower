/* Push Chord Grid WP2 matrix adapter.
 *
 * This file deliberately uses ES5 syntax because Max's `js` runtime is the
 * runtime target. The small pure-function export at the bottom lets Node test
 * the exact coordinate normalization code without pretending to be Live.
 */

if (typeof outlet !== "undefined") {
    autowatch = 0;
    inlets = 1;
    outlets = 3;
}

var FILES = "ABCDEFGH";
var GRID_SIZE = 8;
var DEVICE_ACTIVE_PROPERTY = "is_active";

function coordinateFor(x, y) {
    var column = parseInt(x, 10);
    var physicalRow = parseInt(y, 10);
    if (
        isNaN(column) ||
        isNaN(physicalRow) ||
        column < 0 ||
        column >= GRID_SIZE ||
        physicalRow < 0 ||
        physicalRow >= GRID_SIZE
    ) {
        return null;
    }
    return FILES.charAt(column) + String(GRID_SIZE - physicalRow);
}

function normalizeMatrixEvent(args) {
    var values = args && args.length !== undefined ? args : [args];
    if (!values) {
        return null;
    }
    var offset = String(values[0]) === "value" ? 1 : 0;
    if (values.length < offset + 3) {
        return null;
    }
    var velocity = parseInt(values[offset], 10);
    var x = parseInt(values[offset + 1], 10);
    var y = parseInt(values[offset + 2], 10);
    var coordinate = coordinateFor(x, y);
    if (coordinate === null || isNaN(velocity) || velocity < 0 || velocity > 127) {
        return null;
    }
    return {
        coordinate: coordinate,
        velocity: velocity,
        x: x,
        y: y,
        pressed: velocity > 0
    };
}

function createGridState() {
    var state = [];
    var x;
    var y;
    for (x = 0; x < GRID_SIZE; x += 1) {
        state[x] = [];
        for (y = 0; y < GRID_SIZE; y += 1) {
            state[x][y] = 0;
        }
    }
    return state;
}

function applyMatrixEvent(state, args) {
    var event = normalizeMatrixEvent(args);
    if (event === null) {
        return null;
    }
    state[event.x][event.y] = event.velocity;
    return event;
}

function shouldOwnMatrix(deviceEnabled, ownTrackId, selectedTrackId, pushAvailable) {
    return Boolean(
        deviceEnabled &&
        pushAvailable &&
        ownTrackId > 0 &&
        ownTrackId === selectedTrackId
    );
}

var runtimeAvailable =
    typeof LiveAPI !== "undefined" &&
    typeof Task !== "undefined" &&
    typeof outlet !== "undefined";
var initializedFlag = false;
var deviceEnabledFlag = false;
var shuttingDown = false;
var acquired = false;
var ownershipRequested = false;
var ownTrackId = 0;
var selectedTrackId = 0;
var pushId = 0;
var matrixId = 0;
var deviceApi = null;
var selectedTrackApi = null;
var watchdogTask = null;
var gridState = createGridState();

function numericId(value) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function idsFrom(value) {
    var values = value && value.length !== undefined ? value : [value];
    var ids = [];
    var index;
    for (index = 0; index < values.length; index += 1) {
        if (String(values[index]) === "id" && index + 1 < values.length) {
            ids.push(numericId(values[index + 1]));
            index += 1;
        }
    }
    return ids;
}

function controlIdFrom(value) {
    var ids = idsFrom(value);
    if (ids.length) {
        return ids[ids.length - 1];
    }
    var direct = numericId(value);
    if (direct !== 0) {
        return direct;
    }
    var match = String(value).match(/(?:^|\s)id\s+(-?\d+)/);
    return match ? numericId(match[1]) : direct;
}

function integerFrom(value, fallback) {
    var values = value && value.length !== undefined ? value : [value];
    var index;
    for (index = values.length - 1; index >= 0; index -= 1) {
        var parsed = parseInt(values[index], 10);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }
    return fallback;
}

function emitPad(event) {
    if (runtimeAvailable) {
        outlet(0, "Pad:", event.coordinate, event.velocity);
    }
}

function emitStatus(message) {
    if (runtimeAvailable) {
        outlet(1, "Status:", message);
    }
}

function setNativeOwnership(value) {
    var desired = value !== 0;
    if (ownershipRequested === desired || !runtimeAvailable) {
        return;
    }
    ownershipRequested = desired;
    outlet(2, desired ? 1 : 0);
}

function reconcileOwnership() {
    if (!initializedFlag || shuttingDown) {
        return;
    }
    var desired = shouldOwnMatrix(
        deviceEnabledFlag,
        ownTrackId,
        selectedTrackId,
        pushId !== 0 && matrixId !== 0
    );
    if (!desired) {
        setNativeOwnership(0);
        acquired = false;
        gridState = createGridState();
        if (!deviceEnabledFlag) {
            emitStatus("device disabled");
        } else if (ownTrackId !== selectedTrackId) {
            emitStatus("inactive track");
        } else if (pushId === 0) {
            emitStatus("no Push");
        } else {
            emitStatus("no matrix");
        }
        return;
    }
    if (!acquired) {
        setNativeOwnership(1);
        acquired = true;
        emitStatus("matrix acquired");
    }
}

function push_surface() {
    var values = Array.prototype.slice.call(arguments);
    pushId = controlIdFrom(values);
    reconcileOwnership();
}

function matrix_id() {
    var values = Array.prototype.slice.call(arguments);
    matrixId = controlIdFrom(values);
    if (matrixId === 0) {
        setNativeOwnership(0);
        acquired = false;
    }
    reconcileOwnership();
}

function matrix_event() {
    if (!acquired) {
        return;
    }
    var event = applyMatrixEvent(gridState, Array.prototype.slice.call(arguments));
    if (event !== null) {
        emitPad(event);
    }
}

function selectedTrackChanged(args) {
    var ids = idsFrom(args);
    if (ids.length) {
        selectedTrackId = ids[ids.length - 1];
    } else if (selectedTrackApi) {
        try {
            var currentIds = idsFrom(selectedTrackApi.get("selected_track"));
            selectedTrackId = currentIds.length ? currentIds[currentIds.length - 1] : 0;
        } catch (error) {
            selectedTrackId = 0;
        }
    }
    reconcileOwnership();
}

function deviceActiveChanged(args) {
    var active = integerFrom(args, deviceEnabledFlag ? 1 : 0);
    if (deviceApi && controlIdFrom(deviceApi.id) > 0) {
        try {
            active = integerFrom(deviceApi.get(DEVICE_ACTIVE_PROPERTY), active);
        } catch (error) {
            // Fall back to the callback/live.thisdevice value during teardown.
        }
    }
    deviceEnabledFlag = active !== 0;
    reconcileOwnership();
}

function watchdog() {
    watchdogTask = null;
    if (shuttingDown || !initializedFlag) {
        return;
    }
    selectedTrackChanged(null);
    watchdogTask = new Task(watchdog, this);
    watchdogTask.schedule(1000);
}

function initialized() {
    if (!runtimeAvailable || initializedFlag || shuttingDown) {
        return;
    }
    initializedFlag = true;
    emitStatus("initializing");
    try {
        deviceApi = new LiveAPI(deviceActiveChanged, "this_device");
        deviceEnabledFlag = integerFrom(deviceApi.get(DEVICE_ACTIVE_PROPERTY), 0) !== 0;
        deviceApi.property = DEVICE_ACTIVE_PROPERTY;
        var ownTrackApi = new LiveAPI(null, "this_device canonical_parent");
        ownTrackId = controlIdFrom(ownTrackApi.id);
        selectedTrackApi = new LiveAPI(selectedTrackChanged, "live_set view");
        selectedTrackApi.property = "selected_track";
        selectedTrackChanged(null);
        watchdog();
    } catch (error) {
        initializedFlag = false;
        emitStatus("initialization retry");
    }
}

function enabled(value) {
    deviceActiveChanged(value);
}

function shutdown() {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    if (watchdogTask) {
        try {
            watchdogTask.cancel();
        } catch (ignored) {
            // The task may already be invalid during Set teardown.
        }
    }
    watchdogTask = null;
    if (runtimeAvailable && ownershipRequested) {
        outlet(2, 0);
    }
    ownershipRequested = false;
    acquired = false;
    if (deviceApi) {
        try {
            deviceApi.property = "";
        } catch (deviceError) {
            // Ignore teardown races.
        }
    }
    if (selectedTrackApi) {
        try {
            selectedTrackApi.property = "";
        } catch (error2) {
            // Ignore teardown races.
        }
    }
    selectedTrackApi = null;
    deviceApi = null;
}

function notifydeleted() {
    shutdown();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DEVICE_ACTIVE_PROPERTY: DEVICE_ACTIVE_PROPERTY,
        GRID_SIZE: GRID_SIZE,
        applyMatrixEvent: applyMatrixEvent,
        controlIdFrom: controlIdFrom,
        coordinateFor: coordinateFor,
        createGridState: createGridState,
        normalizeMatrixEvent: normalizeMatrixEvent,
        shouldOwnMatrix: shouldOwnMatrix
    };
}
