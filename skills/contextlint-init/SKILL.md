---
name: contextlint-init
description: Bootstrap contextlint into a repository. Use this skill whenever the user wants to set up, install, initialize, or configure contextlint — even if they only say "lint setup", "doc integrity check", or "set up Markdown linting" without naming contextlint by name. Detects the package manager (bun/npm/pnpm/yarn), scans the repo's actual doc layout (no hardcoded `docs/` assumption), infers a rule set tailored to the project's structure (ADR style, spec style, table-heavy, etc.), installs `@contextlint/cli`, and writes `contextlint.config.json`. Also handles existing contextlint setups and offers optional GitHub Actions workflow + README scaffolding.
license: MIT
compatibility: Requires bun, npm, pnpm, or yarn for installing @contextlint/cli. Network access needed to fetch the package from npm.
metadata:
  homepage: https://contextlint.dev
  source: https://github.com/nozomi-koborinai/contextlint
---

# contextlint-init

Bootstrap [contextlint](https://contextlint.dev) into a repository. The goal: take the user from "no doc lint" to "contextlint running with a sensibly tuned config" **without forcing them to read docs or hand-pick from 21 rules**.

> **Language note**: This skill is used across many languages. Respond to the user in their primary language (the one they're typing in). The English prompts and outputs below are reference templates — translate them to match the user's language at runtime.

## When to use this skill

- The user asks to "set up contextlint", "install contextlint", "init lint", "lint setup", "set up Markdown linting", "doc integrity check", or any equivalent phrasing
- After cloning or starting a doc-heavy repo (specs, ADRs, requirements, design docs)
- Even when the user doesn't name contextlint explicitly — they want the *outcome*, not the brand name

Triggering phrasings appear across many languages. A few illustrative samples (not exhaustive):

- English: "set up contextlint", "init markdown lint", "lint my docs"
- Japanese: "contextlint 入れて", "lint 環境整えて", "ドキュメントの整合性チェック導入したい"
- Chinese: "设置 contextlint", "添加 markdown 检查"
- Korean: "contextlint 설정해줘", "마크다운 린트 추가해"

## Why this skill exists

contextlint has 21 rules across 7 categories. Asking the user to read each one and pick is a non-starter — they will close the page. This skill closes that gap by **inspecting the actual repo** and proposing a config tailored to the doc style. The user only confirms or refines.

## Steps

### 1. Detect existing contextlint

Look for `contextlint.config.json` at the repo root or any parent directory.

- **If found**, stop and ask the user (in their language):
  - `(overwrite)` Re-init from scratch
  - `(add)` Keep existing config, propose new rules to add based on a fresh doc scan
  - `(skip)` Do nothing
- **If not found**, continue.

**Why ask?** Silently re-initializing destroys a tuned config; silently adding rules can trip CI for collaborators. The user owns their config — present options, don't decide for them.

### 2. Detect the package manager

Check lockfiles in priority order:

| Lockfile | Manager | Install command |
|---|---|---|
| `bun.lock` or `bun.lockb` | bun | `bun add -D @contextlint/cli` |
| `pnpm-lock.yaml` | pnpm | `pnpm add -D @contextlint/cli` |
| `yarn.lock` | yarn | `yarn add -D @contextlint/cli` |
| `package-lock.json` | npm | `npm install -D @contextlint/cli` |
| (none) | fallback to npm | `npm install -D @contextlint/cli` |

**Why this order?** A repo migrating package managers may have multiple lockfiles; the most modern one (bun) usually reflects current intent. If the user explicitly mentions a different manager, follow them — they know their workflow.

### 3. Detect doc locations (no hardcoded paths)

Real repos put docs in `documentation/`, `doc/`, `specs/`, `adr/`, `decisions/`, etc. Hardcoding `docs/` misses many legitimate setups.

```sh
# Glob for all Markdown files, excluding common vendor / build dirs
find . -name "*.md" \
  -not -path "*node_modules*" \
  -not -path "*build*" \
  -not -path "*dist*" \
  -not -path "*.git*" \
  -not -path "*.astro*" \
  -not -path "*.next*"
```

Then:

1. Group results by parent directory.
2. Directories with **3+ Markdown files** are candidate doc clusters.
3. Boost (= more likely a real doc directory) when the directory name matches: `docs`, `doc`, `documentation`, `specs`, `spec`, `requirements`, `adr`, `decisions`, `architecture`, `notes`.
4. Root-level meta-docs (`README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`) are noted but **not linted by default** — they're project meta, not the structured content contextlint targets.
5. **Monorepo**: if doc clusters appear under `packages/*/docs/` or similar, list each one.

Present the detected layout and ask the user to confirm. Example (translate to the user's language at runtime):

```
I found these doc clusters in your repo:
  - docs/ (15 .md files)
  - adr/ (8 .md files)
  - root: README.md, CONTRIBUTING.md, CHANGELOG.md

Should the contextlint `include` cover these two? You can override
(add `specs/`, exclude `adr/`, etc.).
```

### 4. Scan content, infer rules

Read 3–5 sample files from each confirmed doc cluster — **don't blow context** by reading every file. Look for these signals:

| Pattern observed in samples | Suggested rule | Why |
|---|---|---|
| `[link](file.md#anchor)` cross-refs | **`ref001`** | Broken links are the most common doc-rot issue |
| Markdown tables with an `ID` column | **`tbl001`** + **`tbl002`** | Structured tables imply schema expectations |
| Repeated section heading triplets (e.g., `## Context` / `## Decision` / `## Consequences`) | **`sec001`** with detected `sections` option | Repeated structure = de-facto template |
| Many checklists (`- [ ]`) | **`chk001`** | Unchecked items often mean unfinished work |
| Placeholder strings (`TODO`, `TBD`, `<pending>`, `???`) | **`ctx001`** | Placeholders signal docs shipped before completion |
| Multiple files cross-referencing each other | **`grp002`** | Cross-ref-heavy repos benefit from cycle detection |

**Always-on baseline (regardless of scan):** `ref001` and `grp002`.

- `ref001`: Broken links are universally undesirable, no good reason to skip.
- `grp002`: Cycle detection is cheap and catches real architectural smells; most repos benefit.

**Important: never invent values.** For `sec001`, only propose a `sections` option if you actually observe consistent triplets in the sampled files. Don't assume the user wants `Context/Decision/Consequences` just because the repo has an `adr/` folder — verify in the content.

### 5. Propose the config

Build a draft `contextlint.config.json` and show it to the user with a one-line rationale per rule.

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md", "adr/**/*.md"],
  "rules": [
    { "rule": "ref001" },
    { "rule": "grp002" },
    { "rule": "sec001", "options": { "sections": ["Context", "Decision", "Consequences"] } },
    { "rule": "ctx001" }
  ]
}
```

Then explain in the user's language. Example template (translate as needed):

```
Here's the proposed config:

- ref001: cross-refs are common in your repo, so detect broken links
- grp002: multiple docs reference each other, so prevent circular dependencies
- sec001: ADR directory shows Context/Decision/Consequences pattern, so require them
- ctx001: several TODO / TBD placeholders found, so flag them

Does this look right? Add or remove anything?
```

**Why per-rule rationale?** A rule the user doesn't understand is a rule they'll silently disable later. Two seconds of "why this rule" buys long-term ownership.

### 6. Install & write

Once the user confirms:

1. Run the install command from step 2 in the repo root.
2. Write the confirmed config to `contextlint.config.json` at the repo root.
3. Run `npx contextlint` once to surface current violations — **immediate value beats ceremony**.

### 7. Optional add-ons (ask each, don't auto-do)

**GitHub Actions workflow.** If the repo has `.github/workflows/`, ask (in the user's language):

> Add a GitHub Actions workflow to lint on PR? (will create `.github/workflows/contextlint.yml`)

If yes, write a minimal workflow:

```yaml
name: contextlint
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx contextlint
```

**README section.** Ask:

> Add a short contextlint section to the README?

If yes, append a 5–8 line block at an appropriate position (before License, after Quick Start, etc.):

```markdown
## Documentation linting

This repo uses [contextlint](https://contextlint.dev) to verify Markdown integrity.

Run locally:

\`\`\`sh
npx contextlint
\`\`\`
```

**Why ask separately?** GitHub Actions changes CI behavior for everyone; README edits change the visible project surface. Both deserve explicit consent.

### 8. Summary

End with a clear, scannable summary in the user's language. Example template:

```
Done:
  ✓ Installed @contextlint/cli (bun)
  ✓ Wrote contextlint.config.json (4 rules, 2 include paths)
  ✓ Added GitHub Actions workflow

Initial lint found 3 violations.
You can fix them with the `contextlint-fix` skill.
```

## Examples

User prompts shown in English first; equivalent phrasings in other languages in italics — both should trigger this skill.

### Example 1: Fresh ADR-style repo

**User:** "Set up contextlint" *(equivalent: "contextlint 入れて", "设置 contextlint", "contextlint 설정해줘")*

1. Detect: no existing config; `bun.lock` found; repo has `adr/` (12 files) + `docs/` (5 files).
2. Sample scan: `adr/` files contain `## Context` / `## Decision` / `## Consequences` heading triplets in 9 of 12 files.
3. Propose: `ref001`, `grp002`, `sec001` (with detected sections), `ctx001`.
4. User: "OK"
5. `bun add -D @contextlint/cli`, write config, run `npx contextlint`, summarize.

### Example 2: Existing contextlint, user wants to expand

**User:** "I want to revisit my contextlint config" *(equivalent: "lint の設定見直したい")*

1. Detect: existing `contextlint.config.json` with `ref001` + `tbl001` only.
2. Ask: `overwrite` / `add` / `skip`.
3. User picks `add`. Re-scan repo. Propose `grp002` and `ctx001` based on what's there now (placeholders accumulated, more cross-refs added since initial setup).
4. User confirms. Merge into existing config (preserve existing rule options).

### Example 3: Monorepo

**User:** "Set up contextlint in my bun monorepo" *(equivalent: "monorepo に contextlint 入れたい")*

1. Detect: bun workspace; doc clusters under `packages/api/docs/`, `packages/web/docs/`, `apps/admin/specs/`.
2. Propose a single root-level config covering all workspaces:

```json
{
  "include": ["packages/*/docs/**/*.md", "apps/*/specs/**/*.md"],
  "rules": [...]
}
```

3. Install `@contextlint/cli` at the workspace root.

## Edge cases

- **No Markdown beyond `README.md`**: tell the user contextlint won't add much value here yet (it shines on cross-file integrity). Suggest revisiting once they have structured docs. Don't force a setup that won't help.
- **Multiple lockfiles** (e.g., both `package-lock.json` and `bun.lock`): pick the most recently modified, or ask the user. Don't assume.
- **Existing `contextlint.config.json` in a parent directory** (e.g., monorepo with config at the higher level): respect it, don't write a sibling. Tell the user "config is already set at `<path>`, scoped to this workspace".
- **Private fork or non-standard install**: the `$schema` URL needs to match the user's actual contextlint source. If you detect a non-standard installation, ask before writing the schema URL.
- **CI exists but isn't GitHub Actions** (e.g., GitLab CI, CircleCI): skip the GitHub Actions step, mention contextlint runs in any CI via `npx contextlint`, and let the user wire it manually.

## See also

- Project: https://contextlint.dev
- Full rule reference: https://github.com/nozomi-koborinai/contextlint#rules
- Sister skills:
  - `contextlint-fix` — auto-fix violations after init reveals them
  - `contextlint-impact` — analyze the blast radius of editing a particular doc
