---
name: surgical-refactor
description: Use when the user asks to refactor, restructure, rename, or “clean up” code while keeping behavior identical and tests passing.
metadata:
  short-description: Safe, incremental refactors with verification.
---

# Surgical Refactor (behavior-preserving)

## Mission
Make structural improvements (readability, modularity, naming, duplication removal) without changing external behavior.

## Non-negotiables
- Preserve runtime behavior and public APIs unless the user explicitly asks to change them.
- Keep diffs small and reviewable; prefer multiple tiny steps over one big rewrite.
- Verification is part of the work: run existing checks/tests relevant to touched areas.

## Workflow
1) **Lock the goal + constraints**
   - Restate the refactor objective in one sentence.
   - Identify what must not change: public functions, routes, schemas, CLI flags, serialized formats, etc.
   - If anything is ambiguous, ask one targeted question before editing.

2) **Map the blast radius (fast)**
   - Identify entrypoints calling the code (search for symbol usages, routes, imports, etc.).
   - Note the boundaries: files/modules to touch, and files explicitly out of scope.

3) **Create a baseline**
   - Ensure a clean working tree or clearly describe local changes.
   - Run the project’s standard verification command(s) if available (tests/lint/build), or at least the smallest relevant subset.
   - Record what was run and the result.

4) **Refactor in micro-steps**
   - Use a sequence like:
     - rename identifiers → extract helpers → move files/modules → remove duplication → tighten types → simplify logic
   - After each micro-step:
     - re-run the smallest relevant verification (or at minimum a quick compile/typecheck).
     - stop and fix immediately if anything breaks.

5) **Guardrails for correctness**
   - Don’t mix refactor + feature changes in the same diff unless requested.
   - Keep control flow identical unless you can prove equivalence (and tests support it).
   - Preserve logging/metrics semantics unless asked.

6) **Finish strong**
   - Run the project’s main verification command(s) again (or the best available approximation).
   - Summarize changes: what moved/renamed, what got simpler, and why it’s safe.

## Output format (always)
- “What I changed” (2–6 bullets)
- “Files touched”
- “Commands run + results”
- “Notes / follow-ups” (only if needed)

## Example prompts that should trigger this skill
- “Refactor this module to be easier to read without changing behavior.”
- “Split this file into smaller components but keep the API the same.”
- “Rename these classes/functions across the codebase safely.”
