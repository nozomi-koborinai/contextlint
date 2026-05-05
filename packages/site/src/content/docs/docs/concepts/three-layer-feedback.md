---
title: Three-layer feedback design
description: The design philosophy behind splitting feedback into LSP / MCP / CI.
---

contextlint ships the same lint engine over three protocols: **LSP / MCP / CI**. Rather than picking a single delivery path, splitting feedback across three layers is a deliberate design decision aimed at **bringing the moment a document breaks and the moment the breakage is detected as close together as possible**. This page explains the reasoning behind that split.

A summary table of the three layers (timing and the tools they map to) lives in [Get Started](/docs/get-started/). This page focuses on **why** the split exists.

## When documents break

Document integrity can erode at three points in the lifecycle.

| Phase | What happens |
|-------|--------------|
| **While a human is writing** | Renames, ID changes, section deletions — the side effects of editing break references |
| **While AI is writing** | When AI generates or edits new documents, references to existing files can break |
| **When multiple edits merge** | The instant a branch merges, two independently authored changes combine and integrity collapses |

The three-layer design exists to provide **a checkpoint corresponding to each of these three phases**.

## The role of each layer

| Layer | Protocol | When it runs | Tools it covers |
|-------|----------|--------------|-----------------|
| **While writing** | LSP | While typing in the editor (debounced) | VS Code / Cursor / Neovim / Helix / JetBrains |
| **While AI is writing** | MCP | Immediately after an AI agent edits a doc | Claude Code / Cursor Agent / Cline / Codex / Windsurf |
| **Before merge** | CLI | At PR / pre-commit / push time | GitHub Actions / pre-commit / Husky / lint-staged |

The three differ only in **when detection runs**. The **engine that runs** is the same. Rule definitions, configuration files, and output formats are all shared — the design intentionally rules out drift between layers.

## Why the split into three layers

### A single layer is either too late, or too early

**The problem with relying on CI alone:**
A document inconsistency stays invisible until the PR is opened and CI runs. By the time anyone notices, the fix straddles multiple commits, and pinning down the cause becomes expensive.

**The problem with relying on LSP alone:**
Real-time feedback during editing is powerful, but a PR can slip past it and merge anyway. Without a final guard, `main` is at risk of breaking.

**The problem with relying on MCP alone:**
It covers edits made through an AI agent, but it cannot catch direct human edits in the editor or the side effects that CI is meant to surface.

Combining the three layers lets each layer catch what the others miss.

### Earlier detection means cheaper fixes

The earlier an inconsistency is detected, the easier it is to fix. The later it slips, the wider the blast radius.

| Detection timing | Approximate fix cost |
|------------------|---------------------|
| While typing (LSP) | One keystroke. Fixed the moment the squiggle appears |
| Just after AI edit (MCP) | The AI proposes the fix itself. The human only confirms |
| At PR time (CI) | Fixes span multiple commits. Review round-trips multiply |
| After merge | A separate PR for follow-up fixes. `main` stays broken in the interim |

LSP says "don't break it," MCP says "fix it as soon as it breaks," and CI says "don't let broken things through" — each layer plays a distinct role, which is why shipping the same tool in three forms is meaningful.

### Standard protocols preserve tool-choice freedom

Each of the three layers maps to an **open standard protocol**.

- **LSP (Language Server Protocol)** — editor-agnostic. The same behavior across VS Code / Cursor / Neovim / Helix / JetBrains
- **MCP (Model Context Protocol)** — AI-host-agnostic. The same behavior across Claude Code / Cursor / Cline / Codex / Windsurf
- **CLI (shell command)** — usable from CI, Git hooks, or by hand

By adopting standard protocols, contextlint deliberately **avoids locking users into any one environment**. Switching editors, switching AI hosts, or moving CI to a different service does not interrupt the linter.

## The benefits of one engine across three layers

Sharing a single engine across the three layers brings important operational benefits.

- **Consistent results** — there is no divergence where the editor passes but CI flags it
- **Configuration in one place** — drop `contextlint.config.json` at the repository root and the same rules apply across all three layers
- **New rules instantly land everywhere** — write a new rule and that same day it works in the editor, in AI agents, and in CI

Internally, the lint pipeline is consolidated into `@contextlint/core`. `@contextlint/cli`, `@contextlint/mcp-server`, and `@contextlint/lsp-server` each act as a thin adapter that calls into core. See [Graph API](/docs/graph-api/) and the per-layer pages under [Integrations](/docs/integrations/) for details.

## Next steps

- [Context Graph](/docs/concepts/context-graph/) — the dependency graph the three-layer lint engine shares
- [Integrations](/docs/integrations/) — how to wire each layer in practice
