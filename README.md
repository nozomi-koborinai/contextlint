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

Create `contextlint.config.json`:

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
| CTX-002 | Terms must match glossary definitions | `glossary`, `termColumn`, `aliasColumn`, `section`?, `files`? |

### Graph rules

| ID | Description | Config |
| --- | --- | --- |
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

    // GRP-002: Document reference graph must be acyclic (no circular references)
    { "rule": "grp002", "options": { "files": "docs/**/*.md", "exclude": ["CHANGELOG.md"] } }
    // GRP-003: Every document must have at least one incoming reference
    { "rule": "grp003", "options": { "files": "docs/**/*.md", "entryPoints": ["README.md", "index.md"] } }
  ]
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
