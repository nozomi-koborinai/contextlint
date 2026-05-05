---
title: Recipes
description: Ready-to-use contextlint setups for common documentation patterns.
---

The Recipes category collects **ready-to-use `contextlint.config.json` setups** for common documentation patterns, along with the rationale behind each choice.

While [Configuration](/docs/configuration/) covers the spec of individual fields and [Rules](/docs/rules/) covers the spec of each rule, Recipes focuses on **how to combine multiple rules** into a coherent setup.

## In this category

- [ADR-style repository](/docs/recipes/adr-style-repo-setup/) — A template-driven setup for Architecture Decision Records
- [Spec-driven development repository](/docs/recipes/spec-driven-development-setup/) — A setup that enforces requirement-to-spec-to-implementation traceability and stability management
- [Monorepo](/docs/recipes/monorepo-setup/) — Validating documentation across multiple packages with a single config
- [CI integration patterns](/docs/recipes/ci-integration-patterns/) — Running contextlint on GitHub Actions, GitLab CI, pre-commit, and PR gates

## How to read a recipe

Each recipe follows the same structure.

1. **Which projects it suits** — assumed scale, presence of templates, operational phase
2. **Recommended config (`contextlint.config.json`)** — a complete config you can copy as-is
3. **Why each rule was chosen** — the intent behind picking (or skipping) each rule
4. **Operational notes** — how to introduce it into an existing repository, phased rollout, and how to gate in CI

## When you can't decide on a setup

If you're unsure about which rule categories or templates to use, the quickest path is to generate a baseline config interactively with [`contextlint init`](/docs/integrations/cli/commands/), then extend it by referring to a recipe.
