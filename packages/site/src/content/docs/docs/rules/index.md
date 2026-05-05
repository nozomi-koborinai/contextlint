---
title: Rules
description: Reference for all 21 contextlint rules.
---

contextlint ships **21 rules** organized into 7 categories. Each rule is registered by ID in the `rules` array of `contextlint.config.json`.

## Categories

| Prefix | Category | What it validates |
|--------|----------|-------------------|
| **TBL** | Table | Table content: required columns, empty cells, allowed values, patterns, cross-column constraints, cross-file ID uniqueness |
| **SEC** | Section | Existence and order of section headings |
| **STR** | Structure | Project-level file existence |
| **REF** | Reference | Links, anchors, cross-file ID references, stability consistency, zone dependencies, image references |
| **CHK** | Checklist | Checklist completion status |
| **CTX** | Context | Placeholder detection, term consistency |
| **GRP** | Graph | Document dependency graph: traceability chains, circular references, orphan documents |

## All 21 rules

### TBL — Table (6)

- [TBL-001 Required columns](/docs/rules/tbl-001/)
- [TBL-002 Empty cells](/docs/rules/tbl-002/)
- [TBL-003 Allowed values](/docs/rules/tbl-003/)
- [TBL-004 Cell pattern](/docs/rules/tbl-004/)
- [TBL-005 Cross-column constraints](/docs/rules/tbl-005/)
- [TBL-006 Cross-file ID uniqueness](/docs/rules/tbl-006/)

### SEC — Section (2)

- [SEC-001 Required sections](/docs/rules/sec-001/)
- [SEC-002 Section order](/docs/rules/sec-002/)

### STR — Structure (1)

- [STR-001 Required files](/docs/rules/str-001/)

### REF — Reference (6)

- [REF-001 Broken links](/docs/rules/ref-001/)
- [REF-002 ID definitions and references](/docs/rules/ref-002/)
- [REF-003 Stability consistency](/docs/rules/ref-003/)
- [REF-004 Zone dependencies](/docs/rules/ref-004/)
- [REF-005 Anchors](/docs/rules/ref-005/)
- [REF-006 Image references](/docs/rules/ref-006/)

### CHK — Checklist (1)

- [CHK-001 Unchecked items](/docs/rules/chk-001/)

### CTX — Context quality (2)

- [CTX-001 Placeholder detection](/docs/rules/ctx-001/)
- [CTX-002 Term consistency](/docs/rules/ctx-002/)

### GRP — Graph (3)

- [GRP-001 Traceability chain](/docs/rules/grp-001/)
- [GRP-002 Circular references](/docs/rules/grp-002/)
- [GRP-003 Orphan documents](/docs/rules/grp-003/)

## Structure of each rule page

1. **Overview** — what it detects
2. **Why it matters** — what problem it prevents
3. **Options** — configurable fields
4. **Bad example and fix** — Bad → Good
5. **Related rules**

## How to configure

Each rule is registered in the `rules` array of `contextlint.config.json`.

```json
{
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

Rule IDs use the form `<prefix><number>` (3-digit zero-padded). See [Configuration](/docs/configuration/) for details.
