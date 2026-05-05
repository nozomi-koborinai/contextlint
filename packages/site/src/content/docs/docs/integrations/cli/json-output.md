---
title: JSON output
description: Machine-readable output via --format json and how to use it in CI.
---

When you pass `--format json`, contextlint writes machine-readable JSON to stdout instead of human-friendly text. Use it for CI annotations, editor extension feedback, and feeding into your own reporting tools.

## Basics

```bash
npx contextlint --format json
```

## Output shape

The JSON output of the `lint` (default) subcommand is a flat array of violations.

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  },
  {
    "file": "docs/design.md",
    "line": 24,
    "severity": "warning",
    "message": "Empty cell in column \"Status\"",
    "ruleId": "TBL-002"
  }
]
```

Each element has these fields:

| Field | Type | Description |
| --- | --- | --- |
| `file` | string | Relative path of the file where the violation was found |
| `line` | number | Line number of the violation (1-based) |
| `severity` | `"error"` / `"warning"` | Severity |
| `message` | string | Description of the violation |
| `ruleId` | string | Hyphenated rule ID (e.g. `TBL-001`) |

If there are no violations, the output is an empty array `[]`.

## Using it in CI

JSON output works well for GitHub Actions annotations, or as the payload for Slack / Discord notifications.

### Built-in GitHub Actions

The Composite Action shipped with the repository runs contextlint with `--format json` and converts the results into PR inline annotations. For configuration examples, see [CI/CD → GitHub Actions](/docs/integrations/ci-cd/).

### Processing it with your own scripts

A simple example using `jq` to count violations:

```bash
npx contextlint --format json | jq 'length'
# => 2
```

You can also count violations per rule:

```bash
npx contextlint --format json | jq 'group_by(.ruleId) | map({rule: .[0].ruleId, count: length})'
```

## JSON output for graph subcommands

`impact`, `slice`, and `graph` also accept `--format json`, but their output structure differs from `lint`. For example output, see [Concepts](/docs/concepts/).
