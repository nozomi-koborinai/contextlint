---
title: Quick Start — AI-assisted
description: Set up contextlint in the shortest path from an AI host such as Claude Code, Cursor, or Codex.
---

If you use an AI host that supports [agentskills.io](https://agentskills.io), the Skill route is the shortest path. Three steps and you're running lint.

## 1. Install the Skill

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

The `contextlint-init` Skill is registered as an available skill on your AI host. You can install `contextlint-fix` and `contextlint-impact` the same way, but `contextlint-init` alone is enough to start.

## 2. Ask the AI to set things up

Open your AI host inside the current repository and ask:

> Set up contextlint.

The AI invokes the `contextlint-init` Skill and runs through the following:

1. Detects where documents live in the repository (not just `docs/`, but also `specs/`, `adr/`, `decisions/`, etc.)
2. Infers the document style (ADR format / spec format / table-heavy / heavy placeholder use, and so on)
3. Proposes a rule set that fits the project
4. After confirmation, installs `@contextlint/cli` and writes `contextlint.config.json`

You don't need to pick rules by hand from the catalog of 21.

## 3. Run lint

Once the config is written, the AI runs lint for the first time and shows the result. If violations appear, you can follow up by asking the `contextlint-fix` Skill to suggest fixes.

If you'd rather run it yourself, the following command produces the same output.

```bash
npx contextlint
```

That completes the AI-assisted setup.

## Supported AI hosts

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- Other hosts that follow the [agentskills.io](https://agentskills.io) spec

## Next steps

- [Your first lint](/docs/get-started/your-first-lint/) — how to read lint output and common violation patterns
- For manual setup, see [Quick Start — Manual](/docs/get-started/quick-start-manual/)
