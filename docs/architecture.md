# Architecture

contextlint is a semantic linter for structured Markdown documents in the AI era — designed for repositories where AI agents and humans co-edit specs, ADRs, requirements, and design docs.

This document describes how the codebase is organized, what each package does, and the design choices that shape the project.

## Overview

contextlint validates the **meaning** of Markdown — broken cross-references, missing required sections, empty cells, drift between related docs — not its formatting. markdownlint covers formatting (style, syntax); contextlint covers structure and cross-file integrity. The two are complementary.

The project ships as:

- A **rule engine** with 21 rules across 7 categories
- A **Context Graph** that captures cross-file dependencies
- Three integration layers (Editor / AI / CI), each via a standard protocol (LSP / MCP / CLI)
- An LP at <https://contextlint.dev>
- An Agent Skills bundle distributed via the agentskills.io standard

## Repository structure

contextlint is a [bun workspace](https://bun.sh/docs/install/workspaces) monorepo. Each package has a clear role and a clear boundary:

```text
contextlint/
├── packages/
│   ├── core/         # Rule engine, parser, Context Graph API
│   ├── cli/          # `contextlint` command
│   ├── mcp-server/   # MCP server (5 tools)
│   ├── lsp-server/   # LSP server (diagnostics, hover, Quick Fixes)
│   ├── vscode/       # VS Code / Cursor extension (consumes lsp-server)
│   └── site/         # contextlint.dev landing page (Astro)
├── skills/           # Agent Skills (agentskills.io standard)
│   ├── contextlint-fix/
│   ├── contextlint-init/
│   └── contextlint-impact/
├── docs/             # Internal documentation (this directory)
├── tests/            # Integration tests + fixtures
└── ...
```

**Boundaries:**

- `cli`, `mcp-server`, `lsp-server` all import from `core`. They never duplicate the lint pipeline or config-loading logic — those live in `core` (`lint-files.ts`, `config.ts`).
- `vscode` consumes `lsp-server` via `require.resolve` — the extension is a thin client that spawns the LSP server as a subprocess.
- `site` is private (not published to npm), built with Astro and hosted on Cloudflare Pages.
- `skills/` is distributed via `gh skill install` (agentskills.io standard), independent of the npm packages.

## Rule engine (core)

Rules live in `packages/core/src/rules/<rule-id>.ts` and are organized by category prefix:

| Prefix | Category | What it validates |
| --- | --- | --- |
| `TBL` | Table | Required columns, empty cells, allowed values, patterns, uniqueness, cross-column constraints |
| `SEC` | Section | Required heading existence and ordering |
| `STR` | Structure | Project-level file existence |
| `REF` | Reference | Links, anchors, cross-file ID traceability, stability consistency, zone dependencies, image references |
| `CHK` | Checklist | Item completion |
| `CTX` | Context | Placeholder detection (TODO / TBD), term consistency against a glossary |
| `GRP` | Graph | Traceability chains, circular references, orphan detection |

Each rule exports a **Zod schema** (`xxxSchema`) as the single source of truth for its options — the registry validates options before calling the factory, so consumers don't need `as` casts.

**Cross-file rules** (REF-\*, GRP-\*, TBL-006) rely on a `context.documents` Map that contains every parsed document in scope. Without it they silently produce no results, so consumers must populate it from the config's `include` patterns.

## Context Graph

The Context Graph (`packages/core/src/context-graph.ts`) is what distinguishes contextlint from a plain Markdown linter. It captures the dependency relationships between documents — who references whom — and exposes that as a programmable API.

Public functions:

| Function | Purpose |
| --- | --- |
| `buildContextGraph(documents)` | Build the graph from parsed documents |
| `getImpactSet(graph, filePath)` | All files affected by changing a file (direct + transitive) |
| `getContextSlice(graph, documents, query, maxDepth?)` | Minimal relevant file set for a query |
| `topologicalSort(graph)` | Topological order of the document graph |
| `getComponents(graph)` | Connected components (clusters) |
| `classifyImpact(graph, filePath)` | Direct vs transitive impact classification |
| `formatContextGraphSummary(graph)` | Human-readable graph summary |

These power the `impact`, `slice`, and `graph` CLI subcommands and the `context-graph`, `context-slice`, `impact-analysis` MCP tools.

## Three-Layer feedback

contextlint is designed to plug in at three points in the doc lifecycle, each via an open standard:

| Layer | Protocol | Trigger |
| --- | --- | --- |
| **While you write** | LSP | Editor diagnostics on every keystroke (debounced) |
| **While AI writes** | MCP | AI agent calls contextlint to verify its own output |
| **Before merge** | CLI | CI gate (`npx contextlint`) on PR |

The **vendor-neutral** stance is deliberate: protocol names (LSP / MCP) are technical details. Public-facing materials (LP, README) lead with **concrete tool names** (VS Code, Cursor, Claude Code, Gemini CLI, GitHub Actions) because that's what users recognize. See `decisions/0002-vendor-neutral-positioning.md` for the reasoning.

## Distribution

Different artifacts ship through different channels:

| Artifact | Channel | Tag-driven? |
| --- | --- | --- |
| `@contextlint/core`, `cli`, `mcp-server`, `lsp-server` | npm registry | Yes — `v*` git tag triggers `publish.yml` |
| `contextlint-vscode` (`.vsix`) | GitHub Releases | Yes — same tag |
| Agent Skills (`contextlint-fix`, `-init`, `-impact`) | `gh skill install nozomi-koborinai/contextlint <skill>` | Yes — pins to git tag |
| LP | Cloudflare Pages | No — auto on `main` push (scoped via `packages/site/**` watch path) |

A single `vX.Y.Z` tag drives every channel except the LP, which deploys continuously.

## Related ADRs

For the reasoning behind individual decisions, see `docs/decisions/`. Major decisions documented there include:

- Vendor-neutral positioning (LSP / MCP as technical detail, not marketing)
- Adopting agentskills.io for skill distribution
- Evergreen LP / OG image (no hardcoded version / license / count)
- Monorepo structure with bun workspace
- Core hosts the lint pipeline; consumers never duplicate

The roadmap (`docs/roadmap.md`) tracks what's next.
