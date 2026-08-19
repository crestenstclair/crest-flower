"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const adapter = require("../../src/max/push-grid-adapter.js");

test("observes Live's device activation property", () => {
    assert.equal(adapter.DEVICE_ACTIVE_PROPERTY, "is_active");
});

test("recognizes a control surface by its returned matrix control id", () => {
    assert.equal(adapter.controlIdFrom(["id", 314]), 314);
    assert.equal(adapter.controlIdFrom(["id", 11, "id", 12]), 12);
    assert.equal(adapter.controlIdFrom(27), 27);
    assert.equal(adapter.controlIdFrom("id 42"), 42);
    assert.equal(adapter.controlIdFrom("id -12"), -12);
    assert.equal(adapter.controlIdFrom(["id", 0]), 0);
    assert.equal(adapter.controlIdFrom(["id", -12]), -12);
});

test("all 64 physical matrix events map to A1-H8", () => {
    const observed = new Set();

    for (let x = 0; x < 8; x += 1) {
        for (let y = 0; y < 8; y += 1) {
            const event = adapter.normalizeMatrixEvent([96, x, y]);
            const expected = `${"ABCDEFGH"[x]}${8 - y}`;

            assert.equal(event.coordinate, expected);
            assert.equal(event.velocity, 96);
            assert.equal(event.x, x);
            assert.equal(event.y, y);
            assert.equal(event.pressed, true);
            observed.add(event.coordinate);
        }
    }

    assert.equal(observed.size, 64);
    assert.deepEqual(
        [
            adapter.coordinateFor(0, 7),
            adapter.coordinateFor(7, 7),
            adapter.coordinateFor(0, 0),
            adapter.coordinateFor(7, 0)
        ],
        ["A1", "H1", "A8", "H8"]
    );
});

test("press and release events update the normalized grid state", () => {
    const state = adapter.createGridState();
    const press = adapter.applyMatrixEvent(state, [127, 3, 4]);
    const release = adapter.applyMatrixEvent(state, [0, 3, 4]);

    assert.equal(press.coordinate, "D4");
    assert.equal(press.pressed, true);
    assert.equal(release.coordinate, "D4");
    assert.equal(release.pressed, false);
    assert.equal(state[3][4], 0);
});

test("malformed and out-of-range matrix events are ignored", () => {
    assert.equal(adapter.normalizeMatrixEvent(["other", 100, 0, 0]), null);
    assert.equal(adapter.normalizeMatrixEvent([100, -1, 0]), null);
    assert.equal(adapter.normalizeMatrixEvent([100, 0, 8]), null);
    assert.equal(adapter.normalizeMatrixEvent([128, 0, 0]), null);
});

test("selector-prefixed matrix callbacks remain accepted", () => {
    assert.deepEqual(
        adapter.normalizeMatrixEvent(["value", 64, 7, 0]),
        {coordinate: "H8", velocity: 64, x: 7, y: 0, pressed: true}
    );
});

test("physical chord-pad MIDI notes map to the same 32 matrix coordinates", () => {
    const observed = [];
    for (let note = 36; note <= 67; note += 1) {
        observed.push(adapter.coordinateForPadNote(note));
    }
    assert.deepEqual(observed, [
        "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1",
        "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2",
        "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3",
        "A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4"
    ]);
    assert.equal(adapter.coordinateForPadNote(35), null);
    assert.equal(adapter.coordinateForPadNote(68), null);
    assert.equal(adapter.coordinateForPadNote("bad"), null);
});

test("raw Push strike velocity overrides a fixed matrix press value", () => {
    const cache = adapter.createPadVelocityCache();
    assert.deepEqual(adapter.cachePadVelocity(cache, 36, 23), {
        coordinate: "A1", velocity: 23
    });
    assert.deepEqual(
        adapter.applyCachedPadVelocity(
            cache,
            adapter.normalizeMatrixEvent([127, 0, 7])
        ),
        {coordinate: "A1", velocity: 23, x: 0, y: 7, pressed: true}
    );
    assert.equal(Object.keys(cache).length, 0);

    adapter.cachePadVelocity(cache, 67, 118);
    assert.deepEqual(
        adapter.applyCachedPadVelocity(
            cache,
            adapter.normalizeMatrixEvent([127, 7, 4])
        ),
        {coordinate: "H4", velocity: 118, x: 7, y: 4, pressed: true}
    );
});

test("velocity correlation preserves releases, mismatches, and matrix fallback", () => {
    const cache = adapter.createPadVelocityCache();
    adapter.cachePadVelocity(cache, 44, 0);
    assert.deepEqual(
        adapter.applyCachedPadVelocity(cache, adapter.normalizeMatrixEvent([0, 0, 6])),
        {coordinate: "A2", velocity: 0, x: 0, y: 6, pressed: false}
    );

    adapter.cachePadVelocity(cache, 37, 76);
    assert.deepEqual(
        adapter.applyCachedPadVelocity(cache, adapter.normalizeMatrixEvent([0, 1, 7])),
        {coordinate: "B1", velocity: 0, x: 1, y: 7, pressed: false}
    );
    assert.deepEqual(
        adapter.applyCachedPadVelocity(cache, adapter.normalizeMatrixEvent([54, 2, 7])),
        {coordinate: "C1", velocity: 54, x: 2, y: 7, pressed: true}
    );
    assert.equal(adapter.cachePadVelocity(cache, 68, 99), null);
    assert.equal(adapter.cachePadVelocity(cache, 36, 128), null);
});

test("physical velocity caches remain isolated between device instances", () => {
    const first = adapter.createPadVelocityCache();
    const second = adapter.createPadVelocityCache();
    adapter.cachePadVelocity(first, 36, 17);
    adapter.cachePadVelocity(second, 36, 119);

    assert.equal(
        adapter.applyCachedPadVelocity(first, adapter.normalizeMatrixEvent([127, 0, 7])).velocity,
        17
    );
    assert.equal(
        adapter.applyCachedPadVelocity(second, adapter.normalizeMatrixEvent([127, 0, 7])).velocity,
        119
    );
    assert.equal(Object.keys(first).length, 0);
    assert.equal(Object.keys(second).length, 0);
});

test("ownership requires enablement, Push availability, and selected own track", () => {
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, true), true);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, true, true), true);
    assert.equal(adapter.shouldOwnMatrix(false, 42, 42, true), false);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 41, true), false);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, false), false);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, true, false), false);
    assert.equal(adapter.shouldOwnMatrix(true, 0, 0, true), false);
});

test("duplicate arbitration follows device order with a stable id tie-break", () => {
    const now = 10000;
    const members = {
        300: {
            deviceId: 300, trackId: 42, order: 2,
            enabled: true, available: true, lastSeen: now
        },
        200: {
            deviceId: 200, trackId: 42, order: 0,
            enabled: true, available: true, lastSeen: now
        },
        100: {
            deviceId: 100, trackId: 42, order: 0,
            enabled: true, available: true, lastSeen: now
        }
    };

    assert.equal(adapter.arbitrationWinner(members, 42, now), 100);
    members[100].order = 3;
    assert.equal(adapter.arbitrationWinner(members, 42, now), 200);
    assert.equal(adapter.arbitrationWinner(members, 41, now), 0);
    assert.equal(adapter.liveDeviceOrder(200, [9, 200, 300]), 1);
    assert.equal(adapter.liveDeviceOrder(777, [9, 200, 300]), 1000000);
});

test("Max-safe flat arbitration registry round-trips exact member state", () => {
    const members = {
        300: {
            deviceId: 300, trackId: 42, order: 2,
            enabled: false, available: true, lastSeen: 123456789
        },
        100: {
            deviceId: 100, trackId: 41, order: 0,
            enabled: true, available: false, lastSeen: 123456700
        }
    };
    const flat = adapter.arbitrationRegistryValues(members);
    assert.deepEqual(flat, [
        100, 41, 0, 1, 0, 123456700,
        300, 42, 2, 0, 1, 123456789
    ]);
    assert.deepEqual(adapter.membersFromArbitrationRegistry(flat), {
        100: members[100],
        300: members[300]
    });
    assert.deepEqual(adapter.membersFromArbitrationRegistry(null), {});
    assert.deepEqual(
        adapter.membersFromArbitrationRegistry(["bad", 42, 0, 1, 1, 100]),
        {}
    );
});

test("arbitration excludes inactive, unavailable, other-track, and stale members", () => {
    const now = 20000;
    const members = {
        10: {
            deviceId: 10, trackId: 7, order: 0,
            enabled: false, available: true, lastSeen: now
        },
        11: {
            deviceId: 11, trackId: 7, order: 1,
            enabled: true, available: false, lastSeen: now
        },
        12: {
            deviceId: 12, trackId: 8, order: 0,
            enabled: true, available: true, lastSeen: now
        },
        13: {
            deviceId: 13, trackId: 7, order: 2,
            enabled: true, available: true,
            lastSeen: now - adapter.ARBITRATION_STALE_MS - 1
        },
        14: {
            deviceId: 14, trackId: 7, order: 3,
            enabled: true, available: true, lastSeen: now
        }
    };

    assert.deepEqual(
        Object.keys(adapter.freshArbitrationMembers(
            members,
            now,
            adapter.ARBITRATION_STALE_MS
        )),
        ["10", "11", "12", "14"]
    );
    assert.equal(adapter.arbitrationWinner(members, 7, now), 14);
    assert.equal(adapter.arbitrationWinner(members, 8, now), 12);
    assert.equal(adapter.ARBITRATION_BUS, "push_chord_grid_arbitration");
});
