---
name: db-migration-safe
description: Use for schema changes and migrations. Plan safe rollouts: additive changes, backfills, indexes, constraints, and rollback strategy.
metadata:
  short-description: Zero/low-downtime schema changes + rollback plan.
---

# Safe DB Migration

## Mission
Apply schema changes safely with minimal downtime and predictable rollbacks.

## Non-negotiables
- Prefer additive migrations (add columns/tables/indexes) over destructive.
- For breaking changes: use expand → migrate → contract approach.
- Provide a rollback strategy or explain why rollback is unsafe.

## Workflow
1) Assess change type
- Additive (safe): new column nullable, new table, new index (concurrently if supported).
- Potentially breaking: dropping/renaming columns, changing types, adding NOT NULL, unique constraints.

2) Expand phase
- Add new schema elements without breaking existing reads/writes.
- If needed, add application support for both old and new fields.

3) Backfill phase
- Backfill data in batches (avoid long locks).
- Ensure idempotent backfill logic.

4) Contract phase
- Enforce constraints only after backfill (NOT NULL/UNIQUE).
- Remove deprecated fields only after a safe window.

5) Verification
- Add migration tests if the project supports them.
- Validate query plans for new indexes where relevant.

## Output format
- Migration plan (expand/backfill/contract)
- Rollback plan
- Files changed (migrations + app code)
- Commands run + results
