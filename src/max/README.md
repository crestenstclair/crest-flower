# Max runtime adapters

`push-grid-adapter.js` is the WP2 Max `js` runtime. It dynamically discovers Push,
owns and observes `Button_Matrix` according to device/track lifecycle, and normalizes
callbacks to A1–H8. It is embedded into the frozen AMXD during generation.

It deliberately has no chord, note, or LED behavior. The exported pure functions are
also exercised by Node's built-in test runner; Node is development-only and is never
part of the runtime artifact.
