---
title: Config auto-detection
description: Parent directory traversal via findConfig.
---

When the CLI runs, contextlint auto-detects `contextlint.config.json` by walking from the current directory up through its parents. You don't need to pass the config path every time.

## Behavior

1. Look for `contextlint.config.json` in the directory the CLI was run from (cwd)
2. If not found, move up to the parent directory
3. Continue walking up until the filesystem root (`/`)
4. Once found, treat that location as the "repository root"

## Behavior in a monorepo

The same behavior applies to bun workspace and pnpm workspace monorepos. Even when run from inside a package, contextlint finds the `contextlint.config.json` at the repository top.

```text
my-monorepo/
├── contextlint.config.json    ← place it here
├── packages/
│   ├── api/
│   │   └── docs/
│   │       └── README.md
│   └── web/
│       └── docs/
│           └── README.md
```

Running `npx contextlint` inside `packages/api/` still loads `my-monorepo/contextlint.config.json`. Glob patterns are resolved relative to the directory holding the config file (`my-monorepo/` in this example).

## When no config file is found

If no config file is found, contextlint runs with default settings. Since no rules are enabled, nothing is detected — but the run does not error out.

In CI, when you want to make "config file is required" explicit, the most reliable approach is to pass the path explicitly with the `--config` flag.

```bash
npx contextlint --config ./contextlint.config.json
```
