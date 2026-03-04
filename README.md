# contextlint

Rule-based linter for structured Markdown documents.

## What is contextlint?

contextlint is a deterministic, rule-based static analysis tool for structured Markdown. It validates table structures, required sections, ID formats, and cross-file traceability — things that existing Markdown linters (markdownlint, Vale, textlint) don't cover.

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
