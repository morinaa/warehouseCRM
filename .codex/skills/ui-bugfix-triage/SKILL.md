---
name: ui-bugfix-triage
description: Use for front-end bugs (broken UI, state glitches, routing issues, rendering errors). Reproduce, isolate root cause, patch minimally, and verify across browsers/responsive breakpoints.
metadata:
  short-description: Reproduce → isolate → minimal UI fix → verify.
---

# UI Bugfix Triage

## Mission
Fix UI issues with a disciplined flow: reproduce, isolate, patch minimally, validate in realistic scenarios.

## Non-negotiables
- Prefer minimal diffs that fix the bug without redesigning.
- Don’t change public behavior or styling unless required by the bug.
- Verify on the smallest reliable surface: unit/UI test if present, otherwise a deterministic manual repro checklist.

## Workflow
1) Reproduce
- Capture exact steps, expected vs actual, and the smallest reproduction path.
- Identify scope: component(s), route(s), feature flags, role permissions, viewport, browser.

2) Isolate
- Narrow to one of: state management, async effect timing, props shape, memoization, router params, CSS/layout, hydration/SSR mismatch.
- Inspect relevant boundaries: API payloads, cache keys, query params, localStorage, feature toggles.

3) Patch (smallest fix)
- Fix the root cause close to the source:
  - wrong dependency arrays / stale closures
  - incorrect keys or unstable lists
  - race conditions (abort controllers, request dedupe)
  - uncontrolled/controlled input mismatch
  - router state sync issues
  - CSS specificity/layout constraints

4) Verify
- Run FE tests/lint/typecheck if available.
- Validate with a checklist:
  - desktop + mobile breakpoint
  - main browsers used by the project
  - reload/back/forward behavior
  - empty/loading/error states

## Output format
- Repro steps
- Root cause (1 paragraph)
- Fix summary
- Files changed
- Verification (commands + manual checklist)

## Triggers
- “This button does nothing / spinner never stops / modal won’t close”
- “UI crashes on this route”
- “State resets unexpectedly”
