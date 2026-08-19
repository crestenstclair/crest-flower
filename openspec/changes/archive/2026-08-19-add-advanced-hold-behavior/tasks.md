## 1. Pure musical and ownership core

- [x] 1.1 Extend chord snapshots with immutable automatic-triad and bass context and add a deterministic quality/extension retarget helper.
- [x] 1.2 Add validated atomic multi-owner retargeting with global before/after MIDI differences and newest-owner velocity selection.
- [x] 1.3 Add golden core vectors for manual-to-auto restoration, stored scale/voicing context, retained notes, transferred shared notes, velocity choice, and invalid input atomicity.

## 2. Runtime behavior

- [x] 2.1 Remove legacy hold-mode state, retain per-owner strike velocities, and make atomic mutation unconditional on actual rank-8 quality/extension edges.
- [x] 2.2 Synchronize active snapshots, Playing, Last, Nearest history, overlaps, releases, and lifecycle cleanup after atomic retargeting.
- [x] 2.3 Add integration vectors for always-live press/release, 9ths, multi-hold velocity, unrelated control changes, retrigger, and every lifecycle flush.

## 3. Generated device

- [x] 3.1 Remove the `Hold Mode` parameter and runtime wiring, restore the two-parameter first bank, and preserve the exact grid contract.
- [x] 3.2 Enforce the corrected parameter inventory, graph wiring, outlet/patchline counts, and closed dependency inventory in static validation and generated-patch tests.
- [x] 3.3 Run `make test`, `make build`, and `make validate` for each source-change batch and resolve failures without weakening accepted gates.

## 4. Documentation and release

- [x] 4.1 Update roadmap, architecture, decisions, product spec, README, usage HTML, and exact hardware acceptance card for the sole always-live behavior.
- [x] 4.2 Bump source, validation, release-Set, and package metadata to v0.5.2 RC with no new runtime or development dependency.
- [x] 4.3 Package the reviewed device and Set with exact manifest inventory and generated AMXD/ZIP SHA-256 sidecars.

## 5. Acceptance and Live integration

- [ ] 5.1 Run strict OpenSpec validation, semantic review, deterministic acceptance, clean reproducibility, dependency, package, and installed-byte comparison gates. Strict validation, semantic review, reproducibility, dependency, package, checksum, and installed-byte gates pass; deterministic acceptance remains unavailable because OpenSpec CLI 1.6.0 and the current 1.9.0 release do not provide the required `acceptance` command.
- [x] 5.2 Install the byte-identical artifact, preserve the release-Set downstream devices/routing, verify the absence of Hold Mode and lifecycle state, save/restart, and leave Live visible.
