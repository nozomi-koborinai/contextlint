# contextlint

A rule-based linter for structured Markdown documents.

## Why contextlint?

In the era of AI-driven development, methodologies like SDD (Spec Driven Development) are gaining traction — writing specifications in Markdown first, then letting AI generate implementation based on those documents. As projects adopt document-driven workflows, the number of interconnected Markdown files grows: requirements, design decisions, API specs, ADRs (Architecture Decision Records), RFCs (Request for Comments), and more.

These documents form a dependency graph. IDs reference other IDs, files link to other files, and stability levels flow downstream. When this graph breaks — a deleted requirement, a mistyped ID, a missing section — the consequences are silent. And because LLM-based reviews are inherently non-deterministic, relying on them alone to catch structural inconsistencies is unreliable.

contextlint provides **deterministic, static validation** for structured Markdown. It catches broken references, duplicate IDs, missing sections, and structural issues in seconds — no AI, no cost, CI-friendly.

### What contextlint checks (and what it doesn't)

contextlint focuses on **content semantics and cross-file integrity**. For Markdown syntax, formatting, and style, use [markdownlint](https://github.com/DavidAnson/markdownlint) alongside contextlint — they complement each other well.

| Domain | Tool |
|--------|------|
| Table formatting, heading style, line length | markdownlint |
| Table content (IDs, required columns, value validation) | contextlint |
| Markdown syntax and style | markdownlint |
| Cross-file references, traceability, link integrity | contextlint |
| Section coverage, file structure | contextlint |

## Packages

| Package | Description |
|---------|-------------|
| `@contextlint/core` | Rule engine and Markdown parser |
| `@contextlint/cli` | CLI entry point (`contextlint` command) |
| `@contextlint/mcp-server` | MCP server for AI tool integration |
| `@contextlint/preset-dna` | Preset rules for [software-dna-template](https://github.com/nozomi-koborinai/software-dna-template) |

## Usage

### With a config file

```bash
contextlint --config contextlint.config.json "docs/**/*.md"
```

### With a preset

Presets bundle rules so you don't need a config file in the target repository.

```bash
contextlint --preset dna --cwd /path/to/project "docs/**/*.md"
```

Available presets:

| Preset | Description |
|--------|-------------|
| `dna` | Health check for [software-dna-template](https://github.com/nozomi-koborinai/software-dna-template) projects |

## Rules

### Table rules

| ID | Description | Config |
|----|-------------|--------|
| TBL-001 | Required columns must exist in tables | `requiredColumns` |
| TBL-002 | Key columns must not have empty cells | `columns` |
| TBL-003 | Column values must be from an allowed set | `column`, `values` |
| TBL-004 | Cell values must match a regex pattern | `column`, `pattern` |
| TBL-006 | IDs must be unique across all matched files | `files`, `column`, `idPattern` |

### Section / Structure rules

| ID | Description | Config |
|----|-------------|--------|
| SEC-001 | Required sections must exist in the document | `sections`, `files` (optional) |
| STR-001 | Required files must exist in the project | `files` |

### Reference rules

| ID | Description | Config |
|----|-------------|--------|
| REF-001 | Relative Markdown links must point to existing files | — |
| REF-002 | Defined IDs must be referenced; referenced IDs must exist | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | An item's stability must not exceed the stability of items it depends on | `stabilityColumn`, `stabilityOrder`, `definitions`, `references` |
| REF-004 | Cross-zone links must be declared in the zone's overview | `zonesDir`, `dependencySection` |

### Use cases

These rules are designed to be general-purpose. Some examples:

- **SDD (Spec Driven Development)** — Validate that specs reference existing requirements and that IDs are consistent across files
- **ADRs (Architecture Decision Records)** — Ensure all ADRs contain required sections (Status, Context, Decision) and that status transitions are valid
- **RFCs (Request for Comments)** — Check that RFC documents include required headings and that cross-references between proposals are not broken
- **Any structured Markdown project** — Catch broken links, duplicate IDs, and missing files in CI

## License

MIT
