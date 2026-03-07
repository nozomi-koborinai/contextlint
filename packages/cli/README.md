# @contextlint/cli

CLI for [contextlint](https://github.com/nozomi-koborinai/contextlint) —
a rule-based linter for structured Markdown documents.

## Installation

```bash
npm install -D @contextlint/cli
```

## Usage

```bash
contextlint --config contextlint.config.json "docs/**/*.md"
```

Or run without installing:

```bash
npx @contextlint/cli --config contextlint.config.json "docs/**/*.md"
```

## Configuration

Create `contextlint.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

Adding `$schema` enables autocomplete in VS Code, Cursor,
JetBrains, and other editors.

See the
[main repository](https://github.com/nozomi-koborinai/contextlint)
for the full list of rules and configuration options.

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
