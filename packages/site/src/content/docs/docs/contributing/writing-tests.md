---
title: Writing tests
description: Testing conventions for contextlint and why Japanese, Korean, and Chinese fixtures are mandatory.
---

All contextlint tests are written with [`bun:test`](https://bun.sh/docs/cli/test). Every rule must have unit tests, and as a project convention, those tests must include **Japanese, Korean, and Chinese fixtures**. This page covers test file layout, the basics of the test runner, and the rationale behind the CJK requirement.

## File layout

Test files live next to the rule body, following the pattern `<rule-id>.test.ts`.

```text
packages/core/src/rules/
├── tbl-001.ts
├── tbl-001.test.ts
├── tbl-002.ts
├── tbl-002.test.ts
└── ...
```

Test files are excluded from build via `tsconfig.json`, but they are included in ESLint and typecheck (`tsconfig.eslint.json`). Test code must be written under the same strict settings as production code.

## Basics of bun:test

`bun:test` exposes `describe` / `it` / `expect`. The standard flow is to pass Markdown directly as a string, parse it with `parseDocument`, and then run `runRules`.

```typescript
import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
```

The path passed to the runner can be any placeholder string such as `"test.md"`. For tests that exercise the `files` option, pass a path that is meant to match.

## What to cover

At a minimum, every rule's test file should cover the following.

- **Happy path** — Markdown without violations produces zero messages
- **Violation detection** — Markdown with violations produces the expected messages (count, `ruleId`, `severity`, and the key parts of `message`)
- **Multiple violations** — multiple violations within the same file are reported in parallel
- **Option branches** — every option (such as `section`, `files`, column names, allowed-value lists) narrows the check as intended
- **CJK fixtures** — verification with Japanese, Korean, and Chinese headings, column names, and cell values (see below)

## CJK fixtures are mandatory

Every rule must include **Japanese, Korean, and Chinese** test fixtures. This is a core convention of contextlint.

### Why mandatory

Because contextlint targets internationalized Markdown, it must guarantee that CJK characters (Japanese, Chinese, Korean) in column names, section headings, cell values, and IDs are **parsed and compared correctly**. CJK characters can behave differently from ASCII in several ways.

- **Normalization** — on paths that go through Unicode normalization (NFC / NFD), composed characters can be decomposed and stop matching
- **Trimming** — the full-width space (U+3000) is not removed by ASCII `trim()`
- **Regular expressions** — `\w` and `\b` assume ASCII, and their behavior on CJK characters can be counter-intuitive
- **Comparison** — string comparison of table headers or section names may fail across half-width/full-width forms or visually similar characters

These problems do not surface in tests that only use English. They become bugs that CJK users only discover after deploying contextlint to production. To prevent that, the convention is to **prove with tests that the rule implementation is language-agnostic**.

### How to write them

Add **happy-path and violation-detection** pairs for each of the three languages. Using `tbl-001.test.ts` as an example:

```typescript
it("validates required columns with Japanese column names", () => {
  const md = `
| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-01 | ユーザー認証 | draft |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  expect(runRules([rule], doc, "test.md")).toHaveLength(0);
});

it("reports missing Japanese column names", () => {
  const md = `
| ID | 要件 |
|----|------|
| REQ-01 | ユーザー認証 |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  const messages = runRules([rule], doc, "test.md");
  expect(messages).toHaveLength(1);
  expect(messages[0].message).toContain("安定度");
});
```

Add the same kind of pairs for Korean (`요구사항` / `안정성`) and Chinese (`需求` / `稳定性`). For checklist or section rules, prepare fixtures that rewrite the heading or checklist item text in CJK.

## Running tests

Run the following from the repository root to execute every package's tests at once.

```bash
bun test
```

To narrow the run to a single rule, filter by file name.

```bash
bun test packages/core/src/rules/tbl-001.test.ts
```

After tests pass, it is recommended to also run typecheck, build, and ESLint.

```bash
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

## Related

- [Adding a new rule](/docs/contributing/adding-a-new-rule/) — the full implementation flow including tests
- [Development setup](/docs/contributing/development-setup/) — bun setup and the command list
