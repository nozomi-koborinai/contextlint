---
title: contextlint-init Skill
description: The role and behavior of the Skill that bootstraps contextlint into a repository.
---

`contextlint-init` is the Skill for **bootstrapping contextlint into a repository**. It's invoked automatically when AI receives requests like "set up contextlint" or "set up a lint environment".

## Why this Skill exists

contextlint has 21 rules spread across seven categories. Reading all of them on first contact and deciding which to enable is a heavy lift, and the friction often leads people to abandon adoption.

`contextlint-init` removes that wall by **scanning the repository's actual structure before proposing a configuration**. Instead of you picking from 21 rules by hand, AI inspects document layout, style, and reference patterns, and infers a rule set that fits your project.

## Trigger conditions

The Skill triggers on requests like the following. You don't need to mention it by name.

- "Set up contextlint" / "Add contextlint"
- "I want to add a Markdown linter" / "Add document integrity checks"
- "Set up a lint environment" / "lint setup"

It also triggers when contextlint isn't named explicitly but the context is around document integrity checks.

## Behavior

The Skill runs the steps below in order.

### 1. Detect existing setup

It first checks for `contextlint.config.json` in the repository root or any parent directory. If found, the Skill offers these choices:

| Choice | Behavior |
| --- | --- |
| `overwrite` | Regenerate from scratch |
| `add` | Keep the existing config and propose new rule additions based on the fresh scan |
| `skip` | Do nothing |

It refuses to overwrite an existing config without asking, to avoid breaking previously tuned rules or assumptions baked into a passing CI.

### 2. Detect the package manager

Determined from lock files in priority order:

| Lock file | Manager |
| --- | --- |
| `bun.lock` / `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` | npm |
| (none) | Falls back to npm |

### 3. Detect the document layout

Instead of hardcoding `docs/`, the Skill walks typical layouts like `documentation/`, `specs/`, `adr/`, `decisions/`, `requirements/`, `architecture/`, and `notes/`. Any directory containing 3 or more Markdown files becomes a "doc cluster" candidate, and directories whose names match a documentation context are prioritized. Project-meta files like `README.md` and `CHANGELOG.md` are detected but not included in the lint target by default.

For monorepos, layouts like `packages/*/docs/` are also detected and included.

### 4. Sample document content

The Skill reads 3–5 files from each detected cluster and looks for these signals. To avoid burning context, it doesn't read every file.

| Observed pattern | Suggested rule |
| --- | --- |
| Cross-references like `[link](file.md#anchor)` | REF-001 |
| Tables with an `ID` column | TBL-001 + TBL-002 |
| Repeating heading triplets (e.g. `## Context` / `## Decision` / `## Consequences`) | SEC-001 |
| Heavy use of checklists | CHK-001 |
| Placeholders like `TODO`, `TBD`, `<pending>` | CTX-001 |
| Frequent bidirectional references between files | GRP-002 |

REF-001 and GRP-002 are proposed as **always-on** baselines. Detecting broken links and circular references is useful regardless of repo type.

### 5. Propose configuration and confirm with you

The Skill presents the inferred configuration as a draft `contextlint.config.json`, with a one-line rationale per rule. You'll see explanations grounded in observation, like "Saw the Context/Decision/Consequences trio repeated in the ADR directory, so suggesting SEC-001."

It never writes the configuration without confirmation, in case the AI's observations were off or you intentionally want to drop a specific rule.

### 6. Install and run the first lint

Once you approve, the Skill installs `@contextlint/cli` with the detected package manager and writes `contextlint.config.json`. It then runs `npx contextlint` once so you can see the current violations. The setup leaves you with a clear picture of "what's where" the moment installation finishes.

### 7. Optional extras

CI and README changes affect the whole team, so the Skill asks for separate permission for each before writing.

- **GitHub Actions workflow** — generates `.github/workflows/contextlint.yml` (pull_request trigger, runs `npx contextlint`)
- **README section** — appends a short block stating that the project uses contextlint

Both are optional and never run without confirmation.

## Edge cases

- **Repos with only README.md** — contextlint's value lies in cross-file integrity, so the Skill suggests waiting until structured documentation exists.
- **Multiple lock files coexist** — the Skill picks the most recently updated one or asks you.
- **Existing config in a parent directory** — assumes a monorepo and respects the upper-level config; doesn't create a duplicate at the same level.
- **Non-GitHub Actions CI** — for GitLab CI, CircleCI, etc., the Skill skips generating `.github/workflows/` and just notes that "you can wire `npx contextlint` into any CI for the same effect."

## Related

- For the shortest path to setup, see [Quick Start — AI integration](/docs/get-started/quick-start-ai/).
- Detected violations can be handed off to the [contextlint-fix Skill](/docs/integrations/ai-agents/skill-fix/).
- For the structure of the resulting config file, see [Config file](/docs/configuration/config-file/).
