---
title: contextlint-fix Skill
description: The role and behavior of the Skill that resolves violations while respecting the boundary between mechanical fixes and human judgment.
---

`contextlint-fix` is the Skill for **fixing** violations contextlint detects. It's invoked automatically when AI receives requests like "fix lint" or "fix the broken links".

## Why this Skill exists

Document integrity quietly breaks during refactors, file renames, and bulk AI edits. Even when CI flags violations, fixing them by hand one at a time is heavy work, and it's easy to put off.

`contextlint-fix` removes that friction, but it strictly upholds one design principle: **never silently make a meaning-changing edit**. Fixes fall into two categories with different handling:

- **Mechanical fixes** (typos, missing headings, filler in empty cells) — applied automatically
- **Semantic judgments** (deleting references, fabricating values, marking checklists complete, severing the graph) — always confirmed with you

The most important constraint of this Skill is that AI never quietly changes meaning.

## Trigger conditions

The Skill triggers on requests like the following. You don't need to mention it by name.

- "Fix lint" / "Fix the lint errors" / "contextlint is throwing errors, fix them"
- "Fix the broken links" / "Tidy up the docs" / "Clean up the docs before commit"

It also triggers when contextlint isn't named explicitly, e.g. "fix the document integrity issues".

## Behavior

### 1. Verify setup

The Skill first checks that `contextlint.config.json` and `@contextlint/cli` are available. If not set up, it points you to the [contextlint-init Skill](/docs/integrations/ai-agents/skill-init/) and stops.

### 2. Run lint

```sh
npx contextlint --format json
```

`--format json` gives the Skill machine-readable output so it can iterate violation by violation. In environments where the MCP server is available, the Skill calls the `lint` tool directly and skips the JSON parse.

### 3. Per-category fix strategy

| Rule prefix | Auto-fixed | Confirmed with you |
| --- | --- | --- |
| **REF-\*** | Corrects link target IDs that look like typos | Cases where the reference target genuinely doesn't exist (was it deleted, or renamed?) |
| **SEC-\*** | Adds missing sections with a `<!-- TODO -->` marker | — |
| **TBL-\*** | Inserts `TODO` into empty cells | Allowed-value violations (no fabricating values) |
| **STR-\*** | Creates missing files with a placeholder | — |
| **CHK-\*** | — | Doesn't tick checkboxes on its own |
| **CTX-\*** | — | Resolving placeholders requires human judgment |
| **GRP-\*** | — | Circular references and orphans need confirmation due to cross-file ripple effects |

The line is: skeleton-building is the Skill's job, and filling in content is yours. For example, when a section is missing, the Skill adds the heading but leaves a `<!-- TODO -->` in the body — the form is satisfied, but the "incomplete" signal stays.

### 4. Re-lint to confirm

After applying fixes, the Skill re-runs `npx contextlint` to confirm whether the violation count reaches zero. If it doesn't, what remains should only be items that need your judgment.

### 5. Present a summary

The Skill closes by separating "fixed automatically" from "needs your attention".

```
Done:
  - Corrected 3 typo'd cross-refs in design.md
  - Added a Consequences section to adr/0005.md (with a TODO placeholder)

Needs your attention:
  ? FR-101 is referenced from design.md but no definition was found — drop the reference, or define the requirement?
  ? Circular reference between architecture.md and overview.md — which is the source of truth?
```

Decisions stay with you; the Skill's role is to organize the material on which you'll decide.

## Behavior with high violation counts

If more than 50 violations are detected, the Skill won't bulk-fix them. It presents a per-category summary first and asks "auto-fix everything, or scope down?". When AI rewrites a lot of files, it gets hard for you to review the diff, so the Skill gives you a knob for the application granularity.

## Edge cases

- **`@contextlint/cli` not installed** — the Skill points you at `contextlint-init` or proposes running `npm install -D @contextlint/cli`.
- **Cross-file rules return empty results** — verifies the `include` patterns cover the cross-ref targets. A narrow `include` silently skips REF-002 and TBL-006.
- **MCP server available** — preferred over CLI JSON parsing.

## Related

- If the target repo isn't yet set up, use the [contextlint-init Skill](/docs/integrations/ai-agents/skill-init/).
- To understand the source of violations and the propagation of fixes ahead of time, use the [contextlint-impact Skill](/docs/integrations/ai-agents/skill-impact/).
- For per-rule specs, see [Rules](/docs/rules/).
