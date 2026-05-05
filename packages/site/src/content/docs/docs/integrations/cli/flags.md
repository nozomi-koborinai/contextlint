---
title: Flags reference
description: Available flags for the contextlint command and what they do.
---

A reference for the flags (options) available on each CLI subcommand. The set of flags differs by subcommand.

## Common flags

Available on every subcommand.

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `--config <path>` | Path | (auto-detected) | Explicit path to `contextlint.config.json` |
| `--cwd <path>` | Path | Current directory | Working directory used to resolve globs and paths |
| `--help` | — | — | Show help |
| `--version` | — | — | Show the version |

If `--config` is omitted, contextlint walks up from `--cwd` looking for `contextlint.config.json`. For details, see [Config auto-detection](/docs/configuration/auto-detection/).

## `lint` (default)

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `[files...]` | Glob list | — | Files / glob patterns to validate. Overrides the config's `include` |
| `--format <format>` | `human` / `json` | `human` | Output format |
| `--watch` | — | — | Re-lint automatically when files change |

For `--format` behavior see [JSON output](/docs/integrations/cli/json-output/), and for `--watch` see [Watch mode](/docs/integrations/cli/watch-mode/).

## `init`

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `--cwd <path>` | Path | Current directory | Output directory for the config file |

There are no options beyond the interactive mode entered when running with no arguments.

## `compile`

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `--outdir <path>` | Path | The config's `compile.outdir` (or `.claude/skills/contextlint`) | Output directory for SKILL.md |
| `--dry-run` | — | — | Print a summary of what would be generated without writing |

## `impact`

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `<file>` | Path (required) | — | Source file whose impact is being analyzed |
| `--format <format>` | `human` / `json` | `human` | Output format |

## `slice`

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `<query>` | Path / ID (required) | — | Query identifying the documents to extract |
| `--depth <depth>` | Non-negative integer | `2` | Maximum depth for graph traversal |
| `--format <format>` | `human` / `json` | `human` | Output format |

## `graph`

| Flag | Value | Default | Description |
| --- | --- | --- | --- |
| `--format <format>` | `human` / `json` | `human` | Output format |
