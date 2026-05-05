---
title: Installation
description: Two ways to install contextlint in your project.
---

contextlint offers **two installation paths**. If you already use an AI host (Claude Code / Cursor / Codex, etc.), the **Skill route is the fastest**. Otherwise, set things up manually via the **CLI**.

## Skill route (recommended)

If you use an AI host that supports [agentskills.io](https://agentskills.io), a single `gh skill install` command is all it takes.

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

After that, just ask the AI:

> Set up contextlint.

The AI analyzes your repository, reads its document layout and style (ADR format / spec format / table-heavy / and so on), and generates a `contextlint.config.json` tailored to the project. You don't need to pick rules by hand from the catalog of 21.

**Supported AI hosts:**

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- Other hosts that follow the [agentskills.io](https://agentskills.io) spec

**Prerequisite:** GitHub CLI (`gh`) must be installed. If you don't have it yet, see the [GitHub CLI website](https://cli.github.com/).

## CLI route (manual)

If you don't use an AI host, or you want to manage configuration entirely by hand, install the `@contextlint/cli` package directly.

### By package manager

contextlint is published on the npm registry. Run whichever command matches your project's package manager.

```bash
# bun
bun add -D @contextlint/cli

# pnpm
pnpm add -D @contextlint/cli

# yarn
yarn add -D @contextlint/cli

# npm
npm install -D @contextlint/cli
```

We recommend adding it as a dev dependency (`-D` or `--save-dev`), since it isn't needed in production builds.

### Global install (optional)

If you use contextlint frequently across multiple projects, a global install is also fine.

```bash
# bun
bun add -g @contextlint/cli

# npm
npm install -g @contextlint/cli
```

That said, if you want to pin the dependency version per project, **a project-local install (`-D`) is safer**. It guarantees the same behavior in CI as well.

### Verify

If the version prints, the install worked.

```bash
npx contextlint --version
```

## Next steps

- [Quick Start — AI-assisted](/docs/get-started/quick-start-ai/) — run `init` from a Skill and finish setup in the shortest path
- [Quick Start — Manual](/docs/get-started/quick-start-manual/) — generate the config interactively with `contextlint init`
