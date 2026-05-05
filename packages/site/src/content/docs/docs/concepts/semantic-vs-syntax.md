---
title: Semantic vs syntax linters
description: contextlint is a semantic linter; markdownlint is a syntax linter. How they divide responsibilities.
---

contextlint's tagline is "**markdownlint for syntax. contextlint for meaning.**" This is not a tool that overlaps with markdownlint — the two are **complementary, each owning a different layer**. This page lays out the difference between a semantic linter and a syntax linter.

## Layer differences

Linters split into layers depending on what they validate.

| Layer | What it validates | Examples |
|-------|------------------|----------|
| **Syntax** | Whether the notation follows the grammar | Heading levels, list notation, table syntax |
| **Format** | Whether the notation style is consistent | Trailing spaces, list marker consistency |
| **Semantic** | Whether the content is logically consistent | Required columns, ID uniqueness, existence of reference targets |

markdownlint owns **syntax and format**. contextlint owns **semantic integrity and cross-file integrity**. The two do not compete — they sit at different layers.

## Feature comparison

| Aspect                          | markdownlint | contextlint |
| ------------------------------- | :----------: | :---------: |
| Markdown syntax                 |      ✓       |      —      |
| Format and style                |      ✓       |      —      |
| Heading-level consistency       |      ✓       |      —      |
| Table syntax correctness        |      ✓       |      —      |
| Data integrity inside tables    |      —       |      ✓      |
| Existence of required sections  |      —       |      ✓      |
| Order of required sections      |      —       |      ✓      |
| ID uniqueness                   |      —       |      ✓      |
| Cross-file reference integrity  |      —       |      ✓      |
| Dependency graph validation     |      —       |      ✓      |
| Term consistency                |      —       |      ✓      |

## A concrete example

Given the same table, the two linters look at different aspects.

```markdown
| ID          | Status | Description |
| ----------- | ------ | ----------- |
| REQ-AUTH-01 |        | Login requirement |
| REQ-AUTH-01 | stable |              |
```

- **What markdownlint sees**: pipe count, separator-row formatting, whitespace handling — **whether the table is valid Markdown**
- **What contextlint sees**:
  - The `Status` column has an empty cell (TBL-002)
  - The `ID` column contains a duplicate (TBL-006)
  - The `Description` column has an empty cell (TBL-002)
  - **Whether the table content is consistent at the domain level**

Combining the two covers **both how it is written and what it says**, from each side.

## Why a semantic linter is needed

The area a syntax linter cannot cover only becomes more visible as documentation scales up.

- A link can be written in valid Markdown notation yet **point to a file that does not exist**
- A table can be syntactically correct Markdown yet **have a required column missing**
- The same ID can be defined across multiple files, and **Markdown itself raises no issue**
- A `stable` requirement can depend on a `draft` requirement, and **Markdown syntax never flags it as an error**

These are problems **invisible at the Markdown layer**. They live at the **semantic layer** rather than the grammatical layer, which is why a separate linter is needed.

## Use both together

contextlint does not replace markdownlint. Documents are validated in layers only when the two are used together.

- **markdownlint** — "Is this written correctly as Markdown?"
- **contextlint** — "Is the content consistent?"

In a CI pipeline, the recommended approach is to run both in sequence: markdownlint for syntax, contextlint for meaning — letting each focus on its area of strength.

## Next steps

- [Why contextlint exists](/docs/concepts/why-contextlint-exists/) — the background that made a semantic linter necessary
- [Rules](/docs/rules/) — specifications of every rule contextlint provides
