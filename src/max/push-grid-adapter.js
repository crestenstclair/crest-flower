/* Push Chord Grid matrix adapter, proven in WP2 and hardened in WP5.
 *
 * This file deliberately uses ES5 syntax because Max's `js` runtime is the
 * runtime target. The small pure-function export at the bottom lets Node test
 * the exact coordinate normalization code without pretending to be Live.
 */

if (typeof outlet !== "undefined") {
    autowatch = 0;
    inlets = 1;
    outlets = 5;
}

var FILES = "ABCDEFGH";
var GRID_SIZE = 8;
var DEVICE_ACTIVE_PROPERTY = "is_active";
var FIRST_PAD_NOTE = 36;
var LAST_CHORD_PAD_NOTE = 67;
var ARBITRATION_BUS = "push_chord_grid_arbitration";
var ARBITRATION_GLOBAL = "push_chord_grid_wp5";
var ARBITRATION_STALE_MS = 3000;

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

function coordinateForPadNote(note) {
    var parsed = parseInt(note, 10);
    if (isNaN(parsed) || parsed < FIRST_PAD_NOTE || parsed > LAST_CHORD_PAD_NOTE) {
        return null;
    }
    var offset = parsed - FIRST_PAD_NOTE;
    return FILES.charAt(offset % GRID_SIZE) + String(Math.floor(offset / GRID_SIZE) + 1);
}

function createPadVelocityCache() {
    return Object.create(null);
}

function cachePadVelocity(cache, note, velocity) {
    var coordinate = coordinateForPadNote(note);
    var parsedVelocity = parseInt(velocity, 10);
    if (
        coordinate === null ||
        isNaN(parsedVelocity) ||
        parsedVelocity < 0 ||
        parsedVelocity > 127
    ) {
        return null;
    }
    cache[coordinate] = parsedVelocity;
    return {coordinate: coordinate, velocity: parsedVelocity};
}

function applyCachedPadVelocity(cache, event) {
    if (!event || !Object.prototype.hasOwnProperty.call(cache, event.coordinate)) {
        return event;
    }
    var velocity = cache[event.coordinate];
    delete cache[event.coordinate];
    if ((velocity > 0) !== event.pressed) {
        return event;
    }
    event.velocity = velocity;
    event.pressed = velocity > 0;
    return event;
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

function liveDeviceOrder(deviceId, trackDeviceIds) {
    var index = trackDeviceIds.indexOf(deviceId);
    return index >= 0 ? index : 1000000;
}

function freshArbitrationMembers(members, now, staleMs) {
    var fresh = {};
    var maximumAge = staleMs === undefined ? ARBITRATION_STALE_MS : staleMs;
    Object.keys(members || {}).forEach(function (key) {
        var member = members[key];
        if (
            member &&
            now - member.lastSeen <= maximumAge &&
            now >= member.lastSeen
        ) {
            fresh[key] = member;
        }
    });
    return fresh;
}

function arbitrationWinner(members, selectedTrackId, now, staleMs) {
    var candidates = [];
    var fresh = freshArbitrationMembers(members, now, staleMs);
    Object.keys(fresh).forEach(function (key) {
        var member = fresh[key];
        if (
            member.enabled &&
            member.available &&
            member.trackId > 0 &&
            member.trackId === selectedTrackId
        ) {
            candidates.push(member);
        }
    });
    candidates.sort(function (left, right) {
        if (left.order !== right.order) {
            return left.order - right.order;
        }
        return left.deviceId - right.deviceId;
    });
    return candidates.length ? candidates[0].deviceId : 0;
}

function membersFromArbitrationRegistry(flat) {
    var members = {};
    var index;
    if (!flat || flat.length === undefined) {
        return members;
    }
    for (index = 0; index + 5 < flat.length; index += 6) {
        var member = {
            deviceId: numericId(flat[index]),
            trackId: numericId(flat[index + 1]),
            order: integerFrom(flat[index + 2], 1000000),
            enabled: integerFrom(flat[index + 3], 0) !== 0,
            available: integerFrom(flat[index + 4], 0) !== 0,
            lastSeen: parseInt(flat[index + 5], 10)
        };
        if (member.deviceId > 0 && !isNaN(member.lastSeen)) {
            members[String(member.deviceId)] = member;
        }
    }
    return members;
}

function arbitrationRegistryValues(members) {
    var flat = [];
    Object.keys(members || {}).sort(function (left, right) {
        return numericId(left) - numericId(right);
    }).forEach(function (key) {
        var member = members[key];
        flat.push(
            member.deviceId,
            member.trackId,
            member.order,
            member.enabled ? 1 : 0,
            member.available ? 1 : 0,
            member.lastSeen
        );
    });
    return flat;
}

function shouldOwnMatrix(
    deviceEnabled,
    ownTrackId,
    selectedTrackId,
    pushAvailable,
    instanceEligible
) {
    var eligible = instanceEligible === undefined ? true : Boolean(instanceEligible);
    return Boolean(
        deviceEnabled &&
        pushAvailable &&
        eligible &&
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
var deviceId = 0;
var ownTrackId = 0;
var selectedTrackId = 0;
var pushId = 0;
var matrixId = 0;
var deviceApi = null;
var ownTrackApi = null;
var selectedTrackApi = null;
var watchdogTask = null;
var rendererTask = null;
var arbitrationBroadcastTask = null;
var gridState = createGridState();
var padVelocityCache = createPadVelocityCache();
var arbitrationState =
    runtimeAvailable && typeof Global !== "undefined" ? new Global(ARBITRATION_GLOBAL) : null;

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

function arbitrationNow() {
    return new Date().getTime();
}

function arbitrationMembers() {
    if (!arbitrationState) {
        return {};
    }
    if (isNaN(parseInt(arbitrationState.leaseDeviceId, 10))) {
        arbitrationState.leaseDeviceId = 0;
    }
    return membersFromArbitrationRegistry(arbitrationState.registry);
}

function writeArbitrationMembers(members) {
    if (!arbitrationState) {
        return;
    }
    arbitrationState.registry = arbitrationRegistryValues(members);
}

function pruneArbitrationState(now) {
    if (!arbitrationState) {
        return false;
    }
    var members = arbitrationMembers();
    var fresh = freshArbitrationMembers(members, now, ARBITRATION_STALE_MS);
    var changed = Object.keys(fresh).length !== Object.keys(members).length;
    writeArbitrationMembers(fresh);
    var lease = numericId(arbitrationState.leaseDeviceId);
    if (lease !== 0 && !fresh[String(lease)]) {
        arbitrationState.leaseDeviceId = 0;
        changed = true;
    }
    return changed;
}

function trackDeviceIds() {
    if (!ownTrackApi) {
        return [];
    }
    try {
        return idsFrom(ownTrackApi.get("devices"));
    } catch (error) {
        return [];
    }
}

function updateArbitrationRegistration(now) {
    if (!arbitrationState || deviceId <= 0 || ownTrackId <= 0) {
        return false;
    }
    var members = arbitrationMembers();
    var key = String(deviceId);
    var previous = members[key];
    var next = {
        deviceId: deviceId,
        trackId: ownTrackId,
        order: liveDeviceOrder(deviceId, trackDeviceIds()),
        enabled: deviceEnabledFlag,
        available: pushId !== 0 && matrixId !== 0,
        lastSeen: now
    };
    var changed = !previous ||
        previous.trackId !== next.trackId ||
        previous.order !== next.order ||
        previous.enabled !== next.enabled ||
        previous.available !== next.available;
    members[key] = next;
    writeArbitrationMembers(members);
    return changed;
}

function removeArbitrationRegistration() {
    if (!arbitrationState || deviceId <= 0) {
        return false;
    }
    var members = arbitrationMembers();
    var key = String(deviceId);
    var changed = Boolean(members[key]);
    if (members[key]) {
        delete members[key];
        writeArbitrationMembers(members);
    }
    if (numericId(arbitrationState.leaseDeviceId) === deviceId) {
        arbitrationState.leaseDeviceId = 0;
        changed = true;
    }
    return changed;
}

function arbitrationLeaseOwner() {
    return arbitrationState ? numericId(arbitrationState.leaseDeviceId) : deviceId;
}

function claimArbitrationLease(winnerId) {
    if (!arbitrationState) {
        return winnerId === deviceId;
    }
    var lease = arbitrationLeaseOwner();
    if (winnerId !== deviceId || (lease !== 0 && lease !== deviceId)) {
        return false;
    }
    arbitrationState.leaseDeviceId = deviceId;
    return true;
}

function releaseArbitrationLease() {
    if (!arbitrationState || arbitrationLeaseOwner() !== deviceId) {
        return false;
    }
    arbitrationState.leaseDeviceId = 0;
    return true;
}

function broadcastArbitration() {
    if (
        !runtimeAvailable ||
        typeof messnamed === "undefined" ||
        arbitrationBroadcastTask
    ) {
        return;
    }
    arbitrationBroadcastTask = new Task(function () {
        arbitrationBroadcastTask = null;
        if (!shuttingDown) {
            messnamed(ARBITRATION_BUS, "arbitrate");
        }
    }, this);
    arbitrationBroadcastTask.schedule(1);
}

function emitPad(event) {
    if (runtimeAvailable) {
        outlet(0, "Pad:", event.coordinate, event.velocity);
        outlet(3, "grid_event", event.coordinate, event.velocity);
    }
}

function emitLifecycle(name) {
    if (runtimeAvailable) {
        outlet(4, "lifecycle", name);
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

function cancelRendererTask() {
    if (rendererTask) {
        try {
            rendererTask.cancel();
        } catch (ignored) {
            // The task may already have completed during teardown.
        }
    }
    rendererTask = null;
}

function scheduleRenderer() {
    if (!runtimeAvailable) {
        return;
    }
    cancelRendererTask();
    rendererTask = new Task(function () {
        rendererTask = null;
        if (acquired && !shuttingDown) {
            outlet(3, "grid_ownership", 1);
        }
    }, this);
    rendererTask.schedule(50);
}

function resetOwnedInputState() {
    gridState = createGridState();
    padVelocityCache = createPadVelocityCache();
}

function releaseCurrentOwnership(lifecycle) {
    if (acquired) {
        emitLifecycle(lifecycle);
        cancelRendererTask();
        outlet(3, "grid_ownership", 0);
    }
    setNativeOwnership(0);
    acquired = false;
    resetOwnedInputState();
    return releaseArbitrationLease();
}

function reconcileOwnership() {
    if (!initializedFlag || shuttingDown) {
        return false;
    }
    var now = arbitrationNow();
    var changed = pruneArbitrationState(now);
    changed = updateArbitrationRegistration(now) || changed;
    var winnerId = arbitrationState ?
        arbitrationWinner(arbitrationMembers(), selectedTrackId, now, ARBITRATION_STALE_MS) :
        deviceId;
    var instanceEligible = !arbitrationState || winnerId === deviceId;
    var desired = shouldOwnMatrix(
        deviceEnabledFlag,
        ownTrackId,
        selectedTrackId,
        pushId !== 0 && matrixId !== 0,
        instanceEligible
    );
    if (!desired) {
        var released = releaseCurrentOwnership(
            deviceEnabledFlag ? "focus_lost" : "disabled"
        );
        if (!deviceEnabledFlag) {
            emitStatus("device disabled");
        } else if (ownTrackId !== selectedTrackId) {
            emitStatus("inactive track");
        } else if (pushId === 0) {
            emitStatus("no Push");
        } else if (matrixId === 0) {
            emitStatus("no matrix");
        } else if (winnerId !== 0 && winnerId !== deviceId) {
            emitStatus("duplicate standby");
        } else {
            emitStatus("ownership standby");
        }
        if (released) {
            broadcastArbitration();
        }
        return changed || released;
    }
    if (!claimArbitrationLease(winnerId)) {
        if (acquired) {
            releaseCurrentOwnership("focus_lost");
        }
        emitStatus("waiting for matrix owner");
        return changed;
    }
    if (!acquired) {
        setNativeOwnership(1);
        acquired = true;
        emitStatus("matrix acquired");
        scheduleRenderer();
    }
    return changed;
}

function push_surface() {
    var values = Array.prototype.slice.call(arguments);
    pushId = controlIdFrom(values);
    reconcileOwnership();
    broadcastArbitration();
}

function matrix_id() {
    var values = Array.prototype.slice.call(arguments);
    matrixId = controlIdFrom(values);
    reconcileOwnership();
    broadcastArbitration();
}

function matrix_event() {
    if (!acquired) {
        return;
    }
    var event = normalizeMatrixEvent(Array.prototype.slice.call(arguments));
    if (event !== null) {
        event = applyCachedPadVelocity(padVelocityCache, event);
        gridState[event.x][event.y] = event.velocity;
        emitPad(event);
    }
}

function pad_velocity(note, velocity) {
    if (!acquired) {
        return;
    }
    cachePadVelocity(padVelocityCache, note, velocity);
}

function refreshSelectedTrack(args) {
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
}

function selectedTrackChanged(args) {
    refreshSelectedTrack(args);
    reconcileOwnership();
    broadcastArbitration();
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
    broadcastArbitration();
}

function arbitrate() {
    if (!initializedFlag || shuttingDown) {
        return;
    }
    reconcileOwnership();
}

function watchdog() {
    watchdogTask = null;
    if (shuttingDown || !initializedFlag) {
        return;
    }
    refreshSelectedTrack(null);
    reconcileOwnership();
    broadcastArbitration();
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
        deviceId = controlIdFrom(deviceApi.id);
        deviceEnabledFlag = integerFrom(deviceApi.get(DEVICE_ACTIVE_PROPERTY), 0) !== 0;
        deviceApi.property = DEVICE_ACTIVE_PROPERTY;
        ownTrackApi = new LiveAPI(null, "this_device canonical_parent");
        ownTrackId = controlIdFrom(ownTrackApi.id);
        selectedTrackApi = new LiveAPI(selectedTrackChanged, "live_set view");
        selectedTrackApi.property = "selected_track";
        refreshSelectedTrack(null);
        reconcileOwnership();
        broadcastArbitration();
        watchdog();
    } catch (error) {
        initializedFlag = false;
        emitStatus("initialization retry");
    }
}

function enabled(value) {
    deviceActiveChanged(value);
}

function reload() {
    if (!runtimeAvailable || shuttingDown) {
        return;
    }
    emitStatus("reloading grid");
    releaseCurrentOwnership("reload");
    pushId = 0;
    matrixId = 0;
    updateArbitrationRegistration(arbitrationNow());
    broadcastArbitration();
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
    if (arbitrationBroadcastTask) {
        try {
            arbitrationBroadcastTask.cancel();
        } catch (broadcastError) {
            // The deferred broadcast may already be completing during teardown.
        }
    }
    arbitrationBroadcastTask = null;
    cancelRendererTask();
    releaseCurrentOwnership("deleted");
    removeArbitrationRegistration();
    broadcastArbitration();
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
    ownTrackApi = null;
    deviceApi = null;
}

function notifydeleted() {
    shutdown();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ARBITRATION_BUS: ARBITRATION_BUS,
        ARBITRATION_STALE_MS: ARBITRATION_STALE_MS,
        DEVICE_ACTIVE_PROPERTY: DEVICE_ACTIVE_PROPERTY,
        FIRST_PAD_NOTE: FIRST_PAD_NOTE,
        GRID_SIZE: GRID_SIZE,
        LAST_CHORD_PAD_NOTE: LAST_CHORD_PAD_NOTE,
        applyCachedPadVelocity: applyCachedPadVelocity,
        applyMatrixEvent: applyMatrixEvent,
        arbitrationRegistryValues: arbitrationRegistryValues,
        arbitrationWinner: arbitrationWinner,
        cachePadVelocity: cachePadVelocity,
        controlIdFrom: controlIdFrom,
        coordinateFor: coordinateFor,
        coordinateForPadNote: coordinateForPadNote,
        createGridState: createGridState,
        createPadVelocityCache: createPadVelocityCache,
        freshArbitrationMembers: freshArbitrationMembers,
        liveDeviceOrder: liveDeviceOrder,
        membersFromArbitrationRegistry: membersFromArbitrationRegistry,
        normalizeMatrixEvent: normalizeMatrixEvent,
        shouldOwnMatrix: shouldOwnMatrix
    };
}
