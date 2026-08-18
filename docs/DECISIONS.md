# Decisions

## 2026-08-17 — generated M4L target

- **Decision:** Build a Max for Live MIDI Effect from text source.
- **Reason:** It is the supported real-time MIDI-effect format shared by Live 12 and
  Push 3 Standalone; manual patching would defeat reproducible agent ownership.
- **Rejected:** VST/AU/JUCE, Live MIDI Tools, Remote Scripts, User Mode, and a manually
  maintained Max canvas.

## 2026-08-17 — pin m4l-builder for the infrastructure spike

- **Decision:** Pin m4l-builder commit
  `6c602b2861bf628d14fd39854d984b12de3cebff` (declared version 0.8.0).
- **Evidence:** The revision has a native MIDI-effect type, raw `midiin` → `midiout`
  recipe, stored parameter generation, Push parameter-bank metadata, AMXD parsing, and
  build linting.
- **Risk:** The project declares alpha maturity and a generated container still needs
  validation in the actual hosts.
- **Fallback:** Deterministic direct `.maxpat`/`.amxd` JSON generation, still owned by
  repository text sources.

## 2026-08-17 — WP1 blocks musical implementation

- **Decision:** Do not implement chord or Push matrix behavior until the generated
  passthrough loads successfully in Live.
- **Gate state:** Accepted. The generated device loaded in Live, the MIDI test clip
  passed through to Drift with a measured `-7.91 dB` track peak, and stored parameter
  persistence passed.

## 2026-08-17 — defer repeated Push Standalone testing

- **Decision:** Do not require switching Push between Control Mode and Standalone for
  the WP1 infrastructure gate or on every subsequent work package.
- **Reason:** The mode-switching workflow is disruptive for the user.
- **Result:** The stored **Base Octave** parameter has been confirmed to persist as `5`
  after saving and reopening the Live Set. Live load and passthrough evidence are used
  for the current gate; standalone compatibility remains a design and release
  constraint, with a consolidated standalone test deferred until explicitly requested.
