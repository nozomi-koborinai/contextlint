---
title: CLI
description: Subcommands of the contextlint command and an index of CLI integration pages.
---

The `contextlint` command, provided by the `@contextlint/cli` package, runs the same way in local development and in CI. A single binary covers config auto-detection, watch mode, and machine-readable JSON output.

For installation, see [Get Started → Installation](/docs/get-started/installation/). This page is the entry point for what to do once it's installed.

## Subcommands

| Subcommand | Purpose |
| --- | --- |
| `contextlint` (default) | Lint Markdown documents |
| `contextlint init` | Generate `contextlint.config.json` interactively |
| `contextlint compile` | Compile documents and rules into a Claude Code SKILL.md |
| `contextlint impact <file>` | Analyze which documents are affected by changing a file |
| `contextlint slice <query>` | Extract the minimal set of documents related to a query |
| `contextlint graph` | Print the document dependency graph |

For arguments and options of each subcommand, see [Commands](/docs/integrations/cli/commands/).

## What's in this section

- [Commands](/docs/integrations/cli/commands/) — behavior and usage of `lint` / `init` / `compile`
- [Flags reference](/docs/integrations/cli/flags/) — `--config` / `--format` / `--watch` / `--cwd` and friends
- [Watch mode](/docs/integrations/cli/watch-mode/) — re-lint automatically when files change
- [JSON output](/docs/integrations/cli/json-output/) — the shape of `--format json` and how to use it in CI

## Sanity check

After installation, you can confirm the version with:

```bash
npx contextlint --version
```

`--version` and `--help` work without a config file, but actually linting requires `contextlint.config.json`. For how to write one, see [Configuration](/docs/configuration/).
