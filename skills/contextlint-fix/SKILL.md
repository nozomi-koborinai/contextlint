---
name: contextlint-fix
description: Run contextlint over the project's structured Markdown and fix the violations it detects. Use when the user asks to fix lint errors, clean up docs, or after running contextlint reveals issues. Handles broken cross-references, missing required sections, empty table cells, leftover placeholders, and circular dependency references across the documentation graph.
license: MIT
compatibility: Requires the @contextlint/cli npm package available in the project (will be invoked via npx). Network access only needed if installing the CLI.
metadata:
  homepage: https://contextlint.dev
  source: https://github.com/nozomi-koborinai/contextlint
---

# contextlint-fix

Run [contextlint](https://contextlint.dev) over the project's structured Markdown and apply fixes for the violations it detects.

## When to use this skill

- User asks to "fix lint errors", "clean up docs", "run contextlint"
- After bulk changes to Markdown files (e.g., AI-generated specs/ADRs)
- Before committing changes that touch docs/specs

## Steps

1. **Verify contextlint is set up**:
   - Check for `contextlint.config.json` in the repo root or any parent dir
   - Check that `@contextlint/cli` is available (`devDependencies` or `npx`)
   - If not set up, suggest the `contextlint-init` skill first

2. **Run lint**:
   ```sh
   npx contextlint
   ```

3. **Parse output**. For each violation, apply the strategy below:

   | Rule prefix | Fix strategy |
   |---|---|
   | `REF-*` | Broken cross-reference. If the target ID is a typo, fix it. If it genuinely doesn't exist, **ask the user** before deleting the reference. |
   | `SEC-*` | Missing required section. Add the heading at the appropriate position with `<!-- TODO: fill in -->` placeholder body. |
   | `TBL-*` | Table issues. Empty cells: insert `TODO`. Allowed-value violations: never invent — ask the user. |
   | `STR-*` | Missing required file. Create file with minimal placeholder + `<!-- TODO -->`. |
   | `CHK-*` | Incomplete checklist. Do not silently check items. Report to the user. |
   | `CTX-*` | Placeholder still present. Flag for user attention — placeholders signal unfinished work. |
   | `GRP-*` | Graph issue (circular ref, orphan, etc.). Detect the cycle/orphan and propose a fix. **Ask the user before mutating** — graph changes have wide impact. |

4. **Re-run lint** to confirm zero violations.

5. **Summarize** what was auto-fixed and what still needs human input.

## Examples

**User:** "contextlint がエラー出してるから直して"

→ Run `npx contextlint`, parse output, fix mechanical issues (typos in cross-refs, missing required sections via TODO scaffolds), and leave a summary of remaining items needing user input.

## Edge cases

- **No contextlint installed**: suggest `npm install -D @contextlint/cli` or recommend the `contextlint-init` skill
- **Cross-file rules silently produce nothing**: ensure config's `include` field covers all files referenced by cross-refs
- **Conflicting fix strategies**: do not silently choose, ask the user

## See also

- Project: https://contextlint.dev
- Source / issues: https://github.com/nozomi-koborinai/contextlint
