# Agent instructions

## Scope and gate

WP0–WP4 are accepted. WP5 hardening and v0.5.2 live held-chord behavior are
implemented; physical duration acceptance remains open. The user authorized
continuing `add-secret-chord-layer` on 2026-10-29. Version 0.6.0 adds eight qualities,
contextual 7, and relocated Voice/Nearest controls. Do not begin WP6 without a new
implementation request. Repeated Push Standalone switching remains deferred;
preserve compatibility without requiring a Standalone test at each gate.

## Source of truth

- Product intent and the complete roadmap: `Push-Chord-Grid-Project-Plan.md`
- Current architecture and constraints: `docs/ARCHITECTURE.md`
- Recorded decisions and gate state: `docs/DECISIONS.md`
- Device generator: `build/build_device.py`
- AMXD parsing and static checks: `tools/inspect_amxd.py`
- Hardware acceptance card: `docs/HARDWARE_TESTS.md`

Files in `dist/` are generated. Never hand-edit them. Change the generator,
validator, packaging code, or source documentation and rebuild instead.

## Commands

```bash
make bootstrap
make test
make build
make validate
make package
```

Run `make test`, `make build`, and `make validate` after every source change. A
behavior change must update automated tests and the exact expected results in the
hardware test card.

## MCP-first Live workflow

Do not ask the user to perform a Live-side action until connected MCP capabilities
have been checked and exhausted.

1. Connect Producer Pal before other Live operations. Prefer it for Set/track/device
   reads and writes, scale changes, routing, arming, selection, playback, and recorded
   MIDI inspection.
2. Use the Computer Use skill for UI-only gaps such as installing/loading a local AMXD,
   device-activator interaction, dialogs, visible status inspection, saving a test Set,
   and screenshots. Use its required `node_repl` workflow.
3. Use repository commands for generation, validation, checksums, and packaging.
4. Request user action only for a verified physical-only boundary, such as touching a
   Push pad when no connected MCP can originate its `Button_Matrix` callback.

The agent owns test setup and evidence capture. Never delegate artifact installation,
track creation/routing, stock-instrument setup, arming/recording, scale changes, focus
cycling, device toggling, Set saving, clip inspection, or screenshot/log collection if
Producer Pal or Computer Use can perform it. At hardware gates, complete and record
all MCP-addressable checks first, then reduce any remaining human action to the
smallest physical contact sequence.

## Runtime constraints

- Preserve Push 3 Standalone compatibility.
- Runtime code may use Max-native objects, Max `js`, and the public Live Object Model.
- Never introduce Node for Max, `node.script`, third-party externals, runtime network
  calls, UDP, Jitter/OpenGL, shell commands, helper services, desktop-only MIDI ports,
  User Mode, MIDI mappings, or Remote Scripts.
- Development-only Python and Node tooling is allowed, but it must never become an
  artifact runtime dependency.
- Generate Max patches from text. Never make a hand-edited Max canvas the source of
  truth.
- Pin every development dependency and retain its license notice.

## Release discipline

- A clean build must be byte-for-byte reproducible.
- The manifest must enumerate every runtime file and report no undeclared dependency.
- The user receives an artifact from `dist/`, not patching instructions.
- If freezing cannot be reproduced from the command line, the user may perform the
  single final **Freeze Device** action only after all other checks pass.
