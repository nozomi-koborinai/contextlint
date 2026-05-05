---
title: CI/CD
description: How to plug contextlint into CI pipelines and local hooks.
---

contextlint runs in any CI environment that has Node.js. The `@contextlint/cli` package has light dependencies and finishes in sub-seconds, so running it on every PR doesn't noticeably affect CI time. You can wire it in either to guarantee document integrity before merge, or to catch issues fast in a local pre-commit hook.

## Integration timing

| Timing | Main tools | Purpose |
| --- | --- | --- |
| Local hook | pre-commit / Husky / lint-staged | Last safety net before commit |
| On push | GitHub Actions / GitLab CI / CircleCI | Guarantee document integrity before PR review |

While editor integration ([Editors (LSP)](/docs/integrations/editors/)) and AI integration ([AI Agents](/docs/integrations/ai-agents/)) cover the "while you're writing" feedback, CI/CD covers the "before merge" final check. Combining all three layers keeps document integrity from breaking in your repository.

## What's in this section

- [GitHub Actions](/docs/integrations/ci-cd/github-actions/) — official Composite Action and direct-execution examples
- [pre-commit / local hooks](/docs/integrations/ci-cd/pre-commit/) — integrating with Husky / lint-staged / the pre-commit framework

## Handling the config file

When running contextlint in CI, commit `contextlint.config.json` to the repository. The runner picks it up automatically once the repo is checked out, so `npx contextlint` doesn't need any extra arguments.

For the spec of the config file, see [Configuration](/docs/configuration/).

## Exit codes and output formats

`contextlint` exits non-zero if there's at least one violation, so the CI job fails as-is. To produce review comments or annotations, get machine-readable output via `--format json`.

```bash
npx contextlint --format json
```

For the structure and fields of the JSON output, see [Integrations → CLI → JSON output](/docs/integrations/cli/json-output/).
