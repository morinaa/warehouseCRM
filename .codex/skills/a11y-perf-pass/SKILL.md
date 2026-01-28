---
name: a11y-perf-pass
description: Use to improve front-end accessibility and performance without redesigning. Focus on semantics, keyboard support, contrast, reduced motion, and low-hanging perf fixes (renders, memoization, bundles).
metadata:
  short-description: Accessibility + performance hardening pass.
---

# Accessibility + Performance Pass

## Mission
Improve accessibility and responsiveness using practical, measurable fixes.

## Non-negotiables
- No “big rewrites”; make targeted improvements.
- Preserve existing UX unless an issue blocks accessibility.
- Prefer standards-based fixes: semantic HTML first, ARIA only when necessary.

## Accessibility checklist (apply as relevant)
- Semantics: correct elements (button/a/label/form), headings order.
- Keyboard: tab order, focus visibility, escape to close modals, focus trap in dialogs.
- Names: accessible name for inputs/buttons/icons (label, aria-label).
- State: aria-expanded/aria-selected/aria-invalid where applicable.
- Images: alt text or empty alt for decorative.
- Motion: respect prefers-reduced-motion.
- Color: avoid meaning by color alone; ensure contrast where easy.

## Performance checklist (apply as relevant)
- Reduce wasted re-renders: stable props, memo where it actually helps.
- Avoid expensive work in render; move to memo/derived selectors.
- Async: debounce/throttle input-driven fetches; cancel stale requests.
- Bundle: lazy-load routes/modals; remove unused deps where obvious.
- Lists: virtualization for large lists (if present), stable keys.

## Output format
- Issues found (grouped: A11y, Perf)
- Fixes applied
- Files changed
- Verification (what you ran + what you manually checked)
