---
title: Per-file rule scoping
description: Use the files option to apply a rule only to a subset of files.
---

When you want to apply a rule "only to files matching a specific glob," use the rule's `files` option.

## Basics

```json
{
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    }
  ]
}
```

This config applies SEC-001 (required sections) only to `decisions/*.md`. Other files are not subject to SEC-001.

## Syntax

The `files` option accepts a single glob pattern (one string). It is internally expanded to `**/${files}`, so a relative path is enough to match deeply nested locations.

```json
{ "rule": "sec001", "options": { "files": "decisions/*.md" } }
```

This is equivalent to `**/decisions/*.md`, which matches a `decisions/` directory anywhere in the repository.

## When to use it

- **Enforce an ADR template only in the ADR folder** — require `Context / Decision / Consequences` for `decisions/*.md`
- **Enforce a spec template only in the specs folder** — require `Overview / API / Examples` for `specs/*.md`
- **Strict on new directories, lenient on legacy ones** — roll out integrity checks gradually

## Relationship with include

[include](/docs/configuration/include-patterns/) narrows the **set of files validated overall**. `files` narrows the **scope of an individual rule** within that set. The two can be combined.

## Supported rules

Supported by TBL-001 to TBL-005, SEC-001, SEC-002, the REF-\* family, CTX-001, and CTX-002. See [Rules](/docs/rules/) for details on each rule.
