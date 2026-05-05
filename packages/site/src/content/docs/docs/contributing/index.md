---
title: Contributing
description: How to contribute to contextlint and the conventions for development.
---

contextlint is an open source project, and contributions such as new rules, bug fixes, and documentation improvements are welcome. This category covers the repository setup, the steps for adding a rule, and the testing conventions you need to know to participate in development.

## What is in this category

- [Development setup](/docs/contributing/development-setup/) — the layout of the bun workspace, the role of each package, and the commands for build, test, and typecheck
- [Adding a new rule](/docs/contributing/adding-a-new-rule/) — the workflow from ID assignment through Zod schema, registry registration, and `schema.json` updates
- [Writing tests](/docs/contributing/writing-tests/) — how to use `bun:test` and why CJK test fixtures are mandatory

## Contribution workflow

1. Fork the repository and create one branch per issue or feature
2. Set up the project locally by following [Development setup](/docs/contributing/development-setup/)
3. Implement your change, add tests, and update the documentation according to the conventions on each page
4. Commit using the Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.) and open a pull request

Code, comments, documentation, and commit messages are all written in English. GitHub issues, pull requests, and review comments are also expected to be in English.
