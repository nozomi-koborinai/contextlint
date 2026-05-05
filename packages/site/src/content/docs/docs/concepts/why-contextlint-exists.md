---
title: Why contextlint exists
description: The integrity problems that AI-era Markdown documents face, and where contextlint stands.
---

contextlint is not tied to any specific workflow or methodology. It targets the integrity problems that **every project managing documents in Markdown** runs into. This page covers the underlying problem and how contextlint positions itself against it.

## The problem: documents break, and nobody notices

In repositories where multiple Markdown files reference each other, integrity quietly erodes over time. The following situations happen routinely.

- A file rename breaks a link, but the build passes and markdownlint passes
- A required section is missing from a design document that is supposed to follow a shared template, and the review misses it too
- A requirement ID is renamed, but the files that reference it still hold the old ID
- An AI generates a new document with a broken reference to an existing file, and nobody notices at generation time

These states are **syntactically valid Markdown**. markdownlint passes, the build passes, and CI is green. Yet **the document as a whole is no longer consistent** — closing that gap is what contextlint is for.

## Why this surfaced in the AI era

The integrity problem itself is not new. What is true, however, is that **the spread of AI-driven software development has amplified its impact**.

| Change | Effect on documents |
|--------|---------------------|
| Spread of Spec Driven Development (SDD) | Requirements, specs, and designs are written in Markdown, and AI generates code from them. **If the documents are broken, the generated code is broken too** |
| Wider adoption of ADRs / RFCs | More teams record design decisions in Markdown, increasing the volume of cross-file references |
| AI-driven document generation and editing | Markdown changes faster than humans can review every diff |
| Growing number of documents | At a scale of dozens to hundreds of cross-referenced files, manual review and grep cannot keep up |

Documents are not standalone files. They form a **dependency graph** through ID references, links, stability propagation, and so on. When that graph breaks, the damage is hard to surface and spreads silently.

## Why documents need the same kind of linter as code

Code has ESLint and type checkers — tooling that goes beyond syntax to verify whether the code is **semantically consistent**. In the Markdown world, by contrast, only syntax and formatting linters (markdownlint) existed. There was no standard tool for verifying **the semantic integrity of the content**.

Documents need a tool that plays the same role for them as `eslint` and `tsc` play for code — that is the starting point of contextlint.

## What contextlint takes responsibility for

contextlint is a linter focused on the **semantic integrity** of structured Markdown documents.

- Markdown table content (required columns, empty cells, allowed values, patterns, uniqueness, cross-column constraints)
- Existence and ordering of required sections
- Cross-file reference integrity (links, ID traceability, anchors, images)
- Health of the document dependency graph (traceability chains, circular references, orphan documents)
- Content quality (leftover placeholders, term consistency)

It is equally clear about **what it does not take on**. Markdown syntax, formatting, and style — heading-level consistency, list notation, table syntax — are out of scope. That is [markdownlint](https://github.com/DavidAnson/markdownlint)'s territory. The two are intended to be used together. See [Semantic vs syntax linters](/docs/concepts/semantic-vs-syntax/) for details.

## Who this is for

contextlint suits teams and individuals working with Markdown-centric workflows. Concrete examples include the following.

- **Spec Driven Development (SDD)** — writing requirements, specs, and designs in Markdown, then having AI generate code from them
- **ADRs (Architecture Decision Records)** — teams that record design decisions in Markdown
- **Document-driven development** — describing the design in writing before starting implementation
- **Maintaining documentation in large repositories** — at a scale of dozens to hundreds of cross-referenced Markdown files

## Next steps

- [Semantic vs syntax linters](/docs/concepts/semantic-vs-syntax/) — how contextlint and markdownlint divide responsibilities
- [Three-layer feedback design](/docs/concepts/three-layer-feedback/) — why feedback is split into LSP / MCP / CI
- [Context Graph](/docs/concepts/context-graph/) — why a document dependency graph sits at the foundation
