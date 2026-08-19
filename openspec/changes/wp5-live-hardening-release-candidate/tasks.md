## 1. Ownership hardening

- [x] 1.1 Add pure winner-selection, eligibility, stale-registration, and lease helpers with deterministic duplicate/device-order vectors.
- [x] 1.2 Add Max-native shared registration, reconciliation broadcast, heartbeat expiry, and two-phase matrix lease transfer to `push-grid-adapter.js`.
- [x] 1.3 Wire the cross-instance reconciliation receive path into the generated patch and extend static AMXD validation.

## 2. Musical and lifecycle regression coverage

- [x] 2.1 Add multi-runtime isolation tests for scale, controls, nearest-history, velocity cache, LEDs, overlaps, and lifecycle flushes.
- [x] 2.2 Add C Major/C Minor/A Minor held-snapshot release vectors and a deterministic 30-minute-equivalent hardening sequence with no unmatched notes.
- [x] 2.3 Run `make test`, `make build`, and `make validate` after the behavior change and repair all failures without reducing deterministic-core coverage.

## 3. Live 12 validation and clean Set

- [x] 3.1 Install the byte-identical WP5 build, create duplicate instances, reorder devices, change focus/scale, and verify single-owner transfer and lifecycle cleanup through MCP/UI control.
- [x] 3.2 Validate the stock Drift route, temporary External Instrument route, and Session/Arrangement recording configuration, then remove duplicate/temporary/obsolete tracks and devices.
- [x] 3.3 Save a clean ready-to-play release Set with one source and one Post-FX stock-instrument destination, restart Live, reopen it, verify reacquisition/current scale/routing, and leave Live visible.

## 4. Release-candidate delivery

- [x] 4.1 Bump the project to WP5 v0.5.0 and update the roadmap, architecture, decisions, product spec, README, changelog, usage HTML, and exact hardware acceptance card.
- [x] 4.2 Package the reviewed Live Set with the AMXD, manifest, documentation, and generated AMXD/ZIP SHA-256 sidecars under a versioned WP5 release-candidate root.
- [x] 4.3 Extend package/manifest/dependency tests to enforce exact inventory, no undeclared runtime dependency, and byte-for-byte reproducibility.

## 5. Final gates and evidence

- [x] 5.1 Run the complete test, build, validation, package, forbidden-dependency, strict OpenSpec validation, clean-rebuild, checksum, and diff-sanity gates.
- [x] 5.2 Confirm the installed AMXD is byte-identical to `dist`, inspect the packaged Set/bundle, and record all agent-owned Live evidence.
- [x] 5.3 Mark only the irreducible physical 30-minute Push performance observation pending in the generated checklist; do not infer hardware acceptance or delegate MCP-capable setup to the user.
