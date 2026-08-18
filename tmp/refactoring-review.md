# Refactoring Review: main working tree

**Date:** 2026-08-17
**Base branch:** main
**Files reviewed:** 15

## Critical Issues

None after review. One input-boundary defect was corrected during review: an explicitly
supplied `null` scale interval list now fails validation instead of silently selecting
the default major scale.

## Refactoring Opportunities

Completed during review: named constants now own the Live octave offset, MIDI bounds,
row degree offset, All Notes Off controller, and lifecycle flush set. This removes
scattered musical protocol literals without adding runtime abstraction.

## Minor Suggestions

The pure harmony functions carry root, scale, and octave as separate primitive
arguments. A parameter object could shorten those signatures, but would add allocation
and indirection to a small Max `js` boundary. Keep the current API until a third caller
demonstrates a real data-clump problem.

## Summary

The four modules have clear single responsibilities: harmony calculation, note layout,
selection state, and active-note ownership. Their small plain-data interfaces suit the
ES5 Max runtime, avoid speculative class hierarchies, and isolate WP4 integration from
the deterministic musical behavior. No blocking smell or SOLID violation remains.
