## Why

The device already calculates and shows exact chord feedback in Live, but the Push
display exposes only Base Octave. A performer looking at Push cannot identify the
currently held chord without returning to the computer screen.

## What Changes

- Add a read-only **Playing** value to Push Chord Grid's first Push parameter bank.
- Derive its label from the exact active owner snapshot, including resolved chord
  quality and every active 6/m7/M7/9 extension.
- Make overlapping holds deterministic: the newest held chord is displayed, releasing
  it reveals the previous held chord, and releasing the last chord returns to `--`.
- Clear the display on every existing ownership-loss lifecycle without changing MIDI,
  LEDs, scale observation, or duplicate-instance arbitration.
- Extend generated-patch validation, deterministic tests, Live evidence, documentation,
  manifest/package checks, and release notes for the new display.

## Capabilities

### New Capabilities

- `push-playing-display`: Current held-chord identity on Push through the device's
  public parameter bank, with exact overlap and lifecycle semantics.

### Modified Capabilities

None.

## Impact

Affected files include `runtime-adapter.js`, the generated Max graph and parameter
bank, static AMXD validation, JavaScript/Python tests, Live installation evidence,
release documentation, manifest, and deterministic package bytes. The runtime remains
Max-native and introduces no network, external, Remote Script, or desktop dependency.
