# Agent instructions

## Scope and gate

WP0–WP3 are accepted. WP4 is the next work package, but do not begin it without a new
implementation request. Repeated Push Standalone switching is explicitly deferred by
user decision; preserve standalone compatibility without requiring a standalone test
at each gate.

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
