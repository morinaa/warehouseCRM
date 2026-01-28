---
name: fix-with-regression-test
description: Use when the user reports a bug, failing CI/test, or incorrect behavior; reproduce, add a minimal failing regression test, then implement the fix and verify.
metadata:
  short-description: Bugfixes anchored by regression tests.
---

# Fix With Regression Test

## Mission
Turn bug reports into permanent safety: a small failing test that proves the bug, then the smallest fix that makes it pass.

## Non-negotiables
- Prefer “test reproduces bug” → “fix” → “tests pass”.
- Keep the regression test minimal and deterministic (no sleeps, flaky timing, random seeds unless fixed).
- Don’t broaden scope: fix the reported behavior only.

## Workflow
1) **Clarify expected vs actual**
   - Restate the bug in one sentence: input → actual output → expected output.
   - If reproduction steps are missing, request the smallest missing detail (one question).

2) **Reproduce or simulate**
   - Try to reproduce locally (existing test, minimal script, or targeted command).
   - If you can’t reproduce reliably, document what you tried and pivot to writing a test that captures the report’s contract.

3) **Add a minimal failing test**
   - Put the test where the project’s existing tests live and follow local conventions.
   - Name it so future readers understand the bug scenario.
   - Assert only the key contract that was broken.
   - Confirm the new test fails for the right reason (record the failure).

4) **Implement the smallest fix**
   - Fix as close to the root cause as possible.
   - Avoid refactors unless required for the fix; if required, keep them tiny.

5) **Verify**
   - Re-run the failing test(s) until green.
   - Run the project’s standard verification command(s) (tests/lint/build) if available.
   - If this came from CI logs, ensure the fix addresses the failing step.

6) **Close the loop**
   - Explain root cause in plain language.
   - Explain why the fix is safe and what the regression test guarantees.

## Output format (always)
- “Reproduction summary”
- “Regression test added (what it covers)”
- “Root cause”
- “Fix summary”
- “Commands run + results”
- “Files changed”

## Example prompts that should trigger this skill
- “This endpoint returns 500 for valid input—fix it.”
- “CI is failing with this stack trace—make it green.”
- “We’re getting wrong totals in this function—debug and patch.”
