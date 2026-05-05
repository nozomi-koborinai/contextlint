---
title: ADR-style repository
description: A contextlint setup for running Architecture Decision Records as a template-driven workflow.
---

This recipe is for repositories that capture software architecture decisions as **ADRs (Architecture Decision Records)** in Markdown. It enforces a consistent template like `Context / Decision / Consequences` and keeps cross-references between ADRs from silently breaking.

## Which projects it suits

- ADRs are collected under a directory like `decisions/` or `docs/adr/`
- Each ADR follows a shared template such as `## Context` / `## Decision` / `## Consequences`
- ADRs reference each other as "supersedes" or "supplements"
- The number of ADRs has grown to the point that template drift and broken references can no longer be tracked by eye

For repositories adopting documentation integrity checks for the first time, this setup is attractive because `include` is scoped to `decisions/`, so **the side effects are easy to reason about**.

## Recommended config (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["decisions/**/*.md"],
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    },
    {
      "rule": "sec002",
      "options": {
        "files": "decisions/*.md",
        "order": ["Context", "Decision", "Consequences"],
        "level": 2
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "grp002" },
    {
      "rule": "tbl003",
      "options": {
        "column": "Status",
        "values": ["proposed", "accepted", "deprecated", "superseded"]
      }
    },
    { "rule": "ctx001" }
  ]
}
```

Limiting `include` to `decisions/` avoids false positives on the README and other operational documents. A table-of-contents file like `decisions/index.md` is expected to live in the same directory.

## Why each rule was chosen

### SEC-001 / SEC-002 — Enforcing the template

For ADRs, the template is not just a question of "are the sections there?" — the **order** in which they appear has a direct impact on the reader's cognitive load. If `Consequences` shows up before `Decision`, the reader sees the impact before the conclusion, making the document hard to review.

- [SEC-001 Required sections](/docs/rules/sec-001/) enforces the presence of `Context` / `Decision` / `Consequences`
- [SEC-002 Section order](/docs/rules/sec-002/) enforces the ordering (`level: 2` restricts the check to `##` headings, ignoring other heading levels in the body)

`files: "decisions/*.md"` scopes these rules. If you want to exclude special files like `decisions/index.md` or `decisions/template.md`, narrow the glob further or move them into a dedicated subdirectory.

### REF-001 / REF-005 — Protecting cross-references

ADRs naturally form a cross-reference graph — "ADR-012 supersedes ADR-005", and so on. Renames and deletions silently break these links, and markdownlint won't catch them. Validate both at the file level and at the anchor level.

- [REF-001 Broken links](/docs/rules/ref-001/) — checks that the referenced file exists
- [REF-005 Anchors](/docs/rules/ref-005/) — checks that an anchor fragment like `#decision` matches an actual heading

REF-005 is often skipped in lighter setups, but ADRs frequently use deep links like "see `ADR-012#decision`", so it's worth including.

### GRP-002 — Preventing supersede cycles

A linear chain like "ADR-012 supersedes ADR-005, and ADR-018 then supersedes ADR-012" is healthy. But if bidirectional links are added too liberally, you can end up with a **circular reference** like A → B → A. Cycles also break GRP-001 (traceability chain) and GRP-003 (orphan documents), so it's worth catching them early.

- [GRP-002 Circular references](/docs/rules/grp-002/) — guarantees that the link graph is a DAG

ADRs hold a temporal supersede relationship, so the graph should be a DAG by definition.

### TBL-003 — Constraining Status values

Many teams operate ADRs with a `Status` column restricted to `proposed` / `accepted` / `deprecated` / `superseded`. When only the example values are documented in the template and the actual rule stays implicit, custom values like `approved`, `done`, or `WIP` creep in over time.

- [TBL-003 Allowed values](/docs/rules/tbl-003/) — pins the `Status` column to those four values

This recipe assumes ADRs use a horizontal metadata table at the top with a `Status` column (`| Status | accepted |` is a vertical layout, which is different). For vertical layouts, drop TBL-003 and express the same constraint with TBL-005: "when `Field` is `Status`, `Value` must be in the allow-list".

### CTX-001 — Detecting TBD / TODO

An ADR is a **record** of a decision, not a working draft, so it should not reach `accepted` status with `TBD` or `TODO` left in the body. Detect leftover unresolved spots mechanically.

- [CTX-001 Placeholder detection](/docs/rules/ctx-001/) — detects leftover `TBD` / `TODO` / `WIP` and similar markers

If you want to allow `TBD` while an ADR is in `proposed` state, either narrow the target sections via the `section` option, or move proposed ADRs into a separate directory (e.g. `decisions/draft/`) and exclude that directory from `include`.

### Rules deliberately omitted from this recipe

| Rule | Why it's omitted |
| --- | --- |
| TBL-001 / TBL-002 / TBL-004 / TBL-006 | ADRs are body-text-centric; structural validation of an ID table matters less |
| REF-002 / REF-003 / GRP-001 | Not a setup for managing requirement-to-spec-to-implementation chains |
| CTX-002 | Overkill for an ADR-only repository without a glossary |
| REF-004 | ADRs typically aren't split into zones |
| STR-001 | Many teams don't rely on a single `decisions/index.md` and use the README as the entry point instead |

CTX-002 and REF-004 are worth adopting if you operate ADRs and specifications in the same repository. In that case, see the [Spec-driven development repository](/docs/recipes/spec-driven-development-setup/) recipe.

## Operational notes

### Introducing this into an existing repository

Applying this recipe in one shot to a repository that already has dozens of ADRs is likely to produce a flood of violations on the first run. Phasing the rollout in this order is more realistic.

1. **Enable `ref001` only** and fix broken links first
2. **Enable `sec001` while excluding `proposed` ADRs** — a single commit to fix template drift in existing ADRs
3. **Add `sec002`** — fix only the order changes
4. **Add `tbl003`** — clean up Status values
5. **Add `grp002` / `ctx001` / `ref005`** — the remaining structural integrity

To exclude on a per-file basis, use a negation pattern like `!decisions/legacy/**` in `include`, or move legacy ADRs into a separate directory like `decisions/archive/` and remove it from `include`.

### Gating in CI

ADRs are usually added and edited via pull requests, so a `pull_request` trigger with a path filter on `decisions/**` avoids unnecessary runs. For concrete workflow examples, see [CI integration patterns](/docs/recipes/ci-integration-patterns/).

### Excluding the template file

If you keep a layout template like `decisions/template.md`, that file will hold only empty section headings to satisfy SEC-001 / SEC-002, which makes the file an awkward special case.

- Recommended: rename `decisions/template.md` to `decisions/_template.md` and change `include` to `decisions/[!_]*.md`
- Alternative: move the template to a separate directory (`docs/templates/`)

The `include` glob is powered by picomatch, so a negated character class (`[!_]`) excludes files whose name begins with `_`. For details, see [Include patterns](/docs/configuration/include-patterns/).
