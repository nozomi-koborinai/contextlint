---
title: Your first lint
description: How to read contextlint's output and common violation patterns.
---

Once setup is complete, run lint for real.

## Run

```bash
npx contextlint
```

Every Markdown file matched by the glob patterns in `include` of `contextlint.config.json` is validated.

## Reading the output

When violations are found, the output looks like this:

```text
docs/requirements.md
  line 12  error    Link target "./api.md" does not exist  REF-001
  line 24  warning  Empty cell in column "Status"          TBL-002

docs/architecture.md
  line 5   error    Required section "Decision" is missing  SEC-001

2 errors, 1 warning in 2 files
```

Each violation has the following fields:

- **File path** — the file where the violation was found
- **line** — the line number of the violation
- **error / warning** — severity
- **Message** — what the problem is
- **Rule ID** — which rule was triggered (see [Rules](/docs/rules/) for details)

If there are no violations, the output is:

```text
No issues found.
```

In this state, contextlint exits with code 0 in CI. With violations, it exits with code 1, which makes it suitable as a PR gate.

## Common violation patterns

### REF-001 — Broken link

Triggered when a link to a file, or an in-file anchor (`#section-name`), can't be resolved.

- The target file was renamed or moved
- The section the anchor pointed to was deleted or renamed
- The relative path is wrong

### SEC-001 — Missing required section

Triggered when a section marked as required in the config is not present in the target file.

- The ADR template requires `Context / Decision / Consequences`, but a new ADR is missing one
- The spec template requires `Overview / API / Examples`, but the file ends after the overview

### TBL-002 — Empty cell in a table

Triggered when a column configured as "must not be empty" contains an empty cell.

- A row was added to the requirements table with the `Status` column left empty

For the rest of the rule catalog, see [Rules](/docs/rules/). There are 21 rules, and each one has its own page describing what it detects and how to configure it.

## Fixing violations

The `contextlint-fix` Skill lets the AI propose fixes for violations in bulk along with suggestions. To install the Skill, see [Quick Start — AI-assisted](/docs/get-started/quick-start-ai/).

To fix violations by hand, use the file path and line number in the output to find the spot.

## Next steps

- [Configuration](/docs/configuration/) — full reference for `contextlint.config.json`
- [Rules](/docs/rules/) — individual reference for all 21 rules
- [Integrations](/docs/integrations/) — editor / CI / AI integrations
