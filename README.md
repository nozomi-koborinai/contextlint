# contextlint

Rule-based linter for structured Markdown documents.

## Why contextlint?

Software projects often maintain structured Markdown documents — requirements, design decisions, API specs — with tables containing IDs, status fields, and cross-references. As these documents grow, problems creep in silently:

- A requirement ID referenced in a design doc no longer exists
- A table is missing a required column
- IDs don't follow the agreed format
- Required sections are absent

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

## Rule Categories

| Category | ID Prefix | Description |
|----------|-----------|-------------|
| Structure | STR-* | File existence, naming conventions, directory structure |
| Table Format | TBL-* | Column presence, value validation, ID format |
| Sections | SEC-* | Required sections per file type |
| Content Quality | QUA-* | Anti-pattern detection, vague expressions, TODO/FIXME |
| Traceability | TRC-* | Cross-file reference validation |

## License

MIT
