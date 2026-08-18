"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const adapter = require("../../src/max/live-scale-adapter.js");
const integration = require("../../src/max/runtime-adapter.js");
const adapterPath = path.resolve(__dirname, "../../src/max/live-scale-adapter.js");

function liveApiHarness() {
    const emitted = [];
    const observers = {};
    const initial = {
        root_note: ["root_note", 0],
        scale_intervals: ["scale_intervals", 0, 2, 4, 5, 7, 9, 11],
        scale_name: ["scale_name", "Major"],
        scale_mode: ["scale_mode", 1]
    };

    function FakeLiveAPI(callback) {
        this.callback = callback;
        this.get = (property) => initial[property];
        Object.defineProperty(this, "property", {
            set(value) {
                if (value) {
                    observers[value] = this;
                }
            }
        });
    }

    const sandbox = {
        LiveAPI: FakeLiveAPI,
        outlet(...args) {
            emitted.push(JSON.parse(JSON.stringify(args)));
        }
    };
    vm.runInNewContext(fs.readFileSync(adapterPath, "utf8"), sandbox, {
        filename: adapterPath
    });
    sandbox.initialized();
    return {emitted, observers};
}

test("normalizes LiveAPI's single array callback argument", () => {
    assert.deepEqual(
        adapter.callbackArguments([["scale_intervals", 0, 2, 3, 5, 7, 8, 10]]),
        ["scale_intervals", 0, 2, 3, 5, 7, 8, 10]
    );
    assert.deepEqual(
        adapter.valuesWithoutProperty(
            [["scale_intervals", 0, 2, 3, 5, 7, 8, 10]],
            "scale_intervals"
        ),
        [0, 2, 3, 5, 7, 8, 10]
    );
});

test("observed C Minor callbacks emit a complete updated scale snapshot", () => {
    const harness = liveApiHarness();

    harness.observers.scale_name.callback(["scale_name", "Minor"]);
    harness.observers.scale_intervals.callback([
        "scale_intervals", 0, 2, 3, 5, 7, 8, 10
    ]);

    assert.deepEqual(harness.emitted.slice(-2), [
        [0, ["scale_name", "Minor"]],
        [0, ["scale", 0, 0, 2, 3, 5, 7, 8, 10]]
    ]);

    const runtime = integration.createRuntime();
    const scaleMessage = harness.emitted.at(-1)[1];
    integration.applyScaleSnapshot(runtime, scaleMessage[1], scaleMessage.slice(2));
    runtime.scaleName = "Minor";
    assert.deepEqual(integration.processGridEvent(runtime, "A1", 90), [
        {type: "note_on", pitch: 60, velocity: 90},
        {type: "note_on", pitch: 63, velocity: 90},
        {type: "note_on", pitch: 67, velocity: 90}
    ]);
    assert.equal(
        integration.selectionText(runtime),
        "Scale C Minor | Chord: Auto | Voice 0 | Nearest off | Bass off | Ext -"
    );
});
