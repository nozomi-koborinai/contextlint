---
title: CI integration patterns
description: Examples for running contextlint on GitHub Actions, GitLab CI, pre-commit, and PR gates.
---

This recipe collects representative patterns for wiring contextlint into a CI/CD pipeline. The right approach differs depending on whether you gate at `pull_request`, take snapshots on `push`, or run a local pre-commit hook.

This page does not cover the contents of the config file (`contextlint.config.json`). For config examples, refer to the other recipes ([ADR-style repository](/docs/recipes/adr-style-repo-setup/) / [Spec-driven development repository](/docs/recipes/spec-driven-development-setup/) / [Monorepo](/docs/recipes/monorepo-setup/)).

## Which projects it suits

- You want to gate documentation integrity **before merge**
- You want the same rules and the same results both locally and in CI (taking advantage of deterministic validation)
- You want **inline annotations** on the changed lines of a PR
- You also want to take separate snapshots against the `main` branch

contextlint runs fast (a few seconds), needs no API keys, and requires no external service integration, so it's cheap to run in CI.

## Recommended setup (GitHub Actions)

Using the official Composite Action is the shortest path. Drop a workflow file at `.github/workflows/contextlint.yml`.

```yaml
name: contextlint

on:
  pull_request:
    paths:
      - "**/*.md"
      - "contextlint.config.json"
  push:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nozomi-koborinai/contextlint/.github/actions/contextlint@main
        # with:
        #   config: 'contextlint.config.json'   # optional (auto-detected when omitted)
        #   files: 'docs/**/*.md'                # optional (overrides include via CLI args)
        #   version: 'latest'                    # optional (e.g. 'v0.9.0' to pin a version)
```

In a single step this runs `bun setup` → `@contextlint/cli` → `--format json` output → line-level inline annotations on the PR diff.

## Why each setting was chosen

### Adopting the Composite Action

The official Composite Action (`nozomi-koborinai/contextlint/.github/actions/contextlint`) does the following internally.

1. Sets up bun via `oven-sh/setup-bun@v2`
2. Runs `bunx @contextlint/cli@<version>` with `--format json`
3. Converts JSON output into GitHub Actions `::error` / `::warning` workflow commands so the annotations appear on the PR diff
4. Fails the job with exit code 1 when there is at least one error

Reproducing this by hand requires JSON parsing and annotation conversion. Unless you need to pin a specific version, the Composite Action is the simpler choice.

### The `paths` filter

The `pull_request: paths` filter runs the workflow only on PRs that touch `**/*.md` or `contextlint.config.json`. There's no need to rerun contextlint on every code-only PR, which saves CI credits.

That said, even in a monorepo where docs live only under `packages/*/docs/`, **don't** narrow `paths` to `packages/*/docs/**/*.md`. Keep it at `**/*.md`. Two reasons:

1. Avoid the **risk of missing future doc additions** in new locations
2. The path filter must also cover **changes to the config file**, so a wider glob is easier to maintain anyway

### Using `push: main` alongside

`pull_request` alone can't cover cases where something breaks at the moment a PR merges into `main` (squash merge / fork PR / direct push). Adding `push: main` keeps `main`'s current state continuously validated.

### Pinning the version

Leaving `version: 'latest'` means new rules and default-behavior changes hit your CI instantly. For stability, pin an explicit tag like `version: 'v0.9.0'` and manage updates via Renovate or Dependabot.

## Adapting to other CI systems

### GitLab CI

GitLab CI doesn't have an equivalent of Composite Actions, so call the CLI directly.

```yaml
contextlint:
  image: oven/bun:latest
  rules:
    - changes:
        - "**/*.md"
        - "contextlint.config.json"
  script:
    - bunx @contextlint/cli@latest --format json > contextlint.json || true
    - |
      if [ -s contextlint.json ]; then
        cat contextlint.json
        # Exit 1 if any errors are present
        if jq -e 'any(.[]; .severity == "error")' contextlint.json > /dev/null; then
          exit 1
        fi
      fi
  artifacts:
    when: always
    paths:
      - contextlint.json
```

GitLab CI has no equivalent of GitHub Actions' workflow-command-style inline annotations, so the typical flow is to keep the JSON as `artifacts` and consult it from the merge request review.

### CircleCI

On CircleCI, choose a `bun`-capable image or use `oven-sh/bun-orb`.

```yaml
version: 2.1

jobs:
  contextlint:
    docker:
      - image: oven/bun:latest
    steps:
      - checkout
      - run:
          name: Run contextlint
          command: bunx @contextlint/cli@latest

workflows:
  docs:
    jobs:
      - contextlint
```

CircleCI doesn't have a built-in equivalent of `paths` filters. If you need one, use the `path-filtering` orb, or simply run on every commit.

### npm / pnpm environments

`@contextlint/cli` is **not bun-only** — it's a regular CLI installable from npm. To run without bun in an npm / pnpm / yarn environment, use each package manager's dlx equivalent.

```yaml
# pnpm
- run: pnpm dlx @contextlint/cli

# npm (via devDependency)
- run: npm install
- run: npx contextlint

# yarn
- run: yarn dlx @contextlint/cli
```

Adding it to `devDependencies` and running `npx contextlint` after `npm install` gives the most reliable lockfile-driven setup.

## Local pre-commit hook

If you want to lint locally before committing, in addition to gating in CI, use [pre-commit](https://pre-commit.com/) or the [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) combination.

### pre-commit (Python-based)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: '\.(md)$'
        pass_filenames: false
```

The key is `pass_filenames: false`. **Because contextlint has project-scope rules, passing only the changed files as arguments breaks cross-file validation in REF-001 / GRP-002 and similar rules.** Run it against the entire repository every time.

### husky + lint-staged

`package.json`:

```json
{
  "lint-staged": {
    "*.md": "npx contextlint"
  }
}
```

Note that lint-staged passes only the changed files as arguments by default. When you rely on project-scope rules, skip lint-staged and call `npx contextlint` directly from a husky `pre-commit` hook.

```bash
# .husky/pre-commit
#!/bin/sh
npx contextlint
```

## Exit codes and CI gating

Full details of contextlint's exit codes are in the [CLI flag reference](/docs/integrations/cli/flags/); here's the summary that matters for CI gating.

| Code | Meaning | CI behavior |
| --- | --- | --- |
| `0` | No violations, or warnings only | Pass |
| `1` | At least one error | Fail (PR gate triggers) |
| `2` | Missing config, or parse error | Fail (treated as a CI configuration mistake) |

**Warnings do not fail CI.** To gate on warnings as well, grep the CLI output, or write a wrapper that evaluates the JSON output with `jq` and changes the exit code.

## Operational notes

### Composite Action caching

The official Composite Action runs `bunx @contextlint/cli@<version>` internally, fetching from the npm registry every time. If run time matters, add an `actions/cache` step after `actions/setup-bun` to cache `~/.bun/install/cache`. For most projects, fetching the `latest` version takes a few seconds, so the default is fast enough.

### Annotations on fork PRs

On fork PRs, the default `GITHUB_TOKEN` has restricted permissions, and inline annotations may not appear. The Composite Action doesn't fail the job when annotation publishing fails — it also writes the same content to stdout, so violations remain visible from the PR's checks tab in the log.

### Phased rollout

Turning on PR gating in one go on an existing repository with hundreds of warnings will leave the next several PRs in a state where "you can't merge unless you fix unrelated issues too". Use one of the following to phase it in.

1. **Start with `push: main` only** — no PR gate; just visualize `main`'s state
2. **Add `continue-on-error: true` to the job** — run the Action but don't fail the job (only annotations appear)
3. **Narrow `include` and expand gradually** — validate only newly added directories at first; exclude legacy directories

The third option uses negation patterns in [Include patterns](/docs/configuration/include-patterns/).

### Related documentation

- [CLI commands](/docs/integrations/cli/commands/) — subcommands and flags for `lint`
- [CLI flag reference](/docs/integrations/cli/flags/) — details on `--config` / `--format` / `--cwd`
- [CI/CD integration](/docs/integrations/ci-cd/) — official integration methods in this category (Composite Action API reference)
