# 0005: core hosts the lint pipeline; consumers never duplicate

**Status**: Accepted (enforced)

## Context

Three packages need to lint files: `cli`, `mcp-server`, `lsp-server`. Each could implement its own glob → read → parse → run-rules → format pipeline. Tempting to "just inline it for now". But:

- Bug fixes in the pipeline would need synchronized PRs across three packages.
- Output formatting (human / JSON) drift between consumers is a UX hazard.
- Config loading rules (precedence, defaults, walk-up search) are tricky enough to deserve a single owner.

This concern was hit twice during early development:

- Issue #52: `lintFiles` was duplicated between cli and mcp-server.
- Issue #53: `findConfig` / `loadConfig` were duplicated.

Both were consolidated into core.

## Decision

`@contextlint/core` is the **single source of truth** for:

- The lint pipeline (`lint-files.ts`)
- Config loading (`config.ts`: `findConfig`, `loadConfig`)
- Result formatting (`formatFileResults`, `formatContentResults`)

Consumers (`cli`, `mcp-server`, `lsp-server`) import from core and assemble user-facing layers on top. They never re-implement these.

`lintFiles` is intentionally **synchronous** (`globSync` + `readFileSync`). Do not introduce an async variant — that would split the pipeline.

## Consequences

- **+** Single bug-fix surface for the lint pipeline.
- **+** Consistent output across CLI, MCP, LSP.
- **+** New consumers (e.g., a future GitHub Action wrapper) start from a vetted base.
- **−** Anyone touching the pipeline must be aware their change affects every consumer. CI catches breakage but reviewers should still ack the cross-package impact.
- **−** Synchronous-only constraint may bite if a future consumer needs async (e.g., streaming over a network protocol). Revisit if it actually happens; don't optimize prematurely.

## Related

- CLAUDE.md (the "CLI / MCP parity" section) restates this rule for everyone working in the repo.
