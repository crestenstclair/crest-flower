## Context

The current runtime has one momentary quality stack for A8–D8, four independent
extension flags on E8–H8, persistent voicing/Nearest controls on A7–D7, and sixteen
reserved pads across ranks 5–6. Quality and extension edges already rebuild every
active owner atomically from its press-time automatic harmony, placement, bass, and
velocity recipe. The same snapshot drives Last, Playing, Nearest history, exact
release, and shared-pitch reference counts.

This is a cross-cutting musical-grid change. The generator and ES5 runtime must remain
the source of truth, the artifact must remain Push 3 Standalone-compatible, and the
change must not begin WP6 Standalone acceptance or add a runtime dependency.

## Goals / Non-Goals

**Goals:**

- Present the requested basic qualities in the order Major, Minor, Diminished, Sus.
- Add Augmented, Power, Quartal, and Dominant as a second quality row.
- Put Voice −, Voice 0, Voice +, and Nearest directly beneath those quality rows.
- Replace manual m7/M7 selection with one contextual 7 control whose emitted pitch is
  deterministic for automatic and manual qualities.
- Preserve atomic held-chord mutation, exact ownership, velocity, Nearest, feedback,
  lighting, lifecycle cleanup, and reproducible packaging.

**Non-Goals:**

- User-defined chord formulas, alternate secret-bank pages, saved snapshots, split
  bass/chord routing, Strum, Arp, or other timed transforms.
- Changing the four octave-spaced chord rows, Base Octave, bass controls, or the
  future-trigger-only behavior of Voice, Nearest, bass, and Live scale changes.
- Running the deferred WP6 Push Standalone transfer or acceptance gate.

## Decisions

### Use one visible two-row quality bank

The exact left half of the control area becomes:

| Rank | A | B | C | D |
| --- | --- | --- | --- | --- |
| 8 | Major | Minor | Diminished | Sus |
| 7 | Augmented | Power | Quartal | Dominant |
| 6 | Voice − | Voice 0 | Voice + | Nearest |

E8, F8, G8, and H8 become 6, contextual 7, Reserved, and 9 respectively. E7–H7
remain Bass −, Bass −1, Bass +, and Bass on/off. E6–H6 and all of rank 5 remain
reserved. This placement satisfies “voicing under that,” retains the established bass
and 6/9 muscle memory, and does not spend the spare G8 pad on an unrelated feature.

Alternative considered: place Secret Chords on rank 6 and leave voicing on rank 7.
That contradicts the requested visual hierarchy and separates the basic and secret
quality banks. Alternative considered: use G8 for 11 or 13. That expands extension
scope without a user requirement and consumes the only newly freed top-row pad.

### Treat all eight pads as one momentary quality stack

The existing last-held-wins stack expands from four coordinates to eight. A new press
selects its quality, a repeated nonzero notification is ignored until release, release
restores the newest still-held quality, and releasing the final quality restores Auto.
Every actual selection edge uses the current all-owner transaction; the pads
themselves remain silent.

Alternative considered: make the Secret row latching. Mixing latching and momentary
quality states creates two precedence models and makes lifecycle reset and overlapping
holds harder to predict.

### Give every quality one canonical base formula

Manual pitches are root-relative and normalized after MIDI-range filtering:

| Quality | Semitone intervals |
| --- | --- |
| Major | `0 4 7` |
| Minor | `0 3 7` |
| Diminished | `0 3 6` |
| Sus | `0 5 7` |
| Augmented | `0 4 8` |
| Power | `0 7` |
| Quartal | `0 5 10` |
| Dominant | `0 4 7 10` |

Sus retains the current sus4 meaning. Power is the pitch-class dyad rather than
forcing a doubled octave root; the octave-row, manual Voice, and optional bass already
control register. Quartal is three stacked perfect fourths. Dominant includes its
minor seventh by definition, which distinguishes it from Major without relying on an
extension hold.

Alternative considered: minor-major instead of Power. The requested Power chord adds
a genuinely sparse structure, while minor-major remains a less common color that can
be reconsidered with user-defined formulas later. The four requested additions are
therefore retained unchanged.

### Resolve one 7 modifier from the chord recipe

The runtime replaces `minor_seventh` and `major_seventh` flags with one `seventh`
flag. When enabled, it resolves one pitch before voicing:

| Active quality | Seventh rule |
| --- | --- |
| Auto | The press-time scale-stacked seventh (degree offset 6 from the pad root) |
| Major, Augmented | root +11 |
| Minor, Sus, Power | root +10 |
| Diminished | root +9 |
| Quartal, Dominant | root +10, already present and therefore deduplicated |

This makes Major produce M7 and Minor produce m7 without a second decision, preserves
diatonic behavior in Auto, and gives every added type deterministic semantics.
Dominant remains a dominant seventh even when 7 is not held; holding 7 is an
idempotent modifier state that may change its LED/feedback but emits no redundant
MIDI. The 6 and 9 flags remain independent and may combine with 7.

Alternative considered: infer every seventh only from the resolved triad quality.
That would turn a scale-derived dominant-function major triad into M7 instead of using
Live's diatonic seventh. Alternative considered: retain separate m7/M7 overrides next
to contextual 7. That preserves the manual burden the change is intended to remove.

### Preserve a rebuildable automatic seventh in active snapshots

A chord press stores its automatic root-position triad plus the press-time
scale-stacked seventh candidate, even when 7 is currently off. Retargeting to Auto can
therefore restore the original diatonic triad and contextual seventh after later Live
scale changes. Manual quality retargets use the fixed table above. Existing stored
manual Voice, exact Nearest adjustment, bass choice, and strike velocity are then
reapplied before the global owner transaction commits.

This extends the existing recipe instead of recalculating from current Live state.

### Generalize Nearest and feedback from fixed legacy enumerations

Nearest continues to search adjustments from `-(toneCount-1)` through
`+(toneCount-1)`, so Power, triadic qualities, and Dominant receive one complete
rotation for their actual cardinality. The existing symmetric score and tie-breaks do
not change. Voice and Nearest changes remain future-trigger-only and clear history;
their coordinate constants and LED tests move to A6–D6.

Snapshots retain requested quality, resolved quality, active 6/7/9 flags, and the
resolved seventh interval/pitch when present. Last feedback names the new quality and
resolved seventh and still prints the exact MIDI snapshot. Playing uses a generated,
deduplicated closed enum derived from the supported snapshot identities rather than a
hand-maintained `12 × 5 × 16` assumption. `--` remains code 0 and the generated table,
runtime encoder, and static validator share one deterministic ordering.

### Keep generated/runtime boundaries and acceptance discipline unchanged

Implementation changes text sources only: core harmony/state, the runtime adapter,
generator/validator/packaging inputs, tests, and source documentation. `dist/` is
rebuilt, never edited. Automated work runs `make test`, `make build`, and
`make validate` after each source change, followed by deterministic packaging.
Producer Pal and Computer Use own all available Live setup and evidence; any user step
is reduced to physical Push contact that connected tools cannot originate.

## Risks / Trade-offs

- [Breaking coordinate changes cause old muscle memory to select a different quality]
  → Update every grid diagram, LED legend, Playing/Last example, and the hardware card;
  make the release notes call out A8/C8 and the A7–D7 to A6–D6 move explicitly.
- [Automatic sevenths can be unusual in non-heptatonic Live scales] → Derive the exact
  seventh with the same scale-walk contract already used for automatic 1/3/5, store
  the resolved pitch, and expose the exact result in Last feedback and golden vectors.
- [Power and Dominant change chord cardinality, altering inversion candidates] → Base
  the candidate range on actual normalized tone count and add exact two-/four-tone
  Nearest vectors, including MIDI-boundary cases.
- [Dominant and Quartal already contain +10, so pressing 7 may emit no notes] → Treat
  the flag as a valid idempotent state, deduplicate pitches, update feedback/LED state,
  and assert that no duplicate note-on or note-off is produced.
- [Expanding the Playing identity set can make generated device metadata large] →
  Generate only unique supported labels, validate enum/code agreement statically, and
  fail the build if the table or parameter range diverges.
- [A new modifier edge can expose stuck-note regressions] → Reuse the proven atomic
  all-owner replacement path and extend overlap, shared-pitch, retrigger, lifecycle,
  and sustained-stress tests before Live installation.

## Migration Plan

1. Change core formulas and state/snapshot schemas with golden unit tests.
2. Change coordinate roles, quality-stack input, LEDs, feedback, and Playing tables.
3. Regenerate and validate the AMXD, manifest, package, checksums, and exact docs.
4. Replace the device in the agent-owned Live test Set, verify acquisition/routing,
   record MCP-addressable evidence, and save the clean Set.
5. Run the minimal physical quality/voicing contact sequence only where no connected
   capability can originate `Button_Matrix` callbacks.

Rollback is a rebuild from the prior tagged text sources and previously reproducible
release inputs; no saved Hold Mode or user chord data requires migration.

## Open Questions

None required before implementation. G8 intentionally remains reserved, leaving a
future extension or utility choice independent of this change.
