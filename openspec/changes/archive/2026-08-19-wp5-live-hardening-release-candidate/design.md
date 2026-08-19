## Context

v0.4.7 is a self-contained generated Max for Live MIDI effect whose deterministic core, Push matrix acquisition, LEDs, physical velocity, scale observation, note ownership, reload recovery, and Live routing have passed WP4. Each device instance currently decides ownership from enablement, Push availability, and selected-track identity. Two copies on the same selected track therefore both believe they own the matrix even though Live can deliver control to only one grabber, which can produce conflicting LED/release behavior and can double generated output during ownership churn.

WP5 must harden the accepted behavior in Live 12 without adding Node for Max, external services, private APIs, User Mode, MIDI mappings, or desktop-only runtime dependencies. The generated AMXD remains the source-derived runtime artifact. A clean stock-instrument Live Set and its release bundle become delivery inputs/evidence, while the final Push Standalone transfer remains WP6.

## Goals / Non-Goals

**Goals:**

- Guarantee one matrix/music owner across all enabled Push Chord Grid instances, including same-track duplicates and device reordering.
- Flush notes and LEDs before every ownership transfer, and recover deterministically from stale owners, reload, disable, deletion, focus changes, and Live restart.
- Preserve per-instance scale, history, note-owner, velocity, and LED-cache isolation.
- Add deterministic regression and sustained-event stress evidence for device order, scale changes, overlaps, and release paths.
- Deliver a clean ready-to-play Live Set and a byte-reproducible, checksummed WP5 release-candidate bundle.
- Drive every discoverable Live-side acceptance step through Producer Pal and Computer Use, leaving only physical contact/duration evidence unresolved when MCP cannot originate it.

**Non-Goals:**

- Advanced held-chord mutation, Secret Chords, snapshots, split outputs, Strum, Arp, or new harmonic features.
- Push 3 Standalone transfer, cold boot, or final Standalone acceptance; those remain WP6.
- Shipping Producer Pal, test helpers, network access, or any desktop-only component in the runtime or release Set.

## Decisions

### A Max-native shared arbiter owns the Push matrix lease

Every embedded `push-grid-adapter.js` instance registers its positive Live device ID, canonical parent track ID, current device-order index, enablement, Push/matrix availability, and heartbeat in a named Max `Global`. A fixed Max receive bus prompts all instances to reconcile whenever membership, focus, device state, order, or ownership changes. Only registered Push Chord Grid adapters participate, so device renaming cannot defeat identity.

The winner is the first active registered instance in the selected track's current device order, with Live device ID as a deterministic tie-break. A single global lease records the current owner. A new winner waits while the former owner holds the lease; the former owner first flushes its active notes, clears its LED frame, releases the native matrix, and clears the lease before broadcasting another reconciliation. Stale registrations and leases expire after bounded missed heartbeats so an abnormal teardown cannot leave the surface dark indefinitely.

Alternatives considered: comparing device names or parameter signatures is vulnerable to renaming and false matches; lowest immutable device ID ignores visible chain order; trusting repeated `grab_control` calls permits two instances to believe they own the same matrix; desktop coordination would violate the runtime boundary.

### Ownership selection and musical state remain separate

The shared arbiter contains only discovery/lease metadata. Harmony state, nearest-history, active-note owners, physical velocity caches, and LED diff caches remain local to each device instance. A standby duplicate receives no matrix events and emits no generated MIDI or LED writes. On a real transfer, the outgoing instance uses the existing lifecycle path; the incoming instance begins with an empty ownership/cache frame and repaints once after acquisition.

This preserves the accepted immutable held-snapshot behavior and allows pure tests to instantiate multiple runtime adapters without hidden shared musical state.

### Hardening uses deterministic vectors plus a sustained event simulation

Pure arbitration helpers define winner selection, stale-member removal, and eligibility and are exported for exact unit vectors. Integration tests create multiple musical runtimes, apply different scales and controls, and prove that their notes, history, and lifecycle flushes never cross. A deterministic 30-minute-equivalent event sequence covers repeated chord overlaps, same-coordinate retriggers, scale changes, focus loss, disable, reload, delete, and Set close without wall-clock delay.

The simulation does not replace the hardware gate's physical 30-minute play session; it supplies automated evidence while the generated hardware card records the remaining physical result explicitly.

### The release Set is a clean, verified package input

Live saves `release/PushChordGrid-v0.5.0-RC Project/PushChordGrid-v0.5.0-RC.als` after the final installed AMXD is loaded and verified. The Set contains one Push Chord Grid source and one armed/monitored stock Drift destination receiving Post-FX MIDI. Producer Pal and temporary duplicate/External Instrument validation tracks are removed before the release copy is saved. The binary Set is treated as a reviewed release input; deterministic packaging copies its exact bytes with fixed ZIP metadata, so repeated clean packages remain byte-identical.

The release manifest continues to describe the runtime artifact and embedded dependency closure. Package tests enumerate every bundle member, and the packaging tool writes SHA-256 sidecars for the AMXD and ZIP. Documentation records the exact Live build, routes, checks, and any hardware-only evidence still pending.

### Live acceptance is automated through connected controls

Producer Pal performs semantic Set/track/device/routing/scale operations. Computer Use handles operations not exposed semantically, including Save As, visible device-chain inspection, Live quit/relaunch, and dialogs. The agent saves before restart, reopens the release Set, verifies one owner and correct scale, and leaves Live visible.

## Risks / Trade-offs

- [A device can disappear without `notifydeleted`] → Heartbeat expiry clears stale members/lease, and the existing one-second watchdog forces reconciliation.
- [Reordering could otherwise create a brief dual owner] → Two-phase lease transfer prevents the incoming device from acquiring until the outgoing device clears notes, LEDs, and the native grab.
- [Named Max state can outlive a Set] → Device IDs are positive Live object identities, all entries expire, and initialization prunes stale state before claiming.
- [A checked-in ALS cannot be regenerated without Live] → Treat it as a reviewed binary release input, checksum it, and keep AMXD generation and packaging deterministic; UI automation can recreate it when intentionally updated.
- [MCP cannot physically press Push pads or prove 30 minutes of human performance] → Complete every automatable setup/inspection/restart/stress step and mark only that irreducibly physical evidence as pending rather than asking the user to redo agent-owned work.

## Migration Plan

Build and install v0.5.0, exercise duplicate devices and device reordering in the working Set, validate scale/lifecycle/routing/recording behavior, and save the cleaned release Set. Reopen Live and the release Set, then package the byte-identical installed AMXD, Set, manifest, guides, checklist, changelog, and checksums. Rollback is replacement with the retained v0.4.7 AMXD or a Live automatic backup Set.

## Open Questions

None. The physical 30-minute use result is an acceptance observation, not an implementation decision.
