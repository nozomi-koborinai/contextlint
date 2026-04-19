# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [日本語](README.ja.md) | [中文](README.zh.md) | [한국어](README.ko.md)

A rule-based linter for structured Markdown documents.
Catch broken references, duplicate IDs, missing sections, and
structural issues — deterministically, in seconds, CI-friendly.

## Why contextlint?

In the era of AI-driven development, methodologies like
SDD (Spec Driven Development) are gaining traction —
writing specifications in Markdown first, then letting AI
generate implementation based on those documents. As projects
adopt document-driven workflows, the number of interconnected
Markdown files grows: requirements, design decisions, API specs,
ADRs, RFCs, and more.

These documents form a dependency graph. IDs reference other IDs,
files link to other files, and stability levels flow downstream.
When this graph breaks — a deleted requirement, a mistyped ID,
a missing section — the consequences are silent.

contextlint provides **deterministic, static validation** for
structured Markdown. No AI, no cost, CI-friendly.

> contextlint focuses on **content semantics and cross-file
> integrity**. For Markdown syntax, formatting, and style, use
> [markdownlint](https://github.com/DavidAnson/markdownlint)
> alongside contextlint — they complement each other well.

## Quick Start

Install:

```bash
npm install -D @contextlint/cli
```

Generate a config interactively:

```bash
npx contextlint init
```

Or create `contextlint.config.json` manually:

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

Run:

```bash
npx contextlint
```

contextlint auto-detects `contextlint.config.json` from the current
or any parent directory. The `include` field defines default file
patterns; CLI arguments override it. When neither is set, `**/*.md`
is used.

Output:

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

> Adding `$schema` enables autocomplete in VS Code, Cursor,
> JetBrains, and other editors.

## Rules

### Table rules

| ID | Description | Config |
| --- | --- | --- |
| TBL-001 | Required columns must exist in tables | `requiredColumns`, `section`?, `files`? |
| TBL-002 | Key columns must not have empty cells | `columns`?, `files`? |
| TBL-003 | Column values must be from an allowed set | `column`, `values`, `files`? |
| TBL-004 | Cell values must match a regex pattern | `column`, `pattern`, `files`? |
| TBL-005 | Cross-column conditional constraints | `when`, `then`, `section`?, `files`? |
| TBL-006 | IDs must be unique across all matched files | `files`, `column`, `idPattern`? |

### Section / Structure rules

| ID | Description | Config |
| --- | --- | --- |
| SEC-001 | Required sections must exist | `sections`, `files`? |
| SEC-002 | Sections must appear in order | `order`, `level`?, `section`?, `files`? |
| STR-001 | Required files must exist in the project | `files` |

### Reference rules

| ID | Description | Config |
| --- | --- | --- |
| REF-001 | Relative links must point to existing files | `exclude`? |
| REF-002 | Defined IDs must be referenced; referenced IDs must exist | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | Stability must not exceed that of dependencies | `stabilityColumn`, `stabilityOrder`, `definitions`, `references`, `idColumn`?, `idPattern`? |
| REF-004 | Cross-zone links must be declared in overview | `zonesDir`, `dependencySection`? |
| REF-005 | Anchor fragments must point to existing headings | `files`? |
| REF-006 | Image references must point to existing files | `exclude`? |

### Checklist rules

| ID | Description | Config |
| --- | --- | --- |
| CHK-001 | All checklist items must be checked | `section`?, `files`? |

### Context rules

| ID | Description | Config |
| --- | --- | --- |
| CTX-001 | Sections must contain meaningful content, not placeholders | `section`?, `placeholders`?, `files`? |
| CTX-002 | Terms must match glossary definitions | `glossary`, `termColumn`, `aliasColumn`?, `section`?, `files`? |

### Graph rules

| ID | Description | Config |
| --- | --- | --- |
| GRP-001 | Every ID must be traceable through all stages of the document chain | `chain`, `idPattern`? |
| GRP-002 | Document reference graph must be acyclic (no circular references) | `files`?, `exclude`? |
| GRP-003 | Every document must have at least one incoming reference | `files`?, `entryPoints`? |

## Configuration

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",

  // Default file patterns (used when no files are specified on CLI)
  "include": ["docs/**/*.md"],

  "rules": [
    // TBL-001: Required columns must exist in tables
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status", "Description"], "files": "**/requirements.md" } },

    // TBL-002: Key columns must not have empty cells
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"], "files": "**/requirements.md" } },

    // TBL-003: Column values must be from an allowed set
    { "rule": "tbl003", "options": { "column": "Status", "values": ["draft", "review", "stable"], "files": "**/requirements.md" } },

    // TBL-004: Cell values must match a regex pattern
    { "rule": "tbl004", "options": { "column": "ID", "pattern": "^[A-Z]+-[A-Z]+-\\d{2}$", "files": "**/requirements.md" } },

    // TBL-005: When a condition on one column is met, another column must satisfy a constraint
    { "rule": "tbl005", "options": { "when": { "column": "Status", "equals": "Done" }, "then": { "column": "Date", "notEmpty": true } } },

    // TBL-006: IDs must be unique across all matched files
    { "rule": "tbl006", "options": { "files": "**/requirements.md", "column": "ID" } },

    // SEC-001: Required sections must exist in the document
    { "rule": "sec001", "options": { "sections": ["Overview", "Requirements"], "files": "**/overview.md" } },

    // SEC-002: Sections must appear in the specified order
    //   Basic — check order across the whole file:
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"] } },
    //   With level — group by parent heading and check each group independently:
    { "rule": "sec002", "options": { "order": ["Overview", "Requirements", "Design"], "level": 3, "files": "**/spec.md" } },
    //   With section — scope to a specific parent group only:
    { "rule": "sec002", "options": { "order": ["Endpoints", "Error Handling"], "level": 3, "section": "API" } },

    // STR-001: Required files must exist in the project
    { "rule": "str001", "options": { "files": ["docs/overview.md", "docs/requirements.md"] } },

    // CHK-001: All checklist items must be checked
    { "rule": "chk001", "options": { "section": "Review Checklist", "files": "docs/reviews/*.md" } },

    // CTX-001: Sections must contain meaningful content, not placeholders
    { "rule": "ctx001", "options": { "section": "Overview", "files": "docs/**/*.md" } },

    // REF-001: Relative Markdown links must point to existing files
    { "rule": "ref001", "options": { "exclude": ["_references/**"] } },

    // REF-002: Defined IDs must be referenced; referenced IDs must exist
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/design.md", "**/overview.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-"
      }
    },

    // REF-003: An item's stability must not exceed the stability of items it depends on
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Status",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/design.md"]
      }
    },

    // REF-004: Cross-zone links must be declared in the zone's overview
    { "rule": "ref004", "options": { "zonesDir": "docs/zones" } },

    // REF-005: Anchor fragments must point to headings that exist in the target file
    { "rule": "ref005", "options": { "files": "docs/**/*.md" } },

    // REF-006: Image references must point to files that exist
    { "rule": "ref006", "options": { "exclude": ["*.svg"] } },

    // GRP-001: Every ID must be traceable through all stages of the document chain
    {
      "rule": "grp001",
      "options": {
        "chain": [
          { "stage": "Requirements", "files": "**/requirements.md", "idColumn": "ID" },
          { "stage": "Design", "files": "**/design.md", "refColumn": "Requirement" },
          { "stage": "Test", "files": "**/test-plan.md", "refColumn": "Covers" }
        ],
        "idPattern": "^REQ-\\d{3}$"
      }
    },

    // GRP-002: Document reference graph must be acyclic (no circular references)
    { "rule": "grp002", "options": { "files": "docs/**/*.md", "exclude": ["CHANGELOG.md"] } },
    // GRP-003: Every document must have at least one incoming reference
    { "rule": "grp003", "options": { "files": "docs/**/*.md", "entryPoints": ["README.md", "index.md"] } }
  ],

  // Context Compiler: generate SKILL.md for Claude Code
  "compile": {
    "skill": {
      "name": "my-project",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  }
}
```

## Use cases

These rules are designed to be general-purpose. Some examples:

- **SDD (Spec Driven Development)** — Validate that specs
  reference existing requirements and that IDs are consistent
  across files
- **ADRs (Architecture Decision Records)** — Ensure all ADRs
  contain required sections (Status, Context, Decision) and
  that status transitions are valid
- **RFCs (Request for Comments)** — Check that RFC documents
  include required headings and that cross-references between
  proposals are not broken
- **Any structured Markdown project** — Catch broken links,
  duplicate IDs, and missing files in CI

## Commands

### Init

```bash
contextlint init                    # Interactive config generation
```

Generates `contextlint.config.json` by selecting language, file patterns,
and rule categories interactively. Supports English, Japanese, Chinese,
and Korean.

### Lint (default)

```bash
contextlint [files...]              # Lint structured Markdown documents
contextlint --format json           # Machine-readable output
contextlint --watch                 # Re-run on file changes
```

### Impact Analysis

```bash
contextlint impact <file>           # Analyze change impact + lint affected files
contextlint impact docs/req.md --format json
```

### Context Slice

```bash
contextlint slice <query>           # Extract related documents
contextlint slice docs/req.md --depth 3
```

### Document Graph

```bash
contextlint graph                   # Show document dependency graph
contextlint graph --format json
```

### Compile

```bash
contextlint compile                 # Generate SKILL.md for Claude Code
contextlint compile --dry-run       # Preview without writing
contextlint compile --outdir .claude/skills/my-skill
```

## CLI Options

| Option | Description |
| ------ | ----------- |
| `[files...]` | File or glob patterns to lint (overrides `include` in config) |
| `--config <path>` | Path to `contextlint.config.json` |
| `--format <format>` | Output format: `human` (default) or `json` |
| `--cwd <path>` | Working directory |

### JSON output

Use `--format json` for machine-readable output (useful for CI and editor integrations):

```bash
npx contextlint --format json
```

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  }
]
```

## CI Integration

### GitHub Actions

A ready-to-use composite action is included in this repository.
It runs contextlint with `--format json` and creates inline annotations on PRs.

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

Or run directly:

```yaml
- run: npx @contextlint/cli
```

## Watch Mode

Re-run validation automatically when files change:

```bash
npx contextlint --watch
npx contextlint --watch docs/**/*.md
npx contextlint --watch --config contextlint.config.json
```

Watch mode runs an initial full lint, then monitors the working directory
for `.md` file changes. On each change it re-lints **all** matched files
(required for cross-file rules such as REF-002 and TBL-006), clears the
terminal, and displays the updated results with a timestamp. Rapid changes
are debounced (300 ms). Exit with Ctrl+C.

## MCP Server

contextlint can run as an
[MCP](https://modelcontextprotocol.io/) server, allowing AI
tools like Claude and Cursor to lint Markdown documents
during a conversation.

```bash
npm install -D @contextlint/mcp-server
```

Add to your `mcp.json`
(e.g. `.cursor/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "contextlint": {
      "command": "npx",
      "args": ["@contextlint/mcp-server"]
    }
  }
}
```

Available tools:

| Tool | Description |
| ---- | ----------- |
| `lint` | Lint Markdown content directly with specified rules |
| `lint-files` | Lint files matching glob patterns using a config file |
| `context-graph` | Build and return the document dependency graph for the project |
| `context-slice` | Extract the minimal set of documents relevant to a given query |
| `impact-analysis` | Analyze which documents are affected by changes to a given file |
| `compile-context` | Compile document structure into LLM context text |

## LSP Server

contextlint ships a Language Server (`@contextlint/lsp-server`) that
any LSP-capable editor can integrate for in-editor diagnostics, hover
info, and Quick Fixes. The server walks up from the workspace root to
discover `contextlint.config.json`, matching the CLI / MCP behaviour.

> A dedicated VS Code / Cursor extension is tracked separately and
> will be published to the Marketplace in a future release. For now,
> the snippets below work in every editor that speaks LSP.

Install:

```bash
npm install -D @contextlint/lsp-server
```

### Neovim (with [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig))

```lua
-- In your init.lua or after/plugin/contextlint.lua
local configs = require('lspconfig.configs')
local util = require('lspconfig.util')

if not configs.contextlint then
  configs.contextlint = {
    default_config = {
      cmd = { 'npx', 'contextlint-lsp' },
      filetypes = { 'markdown' },
      root_dir = util.root_pattern('contextlint.config.json', '.git'),
      single_file_support = false,
    },
  }
end

require('lspconfig').contextlint.setup({})
```

### Helix (`~/.config/helix/languages.toml`)

```toml
[language-server.contextlint]
command = "npx"
args = ["contextlint-lsp"]

[[language]]
name = "markdown"
language-servers = ["contextlint"]
```

### JetBrains IDEs (via [LSP4IJ](https://plugins.jetbrains.com/plugin/23257-lsp4ij))

1. Install the **LSP4IJ** plugin from the Marketplace.
2. Open **Settings → Languages & Frameworks → Language Servers → Add**:
   - **Name**: `contextlint`
   - **Command**: `npx contextlint-lsp`
   - **Mapping → File name patterns**: `*.md`

### Notes

- Diagnostics cover both document-scope rules (TBL-002, CHK-001, …)
  and project-scope rules (REF-001, REF-002, TBL-006,
  GRP-001/002/003, CTX-002, …) across the entire workspace, in real
  time as you edit.
- Quick Fixes are available for **CHK-001** (check the list item) and
  **TBL-002** (insert a `TODO` placeholder).
- After external file changes (e.g. `git pull`), reload the editor
  window to refresh the workspace cache.

## Programmatic API

### Context Graph

`@contextlint/core` exposes a Context Graph API for analysing
document dependencies programmatically. This is useful for building
tools that need to understand how Markdown documents relate to each
other.

```typescript
import {
  parseDocument,
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
  classifyImpact,
  compileContext,
} from "@contextlint/core";
import type { ContextGraph, GraphNode, GraphEdge } from "@contextlint/core";
```

| Function | Description |
| -------- | ----------- |
| `buildContextGraph(documents)` | Build a dependency graph from parsed documents |
| `getImpactSet(graph, filePath)` | Get all files affected by changing a given file (direct + transitive) |
| `getContextSlice(graph, documents, query, maxDepth?)` | Get the minimal set of files relevant to a query (file path or ID) |
| `topologicalSort(graph)` | Topological sort of the document graph (dependency order) |
| `getComponents(graph)` | Get connected components (clusters of related files) |
| `classifyImpact(graph, filePath)` | Classify impact as direct vs transitive |
| `compileContext(patterns, config, cwd)` | Compile documents + config into SKILL.md content |

Example:

```typescript
import { readFileSync } from "node:fs";
import { parseDocument, buildContextGraph, getImpactSet } from "@contextlint/core";

// Parse documents
const documents = new Map();
documents.set("docs/overview.md", parseDocument(readFileSync("docs/overview.md", "utf-8")));
documents.set("docs/requirements.md", parseDocument(readFileSync("docs/requirements.md", "utf-8")));
documents.set("docs/design.md", parseDocument(readFileSync("docs/design.md", "utf-8")));

// Build the graph
const graph = buildContextGraph(documents);

// What files are impacted if requirements.md changes?
const impacted = getImpactSet(graph, "docs/requirements.md");
// => ["docs/design.md", "docs/overview.md"]
```

## Context Compiler

The Context Compiler is a deterministic pipeline that transforms your
documents and config into a `SKILL.md` file for
[Claude Code custom skills](https://docs.anthropic.com/en/docs/claude-code).
Same config + same documents always produces the same output -- no LLM
involved.

### How it works

1. Load documents matching `include` patterns
2. Build the dependency graph and classify each document's role
   (entry, hub, leaf, bridge, isolated)
3. Extract document profiles (outline, table schemas, references)
4. Describe active lint rules in natural language
5. Synthesize everything into a single SKILL.md

### Config

Add a `compile` section to `contextlint.config.json`:

```json
{
  "include": ["docs/**/*.md"],
  "compile": {
    "skill": {
      "name": "my-project-docs",
      "description": "Validate and maintain project documentation"
    },
    "outdir": ".claude/skills/my-project",
    "sections": {
      "architecture": true,
      "rules": true,
      "dependencies": true,
      "workflow": true
    }
  },
  "rules": []
}
```

| Field | Description |
| ----- | ----------- |
| `skill.name` | Skill name for SKILL.md frontmatter (required) |
| `skill.description` | Skill description for SKILL.md frontmatter (required) |
| `outdir` | Output directory (default: `.claude/skills/contextlint`) |
| `sections.architecture` | Include architecture overview |
| `sections.rules` | Include active lint rules |
| `sections.dependencies` | Include dependency graph |
| `sections.workflow` | Include workflow instructions |

### Usage

```bash
# Generate SKILL.md
contextlint compile

# Preview without writing
contextlint compile --dry-run

# Custom output directory
contextlint compile --outdir .claude/skills/my-skill
```

### CI integration

Add to your CI pipeline to keep SKILL.md in sync with documentation:

```yaml
- run: npx contextlint compile --dry-run
```

## Packages

| Package | Description |
| ------- | ----------- |
| `@contextlint/core` | Rule engine and Markdown parser |
| `@contextlint/cli` | CLI entry point (`contextlint` command) |
| `@contextlint/mcp-server` | MCP server for AI tool integration |

## Resources

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## License

[MIT](LICENSE)
