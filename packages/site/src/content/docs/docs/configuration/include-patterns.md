---
title: Include patterns
description: Specifying validation targets via include, and how it interacts with CLI arguments.
---

The `include` field uses glob patterns to specify which Markdown files contextlint validates.

## Basics

```json
{
  "include": ["docs/**/*.md"]
}
```

This setting validates every Markdown file under the `docs/` directory.

## Multiple directories

You can pass multiple globs as an array.

```json
{
  "include": ["docs/**/*.md", "specs/**/*.md", "adr/**/*.md"]
}
```

## Default

If you omit `include`, the default is `["**/*.md"]` — every Markdown file in the repository is validated.

## Precedence

The validation target is resolved with the following precedence:

1. **CLI arguments** (highest) — glob patterns passed directly on the command line
2. **`include` in the config file**
3. **Default** — `["**/*.md"]`

```bash
# Validate only specs/ via CLI argument (overrides config's include)
npx contextlint "specs/**/*.md"
```

## Exclusion patterns

contextlint does not have a separate `exclude` field. To exclude paths, use glob negation patterns (`!`).

```json
{
  "include": ["docs/**/*.md", "!docs/_drafts/**"]
}
```

Anything not matched by `include` is excluded automatically, so narrowing `include` is effectively the same as exclusion.

## Glob behavior

Internally, contextlint uses [picomatch](https://www.npmjs.com/package/picomatch). Standard glob syntax such as `*`, `**`, `?`, and `[abc]` is supported.

Directories that start with a dot (`.claude/`, `.github/`, etc.) are matched as well. If you keep Markdown files inside dot-directories and want to exclude them, write an explicit negation pattern.

```json
{
  "include": ["**/*.md", "!.claude/**", "!.github/**"]
}
```
