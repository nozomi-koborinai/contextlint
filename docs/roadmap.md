# Roadmap

This is a working roadmap, not a contract. Items here may move, combine, or drop based on what's actually useful and what's not. Dates are intentionally absent — version numbers and the "Recently shipped" section serve as the timeline.

## Recently shipped (v1.0, 2026-05)

- Landing page at <https://contextlint.dev>
- npm packages: core, cli, mcp-server, lsp-server (all v1.0.x)
- VS Code / Cursor extension (`.vsix`) attached to GitHub Releases
- Agent Skills bundle (`contextlint-fix`, `contextlint-init`, `contextlint-impact`) via agentskills.io / `gh skill install`
- Internal docs (this directory)

## Planned (v1.x)

### Marketplace publishing

Publish `contextlint-vscode` to:

- VS Code Marketplace
- Open VSX (for VSCodium / Cursor users who pull from there)

Currently shipped only as a VSIX attached to GitHub Releases.

### Starlight product docs

Add product documentation under `contextlint.dev/docs/`:

- Per-rule reference (`/docs/rules/<id>/`)
- CLI reference, MCP / LSP setup guides
- Examples and recipes

Built as a `packages/site` extension via Starlight integration; kept evergreen and version-aware.

### Skills validation in CI

Run `skills-ref validate ./skills/*` on PR to catch broken `SKILL.md` frontmatter before tags fly. Low-cost addition to `ci.yml`.

### contextlint dogfooding in CI

Now that `docs/` exists, wire `npx contextlint` into `ci.yml` to lint this very directory on every PR. Catches rot in the project's own internal docs the same way it catches rot in users' repos.

## Under consideration (no commit yet)

- New rule categories driven by user reports (e.g., `IMG-*` for image-related checks).
- Optional formatter — auto-rewrite for some violations beyond what `contextlint-fix` does today.
- Richer `contextlint compile` output (more useful SKILL.md for downstream agents).

## Won't do (for now)

- Replicating markdownlint formatting rules. Out of scope; we recommend running both linters.
- A central skill registry. Relying on agentskills.io / GitHub search instead.
- A plugin system for custom rules in user repos. The rule-author skill + monkey-patch story isn't compelling enough yet.

## See also

- `docs/architecture.md` for the current system shape.
- `docs/decisions/` for the reasoning behind major choices.
