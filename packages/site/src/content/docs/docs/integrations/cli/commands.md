---
title: Commands
description: Behavior and usage of contextlint, contextlint init, and contextlint compile.
---

This page covers the three subcommands you'll use day-to-day: `lint` (default), `init`, and `compile`. For the graph-related subcommands (`impact` / `slice` / `graph`), see [Concepts](/docs/concepts/).

## `contextlint` (lint, default)

When run without arguments, contextlint validates every Markdown file matching the `include` patterns in your config (or any glob you pass on the CLI).

```bash
# Lint according to the include patterns
npx contextlint

# Lint specific files / globs (overrides include)
npx contextlint "docs/**/*.md"

# Specify the config path explicitly
npx contextlint --config contextlint.config.json
```

For how the target set is resolved (CLI args → `include` → default), see [include patterns](/docs/configuration/include-patterns/).

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No violations, or warnings only |
| `1` | One or more errors |
| `2` | Runtime error such as missing config or parse error |

To block a PR in CI, treat exit code `1` as a failure — any error will fail the job.

## `contextlint init`

Generates `contextlint.config.json` interactively. Just pick a language, include patterns, and rule categories, and the command writes a config with all zero-config rules pre-enabled.

```bash
npx contextlint init
```

The interactive flow has four steps:

1. **Language selection** — English / Japanese / Chinese / Korean
2. **Include pattern input** — comma-separated for multiple patterns (default `**/*.md` if blank)
3. **Rule category selection** — checkbox-style selection across TBL / SEC / STR / REF / CHK / CTX / GRP
4. **Existing file overwrite confirmation** — only if `contextlint.config.json` already exists

The generated config contains only rules that need no extra options, so add per-rule `options` manually as needed. See [Config file](/docs/configuration/config-file/) and [Rules](/docs/rules/) for details.

If you're working with an AI host, you can also use the `contextlint-init` Skill, which scans the repository structure and chooses rules for you. See [Get Started → Installation](/docs/get-started/installation/).

## `contextlint compile`

Compiles the documents and active rules into a deterministic `SKILL.md` file, intended for use as a Claude Code custom skill.

```bash
# Generate SKILL.md
npx contextlint compile

# Preview output without writing
npx contextlint compile --dry-run

# Override the output directory
npx contextlint compile --outdir .claude/skills/my-skill
```

`compile` requires a `compile` section in `contextlint.config.json`. Running it without that section fails. For how to write the config and how the pipeline works, see [Concepts → Context Compiler](/docs/concepts/).
