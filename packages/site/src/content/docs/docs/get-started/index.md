---
title: Introduction
description: What contextlint is, and who it's for.
---

Have you ever run into something like this?

- You added a link to another file, but the target file was renamed at some point. **The link is broken, yet the build and markdownlint both pass.**
- A design document is supposed to follow the same template as every other one, but a required section silently went missing. **Code review missed it too.**
- You asked an AI to generate a new document, and several references to existing files came out broken. **Nobody noticed at generation time.**

These are all **syntactically valid Markdown**. markdownlint passes, the build passes, CI is green — and yet the document is no longer internally consistent. That is the problem contextlint sets out to solve.

contextlint is a rule-based linter that validates the **semantic integrity** of structured Markdown documents. It detects broken links, missing required sections, empty table cells, duplicate IDs, and broken cross-document dependencies — deterministically, in seconds.

## Who it's for

contextlint is aimed at teams and individuals who run a Markdown-centric workflow. For example:

- **Spec Driven Development (SDD)** — writing requirements, specs, and design in Markdown, then letting AI generate code from those documents
- **ADRs (Architecture Decision Records)** — teams that capture design decisions in Markdown
- **Document-driven development** — writing the design first, then implementing
- **Large repositories with substantial documentation** — dozens to hundreds of Markdown files cross-referencing each other

## How contextlint relates to markdownlint

contextlint specializes in **content semantics and cross-file integrity**. Markdown syntax, formatting, and style (heading-level consistency, list notation, table syntax, and so on) are out of scope — those belong to [markdownlint](https://github.com/DavidAnson/markdownlint). We recommend using both side by side.

| Concern                                | markdownlint | contextlint |
| -------------------------------------- | :----------: | :---------: |
| Markdown syntax                        |      ✓       |      —      |
| Formatting and style                   |      ✓       |      —      |
| Data integrity inside tables           |      —       |      ✓      |
| Presence of required sections          |      —       |      ✓      |
| Cross-file reference integrity         |      —       |      ✓      |
| Dependency graph validation            |      —       |      ✓      |

## Why static analysis?

You could ask an LLM to check document integrity instead, but contextlint sticks to **static analysis** on purpose. There are several reasons.

- **Reproducibility** — same input, same result. The output never depends on a prompt or temperature, so it stays stable in CI.
- **Cost** — no tokens consumed. Validating 100 files costs zero.
- **Speed** — sub-second runs. Fast enough for editor integration (LSP) to flag issues as you type.
- **Clarity** — error messages are fixed strings, which is ideal for machine processing (auto-fix, filtering in CI).

LLMs shine at **writing** documents; static analysis is the better fit for **validating** the result. Letting each side do what it's good at is contextlint's design philosophy.

## Three layers of feedback

contextlint plugs into **three points** in a document's lifecycle.

| Timing                       | Protocol | Main tools                                                       |
| ---------------------------- | -------- | ---------------------------------------------------------------- |
| **While you write**          | LSP      | VS Code / Cursor / Neovim / Helix / JetBrains                    |
| **While AI writes**          | MCP      | Claude Code / Cursor Agent / Cline / Codex / Windsurf            |
| **Before merging**           | CLI      | GitHub Actions / pre-commit / Husky / lint-staged                |

From the moment you start writing through to merge, document integrity stays under continuous check.

## Next steps

- [Installation](/docs/get-started/installation/)
- [Quick Start — AI-assisted](/docs/get-started/quick-start-ai/)
- [Quick Start — Manual](/docs/get-started/quick-start-manual/)
- [Your first lint](/docs/get-started/your-first-lint/)
