## 1. Runtime display behavior

- [x] 1.1 Add deterministic chord-display enum, code, and label helpers for exact root, resolved quality, and 6/m7/M7/9 extensions.
- [x] 1.2 Track active immutable chord snapshots and newest-held display ownership without changing note-owner or persistent Live feedback behavior.
- [x] 1.3 Emit display changes for presses, releases, retriggers, overlaps, and every lifecycle flush, with standby instances remaining silent.

## 2. Generated device integration

- [x] 2.1 Generate an inactive, non-mappable `Playing` enum parameter, wire runtime updates through `set`, and assign it to first-bank slot 2.
- [x] 2.2 Extend the Max object allowlist and static AMXD validator for the exact enum table, metadata, wiring, outlet counts, parameter inventory, and bank layout.

## 3. Automated verification

- [x] 3.1 Add JavaScript golden vectors for label encoding, overlapping holds, held control/scale changes, retriggers, standby behavior, and lifecycle clearing.
- [x] 3.2 Add Python generated-patch and documentation assertions for the read-only display contract and exact Push bank.
- [x] 3.3 Run `make test`, `make build`, and `make validate` after each source-change batch and resolve failures without weakening existing gates.

## 4. Live integration and documentation

- [x] 4.1 Install the byte-identical device, replace the release-Set instance, verify `Base Octave` and `Playing` in Live's public bank state, save, restart, and leave Live visible.
- [x] 4.2 Update the roadmap, architecture, decisions, product spec, README, changelog, usage HTML, and exact hardware card for Push display use and its single physical observation.

## 5. v0.5.1 release candidate

- [x] 5.1 Bump source, validation, Set, and package metadata to v0.5.1 without adding a runtime or development dependency.
- [x] 5.2 Package the reviewed v0.5.1 Live Set and device with exact manifest inventory and generated AMXD/ZIP SHA-256 sidecars.
- [x] 5.3 Run strict OpenSpec validation, full clean/reproducibility/dependency gates, compare installed and packaged bytes, and record final evidence.
