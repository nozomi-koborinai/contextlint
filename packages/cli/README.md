# @contextlint/cli

CLI for [contextlint](https://github.com/nozomi-koborinai/contextlint) —
a rule-based linter for structured Markdown documents.

## Installation

```bash
npm install -D @contextlint/cli
```

## Usage

```bash
npx contextlint
```

contextlint auto-detects `contextlint.config.json` from the current
or any parent directory. You can also specify a config path explicitly:

```bash
npx contextlint --config path/to/contextlint.config.json
```

File patterns can be passed as arguments to override the `include` field:

```bash
npx contextlint "docs/**/*.md"
```

## Configuration

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

Adding `$schema` enables autocomplete in VS Code, Cursor,
JetBrains, and other editors. The `include` field defines default
file patterns; CLI arguments override it. When neither is set,
`**/*.md` is used.

See the
[main repository](https://github.com/nozomi-koborinai/contextlint)
for the full list of rules and configuration options.

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
