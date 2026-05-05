# 0001: Monorepo with bun workspace

**Status**: Accepted (initial decision, ongoing)

## Context

contextlint ships multiple deliverables that share a rule engine: a core library, a CLI, an MCP server, an LSP server, a VS Code extension, an LP site, and an Agent Skills bundle. These evolve together — a change in core's `LintMessage` type, for example, ripples to every consumer.

Options considered:

- Multi-repo (one repo per package). Consistent versions and cross-cutting changes become painful.
- Lerna / Nx / pnpm workspaces. All viable; heavier configuration than bun's built-in workspace.
- bun workspace. Built-in, fast install, native TypeScript / ESM support.

## Decision

Use bun workspace (`workspaces: ["packages/*"]` in root `package.json`).

- Each package lives under `packages/` with its own `package.json`.
- Cross-package dependencies use `workspace:*` notation.
- Root `bun run --filter '*' build` (and `typecheck`, `test`) runs across all packages.
- A single `vX.Y.Z` git tag drives all npm publishes via `publish.yml`.

## Consequences

- **+** Single source of truth for cross-cutting types (e.g. `LintMessage` lives in core; every consumer imports it).
- **+** Atomic refactors across packages in one PR.
- **+** Single install (`bun install` at root) sets up everything.
- **−** CI / hosting platforms need explicit hints — Cloudflare Pages defaults to `npm` and chokes on `workspace:*`. Resolved by setting `PACKAGE_MANAGER=bun` as an environment variable.
- **−** Contributors must use bun, not npm / pnpm / yarn. Mitigated by `"packageManager": "bun@x.y.z"` in the root `package.json`.

## Related

- `decisions/0005-core-hosts-pipeline.md` — the no-duplication rule that depends on this monorepo arrangement.
