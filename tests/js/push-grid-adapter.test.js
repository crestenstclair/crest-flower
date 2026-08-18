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

test("ownership requires enablement, Push availability, and selected own track", () => {
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, true), true);
    assert.equal(adapter.shouldOwnMatrix(false, 42, 42, true), false);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 41, true), false);
    assert.equal(adapter.shouldOwnMatrix(true, 42, 42, false), false);
    assert.equal(adapter.shouldOwnMatrix(true, 0, 0, true), false);
});
