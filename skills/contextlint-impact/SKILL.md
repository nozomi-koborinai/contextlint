---
name: contextlint-impact
description: Analyze the impact of changing or deleting a Markdown document by leveraging contextlint's Context Graph. Use this skill whenever the user asks "what breaks if I change X?", "what depends on this doc?", "is it safe to delete this file?", or wants to plan a refactor / understand cross-doc dependencies — even if they don't mention contextlint by name. Detects direct vs transitive impact, identifies orphan docs, and surfaces hidden dependencies that grep alone can't find. Built on contextlint's deterministic graph engine — same input, same answer.
license: Apache-2.0
compatibility: Requires the @contextlint/cli npm package available in the project (will be invoked via npx) and a configured contextlint.config.json with cross-file rules (`ref001`, `grp002`) enabled.
metadata:
  homepage: https://contextlint.dev
  source: https://github.com/nozomi-koborinai/contextlint
---

# contextlint-impact

Analyze the **impact of changing or deleting a Markdown document** using contextlint's Context Graph engine. Tells the user not just which files reference the target directly, but the transitive cascade — and surfaces orphans, hubs, and cycles that grep can't see.

> **Language note**: This skill is used across many languages. Respond to the user in their primary language (the one they're typing in). The English prompts and outputs below are reference templates — translate them to match the user's language at runtime.

## When to use this skill

- The user asks "what breaks if I change X?", "what depends on this doc?", "is it safe to delete this file?", "I want to refactor X, what's the impact?"
- The user is planning a doc restructure or rename
- The user is verifying after a change that all dependents were updated
- The user wants to understand cross-doc dependencies before mass-editing
- Even when contextlint isn't named explicitly — the user wants the *answer*, not the brand

Triggering phrasings appear across many languages. A few illustrative samples (not exhaustive):

- English: "what breaks if I change design.md?", "is FR-101 safe to delete?", "show me what depends on this doc"
- Japanese: "design.md 変更したら何壊れる?", "FR-101 削除して大丈夫?", "依存関係知りたい"
- Chinese: "修改 design.md 会影响什么?", "删除这个文件安全吗?"
- Korean: "design.md 바꾸면 뭐가 깨져?", "이 파일 삭제해도 돼?"

## Why this skill exists

contextlint has a **Context Graph engine** that other linters don't have. In an AI era where docs get mass-edited (and AI agents themselves modify multiple files at once), tracking the cascade of cross-references becomes critical:

- `grep` shows direct mentions but misses transitive impact
- Human intuition can't trace transitive dependencies across a 100-file repo
- AI mass-edits without impact awareness leave broken refs scattered across the doc graph

This skill exposes the graph engine through one simple question: *"what breaks if I touch this?"*

## Steps

### 1. Verify contextlint is set up

Look for `contextlint.config.json` at the repo root or any parent directory.

- **If missing**: stop and recommend the `contextlint-init` skill first. Without a config, cross-file rules don't apply, and the graph will be empty.
- **If present but `ref001` / `grp002` aren't enabled**: warn the user that impact analysis depends on these rules. Suggest running `contextlint-init` in `add` mode to enable them.
- **If both present**: continue.

**Why these checks?** Impact analysis reads from the graph that cross-file rules build. Without them, the graph is just a flat file list.

### 2. Identify the target

The user's question typically names a file or an ID. Disambiguate before running anything.

| User input | Target |
|---|---|
| "design.md 変えたら..." / "what breaks in design.md" | File: `design.md` |
| "FR-101 削除して..." / "delete FR-101" | ID `FR-101` → resolve to its containing file first |
| "API の認証部分を refactor したい" / "I want to refactor the auth" | **Ambiguous** — ask the user "which file?" |

**For ID targets**, first locate the file that defines the ID:

```sh
grep -rn 'FR-101' . --include='*.md'
```

Then run impact analysis on the *containing file*. `contextlint impact` operates on files; ID questions reduce to file-level analysis once the home file is identified.

### 3. Run the impact analysis

```sh
npx contextlint impact <target-file> --format json
```

`--format json` is critical — the human-readable output is for terminals, but JSON makes parsing reliable across agent implementations.

**MCP alternative**: if a contextlint MCP server is attached to the agent's session, prefer the `impact-analysis` MCP tool over the CLI — it returns structured data without a JSON parse step. Detect this by checking the available tools list at the start of the skill.

### 4. Parse the output

The JSON includes:

- **direct**: files that reference the target via cross-refs
- **transitive**: files reachable through indirect references (parent of refs)
- **lint violations in the impact set**: any current violations in the affected files (CLI auto-includes these)

If the output is empty:

- The file may be an **orphan** (no incoming refs) — safe to delete from the doc-graph perspective, but verify outside the graph (code references, build configs, README mentions)
- The config may not include cross-file rules — verify `ref001` / `grp002` are enabled

### 5. Present structured findings

Present a clean, scannable summary in the user's language. Use a tree or grouped layout, not just a flat list.

Example template (translate at runtime):

```
Impact analysis for `design.md`:

DIRECT (5 files reference this directly):
  - requirements.md
  - overview.md
  - api/auth.md
  - api/users.md
  - testing.md

TRANSITIVE (12 more files affected indirectly):
  - architecture.md (via overview.md)
  - migrations/2026-01.md (via api/users.md)
  - ... [list]

⚠ HIGHLIGHTS:
  - api/auth.md is itself referenced by 8 files → high cascade risk
  - Lint violations detected in 3 affected files (run `contextlint-fix` after editing)

RECOMMENDATIONS:
  - Update direct references first, then verify transitive ones still make sense
  - Consider splitting the change into smaller PRs if cascade is large
  - Run docs build / tests after changes to catch missed updates
```

**Why this shape?** A flat list of 17 files is hard to act on. Grouping by direct/transitive + highlighting hubs gives the user a place to start (direct first), a sense of scope (transitive count), and a risk signal (hub warning).

### 6. Recommend follow-up actions

Tailor the recommendations to what the analysis revealed:

| Observation | Recommendation |
|---|---|
| Many transitive impacts (>10) | Suggest splitting the change into smaller PRs to keep review tractable |
| Target file is a hub (high incoming refs) | Recommend a backwards-compatible change strategy (deprecate-then-remove) |
| Target file is an orphan | Ask whether it's used outside the doc graph (code, build configs) before deleting |
| Lint violations in the affected files | Recommend running the `contextlint-fix` skill after the user makes their edit |
| Cycles detected during analysis | Note the cycle, suggest enabling `grp002` if not already, and recommend resolving the cycle before refactoring |

## Examples

User prompts shown in English first; equivalent phrasings in other languages in italics — both should trigger this skill.

### Example 1: File change impact

**User:** "What breaks if I change `design.md`?" *(equivalent: "design.md 変更したら何壊れる?", "修改 design.md 会影响什么?")*

1. Verify `contextlint.config.json` exists with `ref001` enabled.
2. Target = `design.md`.
3. Run `npx contextlint impact design.md --format json`.
4. Parse: 5 direct refs, 12 transitive refs, 3 lint violations in affected files.
5. Present summary with direct/transitive lists, hub warning for `api/auth.md`, lint violation count.
6. Recommend updating direct refs first + running `contextlint-fix` after edits.

### Example 2: ID deletion safety check

**User:** "Is it safe to delete the requirement `FR-101`?" *(equivalent: "FR-101 削除して大丈夫?")*

1. Verify config.
2. Target = ID `FR-101`. Locate via `grep -rn 'FR-101' . --include='*.md'` → found defined in `requirements.md`, referenced from 3 other files.
3. Run `npx contextlint impact requirements.md --format json`.
4. Filter the result for files that reference the specific ID `FR-101` (these will fail with broken-cross-ref errors after deletion).
5. Present: "Deleting `FR-101` will leave broken refs in `design.md`, `testing.md`, `api/users.md`. Update those first, then delete."

### Example 3: Orphan detection

**User:** "Is this old `legacy.md` still in use?" *(equivalent: "legacy.md 使われてる?")*

1. Verify config.
2. Target = `legacy.md`.
3. Run impact analysis.
4. Output: zero direct, zero transitive — orphan from the doc-graph perspective.
5. Present: "No Markdown file references `legacy.md`. Note: this only covers cross-refs in your doc graph — check code, README, build configs, and any external links before deleting."

## Edge cases

- **No `contextlint.config.json` found**: stop, recommend `contextlint-init` first. Don't try to run impact without a config.
- **`ref001` / `grp002` not enabled**: cross-file impact won't surface meaningful results — warn the user and recommend enabling them.
- **Target file doesn't exist**: stop, ask the user to clarify which file (might be a typo or the file was already deleted).
- **Target is part of a cycle**: report the cycle and recommend resolving it before relying on impact results — cycles can make transitive impact misleading.
- **Output is large (100+ files affected)**: present a tree/grouped view instead of a flat list. Optionally suggest the user run `contextlint slice` for a narrower context.
- **MCP server attached**: prefer the structured `impact-analysis` MCP tool over CLI parsing. Both return equivalent data, but MCP is a tool call (no JSON parse needed).
- **CLI not installed yet**: tell the user to run `npm install -D @contextlint/cli` first, or recommend the `contextlint-init` skill.

## See also

- Project: https://contextlint.dev
- Context Graph API: https://github.com/nozomi-koborinai/contextlint#context-graph-api
- Sister skills:
  - `contextlint-init` — set up contextlint in the repo (prerequisite when not yet configured)
  - `contextlint-fix` — auto-fix violations the impact analysis surfaces
