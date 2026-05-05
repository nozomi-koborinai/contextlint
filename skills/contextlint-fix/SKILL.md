---
name: contextlint-fix
description: Run contextlint over the project's structured Markdown and fix the violations it detects. Use this skill whenever the user asks to fix lint errors, clean up docs, repair broken Markdown links, or after bulk edits to documentation (especially AI-generated specs/ADRs) — even if they don't explicitly mention contextlint by name. Handles broken cross-references, missing required sections, empty table cells, leftover placeholders (TODO/TBD), and circular dependency references across the documentation graph. Reach for this any time the user mentions doc integrity, broken refs, or wants their Markdown checked.
license: MIT
compatibility: Requires the @contextlint/cli npm package available in the project (will be invoked via npx). Network access only needed if installing the CLI.
metadata:
  homepage: https://contextlint.dev
  source: https://github.com/nozomi-koborinai/contextlint
---

# contextlint-fix

Run [contextlint](https://contextlint.dev) over the project's structured Markdown and apply fixes for the violations it detects.

> **Language note**: This skill is used across many languages. Respond to the user in their primary language (the one they're typing in). The English prompts and outputs below are reference templates — translate them at runtime.

## When to use this skill

- The user asks to "fix lint errors", "clean up docs", "repair broken Markdown links", "run contextlint"
- After bulk changes to Markdown files (especially AI-generated specs / ADRs)
- Before committing changes that touch docs / specs / ADRs
- Even when the user doesn't name contextlint explicitly — they want the *outcome* (clean, valid docs)

Triggering phrasings appear across many languages. A few illustrative samples:

- English: "fix lint errors", "clean up the broken links in docs", "fix what contextlint is complaining about"
- Japanese: "contextlint がエラー出してるから直して", "lint 直して", "壊れたリンク直して"
- Chinese: "修复 markdown 错误", "清理文档"
- Korean: "lint 오류 고쳐줘", "문서 정리해줘"

## Why this skill exists

Doc rot (broken cross-refs, missing sections, leftover TODOs) accumulates silently. Manual cleanup is tedious and easy to skip. AI agents bulk-editing docs also accumulate violations as a side effect. This skill turns "go fix the lint output" into a one-step request, while being careful to **never silently mutate semantic content** — only mechanical fixes are auto-applied.

## Steps

### 1. Verify contextlint is set up

- Check for `contextlint.config.json` in the repo root or any parent directory
- Check that `@contextlint/cli` is available (`devDependencies` or `npx`)
- If not set up, suggest the `contextlint-init` skill first

**Why?** Without a config, contextlint can't run. Without cross-file rules enabled, many fix opportunities won't surface.

### 2. Run lint

```sh
npx contextlint
```

For machine-readable parsing in step 3, add `--format json`.

### 3. Parse output and apply fix strategies

For each violation, apply the strategy below:

| Rule prefix | Auto-fix strategy | Why |
|---|---|---|
| `REF-*` | If the target ID looks like a typo, fix the typo. If it genuinely doesn't exist, **ask the user** — silently deleting a reference loses intent. | A broken ref might mean the target was renamed (typo, fix it) or genuinely deleted (intent unclear) |
| `SEC-*` | Add the missing heading at the appropriate position with `<!-- TODO: fill in -->` body | Section structure is mechanical; content fill-in is human work |
| `TBL-*` | Empty cells: insert `TODO`. Allowed-value violations: **never invent** — ask the user. | A `TODO` flag is honest; inventing values is dishonest |
| `STR-*` | Missing required file: create with minimal placeholder + `<!-- TODO -->` | Same as SEC — make the structure exist, leave content to the human |
| `CHK-*` | Incomplete checklist. Do not silently check items. Report to the user. | Auto-checking erases work-tracking signal |
| `CTX-*` | Placeholder still present. Flag for user attention — placeholders signal unfinished work. | Silently "finishing" a TODO is a lie |
| `GRP-*` | Graph issue (circular ref, orphan, etc.). Detect the cycle / orphan and propose a fix. **Ask the user before mutating** — graph changes have wide impact. | Cycle resolution can cascade across many files; user needs to choose the cut point |

**Underlying principle**: mechanical fixes (typos, heading insertion, file creation with placeholder) are auto-applied. Semantic decisions (deletion, value invention, checklist progress, graph cuts) are surfaced for the user. The user owns the meaning; the skill owns the boilerplate.

### 4. Re-run lint to confirm

```sh
npx contextlint
```

If zero violations remain, done. If the "ask the user" cases are still present, list them clearly.

### 5. Summarize

End with a clear, scannable summary in the user's language. Example template:

```
Done:
  ✓ Fixed 3 typo'd cross-refs in design.md
  ✓ Added missing "Consequences" section in adr/0005.md (TODO placeholder)

Needs your attention:
  ? FR-101 referenced in design.md but not defined anywhere — delete the ref or define the requirement?
  ? Circular reference between architecture.md and overview.md — which side should be the source of truth?

After your decisions, re-run me to clean up.
```

## Examples

User prompts shown in English first; equivalent phrasings in other languages in italics — both should trigger this skill.

### Example 1: Mass AI edit cleanup

**User:** "Fix the lint errors" *(equivalent: "contextlint がエラー出してるから直して", "修复 markdown 错误", "lint 오류 고쳐줘")*

→ Run `npx contextlint`, parse output, fix typos and add scaffolds for missing sections, then summarize what was auto-fixed and what needs user input.

### Example 2: Pre-commit cleanup

**User:** "Clean up docs before I commit" *(equivalent: "コミット前に docs 整理して")*

→ Run lint, apply mechanical fixes, surface anything semantic for user judgment, do not auto-decide.

## Edge cases

- **No contextlint installed**: suggest `npm install -D @contextlint/cli` or recommend the `contextlint-init` skill
- **Cross-file rules silently produce nothing**: ensure config's `include` field covers all files referenced by cross-refs
- **Conflicting fix strategies**: do not silently choose — ask the user
- **Many violations (50+)**: present a grouped summary instead of fixing all at once. Ask the user "fix all auto-fixable ones, or focus on a subset?"
- **MCP server attached**: prefer the structured `lint` MCP tool over CLI parsing — same logic, no JSON parse step

## See also

- Project: https://contextlint.dev
- Sister skills:
  - `contextlint-init` — set up contextlint from scratch (recommended if not yet configured)
  - `contextlint-impact` — analyze the cascade impact of editing a particular doc
