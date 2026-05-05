---
title: Spec-driven development repository
description: A contextlint setup that enforces requirement-to-spec-to-implementation traceability and stability management.
---

This recipe is for repositories that practice **spec-driven development (SDD)** — managing requirements, specs, and design as a single source of truth (SSOT) in Markdown, then having an AI or an engineer generate code from those documents.

contextlint enforces requirement-ID traceability, consistency of stability labels, and zone-level separation of concerns.

## Which projects it suits

- Documentation is **split by responsibility into zones**, e.g. `docs/zones/<feature>/`
- The requirements table has columns like `ID` / `Description` / `Stability` and identifies items with IDs like `REQ-AUTH-01`
- Requirement IDs are referenced repeatedly from spec, design, and test documents
- Requirements move through a lifecycle like `draft` → `review` → `stable`
- AI agents are involved in editing documents, which makes broken references more likely

This setup assumes the SDD layered structure (`foundation/` / `standards/` / `zones/`) introduced in the [contextlint introduction article](https://koborin.ai/tech/contextlint-introduction/), but it works just as well on a simpler `docs/specs/` flat layout — adjust the ID pattern and zone glob to match.

## Recommended config (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    {
      "rule": "tbl001",
      "options": {
        "files": "**/requirements.md",
        "requiredColumns": ["ID", "Description", "Stability"]
      }
    },
    {
      "rule": "tbl002",
      "options": {
        "files": "**/requirements.md",
        "columns": ["ID", "Stability"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/requirements.md",
        "column": "Stability",
        "values": ["draft", "review", "stable"]
      }
    },
    {
      "rule": "tbl004",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "pattern": "^REQ-[A-Z]+-\\d{2,3}$"
      }
    },
    {
      "rule": "tbl006",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "idPattern": "^REQ-"
      }
    },
    {
      "rule": "sec001",
      "options": {
        "files": "**/requirements.md",
        "sections": ["Business value", "Requirements"]
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md", "**/test_*.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-[A-Z]+-\\d+$"
      }
    },
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Stability",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md"]
      }
    },
    {
      "rule": "ref004",
      "options": {
        "zonesDir": "docs/zones",
        "dependencySection": "External zone dependencies"
      }
    },
    { "rule": "grp002" },
    {
      "rule": "ctx001",
      "options": {
        "files": "**/zones/**/*.md"
      }
    },
    {
      "rule": "ctx002",
      "options": {
        "glossary": "docs/foundation/glossary.md",
        "termColumn": "Term",
        "aliasColumn": "Alias",
        "files": "docs/zones/**/*.md"
      }
    }
  ]
}
```

## Why each rule was chosen

### TBL family — Guaranteeing the structure of the requirements table

The requirements table sits at the center of SDD, so once its structure breaks, the downstream rules (`ref002` / `ref003` / `grp001`, etc.) all become meaningless. The TBL family guarantees structure "from the box to the contents" in this order.

| Rule | What it guarantees |
| --- | --- |
| [TBL-001 Required columns](/docs/rules/tbl-001/) | The columns `ID` / `Description` / `Stability` exist |
| [TBL-002 Empty cells](/docs/rules/tbl-002/) | `ID` and `Stability` cells are non-empty |
| [TBL-003 Allowed values](/docs/rules/tbl-003/) | The `Stability` column is one of `draft` / `review` / `stable` |
| [TBL-004 Cell pattern](/docs/rules/tbl-004/) | `ID` follows the `REQ-AUTH-01` naming convention |
| [TBL-006 Cross-file ID uniqueness](/docs/rules/tbl-006/) | Requirement IDs are unique across the entire project |

`tbl004`'s `pattern` (`^REQ-[A-Z]+-\\d{2,3}$`) enforces a structure that includes the zone name (uppercase letters). For a flat ID scheme (`REQ-001`) without a zone segment, change `pattern` to `^REQ-\\d+$`.

### SEC-001 — Presence of business value and requirements sections

A requirements document needs both **why** the requirement exists (business value) and **what** it accomplishes (the requirements themselves) to be explainable to stakeholders. It's easy to write `Business value` and forget the requirements table, or vice versa, so enforce both mechanically.

[SEC-001 Required sections](/docs/rules/sec-001/) is scoped to `**/requirements.md`.

### REF-002 — Cross-file traceability of requirement IDs

If a requirement ID is never referenced from a spec, design, or test, that requirement may never have reached implementation. Conversely, if an undefined ID is referenced from a spec, it's a copy-paste mistake or a leftover stale ID. Validate traceability in both directions with a single rule.

[REF-002 ID definitions and references](/docs/rules/ref-002/) is a **project-scope** rule that extracts IDs from every document in `include`. Enumerate `spec_*.md` / `design_*.md` / `test_*.md` under `references` to verify each one references requirement IDs from the definition side.

For `idPattern`, use the strict form that includes the zone name (`^REQ-[A-Z]+-\\d+$`). This prevents header-row examples or explanatory text starting with `REQ-` from being picked up as IDs.

### REF-003 — Stability consistency

A `stable` spec referencing a `draft` requirement means "the spec has been finalized while the requirement hasn't been pinned down" — a contradiction. When a requirement changes after a demo or stakeholder review, it's important to know how far that change ripples into the specs, and the stability ordering is what makes that knowable.

[REF-003 Stability consistency](/docs/rules/ref-003/) compares the requirement's stability with the stability of the row that references it on the spec side, and reports inconsistencies like `stable` → `draft` as warnings.

### REF-004 — Making cross-zone dependencies explicit

A zone is a unit of responsibility, so a dependency from the `auth` zone to the `payment` zone should make the design intent — "auth depends on payment" — explicit. Physically, a Markdown link can cross zones with no friction, so this rule verifies that the intent is declared in `overview.md`.

[REF-004 Zone dependencies](/docs/rules/ref-004/) reads each zone's `overview.md`, treating its `External zone dependencies` section as the dependency declaration. The default for `dependencySection` is `Dependencies`; override it explicitly when your team uses a different heading.

### GRP-002 — Preventing cycles in the overall graph

This setup assumes references flow one way — requirement → spec → design → test — so the reference graph should be a DAG. Cycles across zones, or bidirectional links between requirements and specs, should be caught early.

[GRP-002 Circular references](/docs/rules/grp-002/) is included. GRP-001 (traceability chain) is a stronger rule that validates the requirement → spec → test chain at the ID level, but with many combinations of zones and stages, the `chain` config grows large quickly. Start by guaranteeing only the absence of cycles with GRP-002, and add stages incrementally.

### REF-001 / REF-005 — Protecting links and anchors

Cross-zone Markdown links, inheritance links to the foundation glossary, references from specs back to requirements — the integrity of an SDD setup rests on countless links. Guarantee both file existence (REF-001) and anchors (REF-005).

### CTX-001 — Placeholder detection (scoped to zones)

To prevent specs inside zones from reaching `Stability: stable` while still containing `TBD` or `TODO`, restrict placeholder detection to `docs/zones/**/*.md`. Don't apply it to `foundation/` or `standards/` documents — those may contain TBD during the initial bootstrap phase.

[CTX-001 Placeholder detection](/docs/rules/ctx-001/) is scoped via `files: "**/zones/**/*.md"`.

### CTX-002 — Consistency with the glossary

In SDD, `foundation/glossary.md` operates as the "ubiquitous language", so each zone's documentation must use the canonical term from the glossary. AI-generated drafts tend to introduce aliases, and deterministic detection works well against this.

[CTX-002 Term consistency](/docs/rules/ctx-002/) uses the glossary's `Term` column as the canonical form and `Alias` column as aliases. The glossary is expected to look like this.

```markdown
# Glossary

## Terms

| Term     | Alias            |
| -------- | ---------------- |
| database | DB, datastore    |
| user     | account, member  |
```

### Rules deliberately omitted from this recipe

| Rule | Why it's omitted |
| --- | --- |
| SEC-002 | `requirements.md` rarely benefits from a fixed section order (add it if your template strongly enforces one) |
| TBL-005 | TBL-003 / TBL-004 already cover stability and ID; add TBL-005 only when there are cross-column rules like "if `Stability=stable`, `Approver` must be present" |
| GRP-001 / GRP-003 | The `chain` config grows large with many zones and stages; add these once the project stabilizes |
| STR-001 | Requiring files like `docs/foundation/glossary.md` is effectively enforced via the `glossary` option of CTX-002 |

## Operational notes

### Introducing this into an existing repository

Applying this recipe in one shot to a repository with many SDD documents will produce a flood of violations from requirement-ID pattern mismatches and missing zone-dependency declarations. A phased rollout in this order is more realistic.

1. **TBL-001 / TBL-002 / TBL-003 / TBL-004** — pin down the structure of the requirements table first
2. **TBL-006** — resolve ID duplicates
3. **REF-001 / REF-005** — fix links and anchors
4. **REF-002** — clean up traceability violations (work through warnings incrementally)
5. **REF-003 / REF-004 / GRP-002** — structural integrity
6. **CTX-001 / CTX-002** — finishing touches on contextual quality

Splitting commits per step makes review and revert much easier. Don't try to clear all warnings at once — aim to bring errors down to zero first.

### Coordinating with AI agents

When AI agents edit documentation, run `lint-files` over MCP after each edit, or wire `npx contextlint` into Claude Code Hooks so the agent itself can detect and fix violations. For details, see [AI agents integration](/docs/integrations/ai-agents/).

### Gating in CI

Requirement and spec changes typically flow through pull requests, so a `pull_request` trigger with a `docs/**` path filter is efficient. For concrete workflow examples, see [CI integration patterns](/docs/recipes/ci-integration-patterns/).

### Adding chain validation (GRP-001)

When there is an explicit staged structure such as requirement → spec → test plan, and you want to enforce coverage at every stage, add GRP-001. For a `chain` config example, see the [GRP-001 Traceability chain](/docs/rules/grp-001/) page.
