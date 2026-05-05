---
title: Watch mode
description: Use --watch to re-lint automatically when files change.
---

When you pass `--watch`, contextlint runs an initial lint and then keeps watching the working directory for changes to `.md` files. Use it when you want real-time feedback while editing.

## Starting it

```bash
# Watch following the include patterns
npx contextlint --watch

# Watch a specific glob
npx contextlint --watch "docs/**/*.md"

# Specify a config explicitly
npx contextlint --watch --config contextlint.config.json
```

Stop with `Ctrl+C`.

## Behavior

The basic flow of watch mode is:

1. On startup, clear the terminal and run a full initial lint
2. Watch `.md` files under the working directory for changes
3. When a change is detected, re-lint every matching file
4. Clear the terminal and print the latest results with a timestamp

Successive changes are debounced by **300 milliseconds**. If you save several files in quick succession, contextlint runs once, 300 ms after the last change.

### Why re-lint every file

Linting only the changed file isn't enough for **cross-file rules** like REF-002 (cross-file ID consistency) or TBL-006 (ID uniqueness across files). A change in one file can introduce or resolve violations in another, so contextlint always re-runs against the full target set.

## When to use it

| Situation | Recommendation |
| --- | --- |
| Editing Markdown in your editor | If your editor speaks LSP, [Editors (LSP)](/docs/integrations/editors/) gives faster feedback |
| Editor without LSP support | Watch mode is a useful fallback |
| AI generates a lot of docs and you want to verify the output | Keep watch on; contextlint re-runs immediately after the AI writes |
| CI environment | Don't use watch — use a single run and check the exit code |

## Terminal output

When a change is detected, the header shows the timestamp and the changed file.

```text
[14:32:15] File changed: docs/requirements.md

docs/requirements.md
  line 12  error  Required column "Status" not found in table  TBL-001

1 error in 1 files
```

Watch mode always prints in human format (combining it with `--format json` is not supported).
