# contextlint

Rule-based linter for structured Markdown documents.

## Why contextlint?

Software projects often maintain structured Markdown documents — requirements, design decisions, API specs — with tables containing IDs, status fields, and cross-references. As these documents grow, problems creep in silently:

- A table is missing a required column
- Key cells (ID, Stability) are left empty
- Stability values don't match the allowed set
- Required files are missing from a zone

Existing Markdown linters (markdownlint, Vale, textlint) handle formatting and prose style, but none of them validate the **structural integrity** of document sets: table content, cross-file references, or section requirements.

contextlint fills this gap. It's a deterministic, rule-based static analysis tool that catches structural issues in seconds — no AI, no cost, CI-friendly.

## How it fits in

```
Code change → contextlint (CI, fast) → AI-based review (flexible, deep)
```

contextlint handles the mechanical checks so that AI-based tools can focus on semantic analysis.

## Packages

| Package | Description |
|---------|-------------|
| `@contextlint/core` | Rule engine and Markdown table parser |
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

| ID | Description |
|----|-------------|
| TBL-001 | Required columns must exist in tables |
| TBL-002 | Key columns must not have empty cells |
| TBL-003 | Column values must be from an allowed set |
| STR-001 | Required files must exist in the project |

## License

MIT
