## Why

The accepted v0.4.7 musical surface now needs to survive ordinary Live 12 project use: duplicate devices, device reordering, scale changes, reloads, recording, and lifecycle interruption must not produce competing grid owners or stuck notes. WP5 turns that working device into a reproducible Live release candidate with a clean ready-to-play Set and complete delivery evidence before Standalone integration begins.

## What Changes

- Arbitrate same-track duplicate Push Chord Grid instances so exactly one eligible device can own the matrix and generate chord events, with deterministic eligibility after device reordering.
- Preserve isolated note, history, LED, and lifecycle state across devices on different tracks; focus changes select the sole active owner.
- Expand regression and stress coverage for duplicate instances, device order, repeated scale changes, exact releases, reload/disable/delete, and overlapping holds.
- Produce a clean Live 12 release-candidate Set with one source device, a ready-to-play stock instrument route, and verified Post-FX recording; validate an External Instrument route without leaving obsolete validation tracks in the Set.
- Add a versioned release-candidate bundle, generated manifest, dependency scan, changelog, hardware checklist, and checksums, and verify clean byte-for-byte rebuilds.
- Exercise Live restart and Set reload through MCP/UI automation and retain unresolved physical-duration evidence explicitly for the hardware gate.

## Capabilities

### New Capabilities

- `live-instance-arbitration`: Deterministic single-owner behavior for duplicate devices, device order, selected-track focus, scale changes, and all release/lifecycle paths.
- `release-candidate-delivery`: Reproducible WP5 build, clean ready-to-play Live Set, routing/recording evidence, manifest/dependency validation, checklist, bundle, and checksums.

### Modified Capabilities

None.

## Impact

The Push grid adapter, generated Max device graph, deterministic runtime tests, static artifact checks, Live acceptance Set, packaging scripts, manifest/version/changelog, architecture and decision records, usage guide, and hardware acceptance card are affected. No runtime dependency or desktop-only API is added; the Max-native/public-LOM Push 3 Standalone compatibility boundary remains unchanged.
