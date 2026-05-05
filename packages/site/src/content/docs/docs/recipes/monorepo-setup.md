---
title: Monorepo
description: A contextlint setup that validates documentation across multiple packages with a single config.
---

This recipe is for a **monorepo** where multiple packages live in the same repository. It works regardless of the workspace tool — bun workspace, pnpm workspace, yarn workspace, Nx, Turborepo, and so on.

## Which projects it suits

- The repository contains multiple packages laid out as `packages/` or `apps/` at the root
- Each package has its own `docs/` or `README.md`
- There are also cross-cutting documents at the repository root (e.g. `docs/architecture.md`)
- You **don't want to configure documentation integrity per package** (a single config to govern them all)

It also supports validating only one package's documentation from the CLI. The key is how `include` patterns are composed.

## Recommended config (`contextlint.config.json`)

Place a single config at the repository root.

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": [
    "docs/**/*.md",
    "packages/*/docs/**/*.md",
    "packages/*/README.md",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  "rules": [
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "ctx001" },
    {
      "rule": "sec001",
      "options": {
        "files": "packages/*/README.md",
        "sections": ["Installation", "Usage"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/changelog.md",
        "column": "Status",
        "values": ["unreleased", "released", "deprecated"]
      }
    },
    { "rule": "grp002" }
  ]
}
```

Each glob in `include` is interpreted **relative to the root config file**. Even if you run `npx contextlint` from inside `packages/api`, the root config is auto-detected and the same globs are used (for details, see [Config auto-detection](/docs/configuration/auto-detection/)).

## Why each rule was chosen

### How to compose include patterns

In a monorepo, the most important design decision is "at what unit do you include files?". Three typical combinations are shown below.

| Use case | Include pattern | Validation target |
| --- | --- | --- |
| Each package's `docs/` only | `packages/*/docs/**/*.md` | Detailed documentation owned by each package |
| Plus each package's `README.md` | The above + `packages/*/README.md` | All public-facing documentation |
| Plus root-level cross-cutting documents | The above + `docs/**/*.md` | Repository-wide architecture documentation |

This recipe includes all three. Pay attention to **the difference between `*/` (one level only) and `**/` (recursive)**.

- `packages/*/docs/**/*.md` matches `packages/api/docs/...` but not `packages/api/sub/sub/docs/...`
- `packages/**/docs/**/*.md` matches a `docs/` at any depth (useful for nested workspaces in tools like Nx)

The negations `!**/node_modules/**` and `!**/dist/**` are a **safety net** to avoid accidentally picking up documentation from dependencies or build artifacts. They're unnecessary when the positive patterns are tight enough on their own, but they help when several developers add or change globs without tracking glob behavior closely.

### REF-001 / REF-005 — Protecting cross-package links

In a monorepo, cross links from `packages/api/docs/architecture.md` to `packages/web/docs/api-contract.md` arise easily and silently break on every rename. Protect both links (REF-001) and anchors (REF-005).

These rules resolve against the entire set of Markdown files in `include`, so cross-package documentation is validated under the same config.

### GRP-002 — Cross-package circular references

A pattern where `api`'s docs reference `web` and `web`'s docs reference `api` is fine in the short term, but unhealthy as a dependency relationship (it should be one-directional). [GRP-002 Circular references](/docs/rules/grp-002/) guarantees that the reference graph is a DAG.

In a monorepo, circular references in documentation often mirror package-level dependencies (entries in `package.json`'s `dependencies`). Catching them on the doc side first makes design course-correction easier.

### SEC-001 — Standardizing the README template

Each `packages/*/README.md` should contain at least `Installation` and `Usage` sections, which lowers the cognitive cost for a new user reading any package for the first time.

[SEC-001 Required sections](/docs/rules/sec-001/) is scoped to `packages/*/README.md`. Adapt the section names to your team's conventions if needed (Japanese-style headings like `概要` / `使い方` work just as well).

### CTX-001 — Placeholder detection (repo-wide)

In a repository with many packages, it's easy to leave `TODO` or `TBD` behind in some package. Detecting them globally surfaces unfinished spots before a release.

`files` is left unset, so it applies to every file in `include`.

### TBL-003 — Constraining changelog status values

When each package has a `CHANGELOG.md` or `changelog.md`, the `Status` column is often constrained to fixed values like `unreleased` / `released` / `deprecated`. This rule prevents drift (`WIP`, `done`, `pending`, etc.).

For packages without a `changelog.md`, this rule simply has nothing to detect, so it's harmless.

### Rules deliberately omitted from this recipe

| Rule | Why it's omitted |
| --- | --- |
| TBL-006 | Hard to apply when each package has its own ID scheme; not needed when packages use independent IDs |
| REF-002 / REF-003 | Requirement-ID traceability is more naturally managed at the feature level, not the monorepo level |
| REF-004 | Monorepos with a zone structure are uncommon |
| GRP-001 / GRP-003 | The dependency graph differs per package, so a uniform `chain` validation doesn't fit |
| STR-001 | Files required per package are usually managed via the `files` field of `package.json` |

If your monorepo manages requirements as well, consider combining this with the [Spec-driven development repository](/docs/recipes/spec-driven-development-setup/) recipe.

## Operational notes

### Linting only one package

Pass a glob as a CLI argument to override `include` from the config file.

```bash
# Lint only packages/api
npx contextlint "packages/api/**/*.md"
```

Note that overriding `include` causes project-scope rules (REF-001 / REF-005 / GRP-002, etc.) to be **evaluated within the specified glob only**. To validate a link from `packages/api` to `packages/web`, either lint the whole repo without arguments or pass both `packages/api/**/*.md` and `packages/web/**/*.md`.

For details, see the precedence section in [Include patterns](/docs/configuration/include-patterns/).

### Path filters and matrices in CI

In a monorepo, you may want CI to validate only the packages whose docs changed, but contextlint has **project-scope rules** (REF-001 / REF-002 / GRP-002, etc.), so narrowing the target breaks reference-existence validation.

Recommended approaches:

1. **Always lint the entire repository** — a filter like `pull_request: paths: ["**/*.md"]` (run only on PRs that touch Markdown) is fine, but the run itself targets the whole repo
2. **Don't pass a CLI subset** — in a monorepo, run `npx contextlint` without arguments

Only when run time becomes a problem should you split into a CI-specific config that lists each package's directory under `include`. For concrete workflow examples, see [CI integration patterns](/docs/recipes/ci-integration-patterns/).

### Differentiating between packages

Want stricter template enforcement in `apps/` and looser rules in `packages/` for internal libraries? You can express that through each rule's `files` option.

```json
{
  "rule": "sec001",
  "options": {
    "files": "apps/*/README.md",
    "sections": ["Overview", "Setup", "Deployment"]
  }
}
```

Even when you scope the application range with `files`, the document set against which the rule is evaluated (= `include`) stays the same. For details, see [Per-file rule scoping](/docs/configuration/per-file-rule-scoping/).

### Behavior when run from a subdirectory

In a bun workspace or pnpm workspace setup, running `npx contextlint` from `packages/api/` walks up the parent directories to auto-detect the config. Globs are interpreted relative to the root (= the config file's location), so the result is the same regardless of which subdirectory you run from.

For details, see [Config auto-detection](/docs/configuration/auto-detection/).
