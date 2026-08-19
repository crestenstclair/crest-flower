## 1. Deterministic musical core

- [x] 1.1 Add MIDI-safe nearest-inversion candidate generation, symmetric scoring, and deterministic tie-breaking to `harmony.js` with exact unit vectors.
- [x] 1.2 Add persistent Nearest state, history invalidation, chord snapshot metadata, and bass-independent selection to `state.js` with full branch coverage.

## 2. Grid runtime and device surface

- [x] 2.1 Assign D7 its silent edge-triggered role, state-aware LED, selection text, and lifecycle behavior in `runtime-adapter.js`.
- [x] 2.2 Add exact last-chord formatting from the emitted snapshot and a dedicated runtime outlet with integration coverage.
- [x] 2.3 Expand the generator-owned device face and wire separate current/last-chord displays; update static generator and artifact inspection tests.

## 3. Product contract and acceptance evidence

- [x] 3.1 Update the product plan, architecture, product spec, decisions, Orchid mapping, usage guide, version/changelog, and coordinate documentation for v0.4.6.
- [x] 3.2 Update the exact hardware acceptance card for D7, nearest golden progressions, LEDs, feedback, lifecycle, recording, and retained v0.4.5 behavior.

## 4. Build and release gates

- [x] 4.1 Run `make test`, `make build`, and `make validate`; repair every failure and retain complete deterministic-core coverage.
- [ ] 4.2 Run package, clean reproducibility, manifest/dependency, checksum, and OpenSpec semantic/deterministic acceptance gates. Package, reproducibility, manifest/dependency, checksum, semantic review, and strict validation pass for v0.4.7; deterministic acceptance remains unavailable because OpenSpec CLI 1.6.0 and current 1.9.0 do not provide the required `acceptance` command.
- [x] 4.3 Install the byte-identical v0.4.6 artifact, replace the current Live device through available MCP/UI control, preserve routing/settings, verify current/last-chord UI plus matrix reacquisition, and save the cleaned Set.
- [x] 4.4 Repair array-wrapped LiveAPI scale callbacks, expose the detected scale, add a production-shape C Minor regression, release v0.4.7, reinstall it in Live, verify C Minor without reload, and save.
