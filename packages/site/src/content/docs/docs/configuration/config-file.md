---
title: Config file
description: Structure of contextlint.config.json and an overview of each field.
---

The contextlint config file is named `contextlint.config.json` and lives at the repository root. It is a plain JSON file.

## Minimal example

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" }
  ]
}
```

## Fields

| Field | Type | Required | Overview |
|-------|------|----------|----------|
| `$schema` | string | Recommended | Enables editor autocomplete |
| `include` | string[] | Optional | Glob patterns for files to validate. See [Include patterns](/docs/configuration/include-patterns/) |
| `rules` | object[] | Required | Array of rules to enable. See [Rules](/docs/rules/) for each rule's spec |

## $schema

Adding `$schema` enables autocomplete and inline validation when editing the config file in VS Code, Cursor, JetBrains, and other editors. To pin against a release, replace `main` in the URL with a tag name such as `v1.0.0`.

## Validation

The config file is validated at runtime against a Zod schema. If a field has the wrong type or you specify an unknown rule ID, contextlint prints a user-facing error message at startup.
