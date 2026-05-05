---
title: GitHub Actions
description: Two ways to wire contextlint into a GitHub Actions workflow.
---

contextlint offers two integration paths that fit GitHub Actions well: an **official Composite Action** and direct execution via `npx`. With minimal configuration, you can run lint on every PR, and the job fails on any violation.

## Official Composite Action

The repository ships a Composite Action under `nozomi-koborinai/contextlint`. It runs contextlint with `--format json` and turns the output into PR inline annotations — all on the Action's side.

```yaml
name: contextlint
on:
  pull_request:
    paths: ["docs/**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'  # optional
        #   files: 'docs/**/*.md'              # optional
        #   version: 'latest'                  # optional
```

| Input | Description |
| --- | --- |
| `config` | Path to the config file. Auto-detected from parent directories if omitted |
| `files` | Glob to validate. Falls back to the config's `include` if omitted |
| `version` | `@contextlint/cli` version to use. Defaults to `latest` if omitted |

`paths` keeps the workflow off PRs that don't touch documentation, saving CI time.

## Direct execution

You can skip the Composite Action and just run contextlint with `npx`. No additional setup is needed beyond Node.js.

```yaml
name: contextlint
on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli
```

If a config is committed in the repo, `npx @contextlint/cli` is enough to lint. Violations exit non-zero, so the job fails automatically.

## Run via your existing package manager

If your repository uses bun / pnpm / yarn, putting `@contextlint/cli` in `devDependencies` and invoking it through `bun run` (etc.) makes dependency resolution faster.

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bunx contextlint
```

The dependency lockfile pins the version, keeping the CI version in sync with what's installed on developer machines.

## Annotations

The Composite Action adds inline annotations automatically, but you can achieve the same with direct execution by processing the JSON output in a script.

```yaml
- run: npx contextlint --format json | tee contextlint.json
- run: node ./scripts/annotate.js contextlint.json
```

For the JSON structure, see [JSON output](/docs/integrations/cli/json-output/).

## Combining with parallel jobs

contextlint plays nicely alongside `markdownlint` and `eslint` running in parallel. Their responsibilities are separate, so the results don't interfere.

```yaml
jobs:
  contextlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx @contextlint/cli

  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "22"
      - run: npx markdownlint-cli2 "**/*.md"
```

For the difference in responsibility between contextlint and markdownlint, see [Semantic vs syntax linting](/docs/concepts/semantic-vs-syntax/).

## Keeping SKILL.md in sync

`contextlint compile` is deterministic, so running it with `--dry-run` in CI verifies that the repository's SKILL.md is in sync with the latest documentation.

```yaml
- run: npx contextlint compile --dry-run
```

A diff exits non-zero, letting CI catch a stale SKILL.md.
