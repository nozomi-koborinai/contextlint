---
title: Quick Start — Manual
description: Set up contextlint by hand using the CLI directly.
---

Use these steps if you don't have an AI host, or you want to manage the configuration entirely yourself. Three commands and you're running lint.

## 1. Install

The shortest install command is:

```bash
npm install -D @contextlint/cli
```

For bun / pnpm / yarn, see [Installation](/docs/get-started/installation/).

## 2. Generate a config interactively

Running `contextlint init` walks you through an interactive prompt and produces a `contextlint.config.json` tailored to your project.

```bash
npx contextlint init
```

After answering the questions, a config file similar to the following is written to the repository root.

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "grp002" }
  ]
}
```

Each field is described in detail under [Configuration](/docs/configuration/). You're free to edit the file by hand afterwards.

## 3. Run lint

```bash
npx contextlint
```

contextlint walks up from the current directory looking for `contextlint.config.json`, and once found, validates Markdown according to its `include` patterns. Passing target files as CLI arguments overrides the config's `include`.

```bash
npx contextlint "specs/**/*.md"
```

## Next steps

- [Your first lint](/docs/get-started/your-first-lint/) — how to read the output and common violation patterns
- If you'd rather set up from an AI host, see [Quick Start — AI-assisted](/docs/get-started/quick-start-ai/)
