---
name: api-contract-guard
description: Use when adding or modifying API endpoints. Enforce a clear request/response contract, validation, errors, auth, pagination, and backwards compatibility.
metadata:
  short-description: API changes with strict contracts + safe evolution.
---

# API Contract Guard

## Mission
Design or change APIs with strong contracts: validate inputs, define consistent errors, keep compatibility, and cover with tests.

## Non-negotiables
- Define request/response schema and error model explicitly.
- Validate inputs at the boundary; never trust upstream.
- Backwards-compatible changes by default (unless the user requests a breaking change).

## Workflow
1) Contract definition
- Specify endpoint, method, auth requirements, and status codes.
- Define schemas (fields, types, required/optional, defaults).
- Define error shape (code, message, details), and map to status codes.

2) Validation + security
- Validate body/query/path; reject unknown fields if the project standard is strict.
- AuthZ: verify role/ownership checks.
- Prevent common issues: injection via parameterization, SSRF controls for outbound calls, rate limiting hooks if present.

3) Compatibility
- Add fields rather than rename/remove.
- If renaming is required: dual-write/dual-read with deprecation notes.

4) Tests
- Add request validation tests and at least one auth test.
- Add a happy-path + one failure-path test per endpoint change.

## Output format
- Contract summary (request/response/error)
- AuthZ notes
- Compatibility notes
- Tests added
- Commands run + results
