---
title: Adding a new rule
description: Step-by-step workflow for implementing a new rule in contextlint.
---

This page walks through the steps for adding a new rule to contextlint, from ID assignment through `schema.json` updates. Each rule lives in its own file at `packages/core/src/rules/<rule-id>.ts` and uses a Zod schema as the single source of truth for its options.

## 1. Assign an ID

Pick a category for the new rule and assign **the next available number** within it, padded to three digits.

| Prefix | Category | What it validates |
|--------|----------|-------------------|
| TBL | Table | Table content (required columns, empty cells, allowed values, patterns, cross-column constraints, cross-file ID uniqueness) |
| SEC | Section | Section headings (existence, ordering) |
| STR | Structure | Project-level file existence |
| REF | Reference | Links, anchors, ID references, stability consistency, zone dependencies, image references |
| CHK | Checklist | Checklist completion state |
| CTX | Context | Content quality (placeholder detection, term consistency) |
| GRP | Graph | Document dependency graph (traceability, circular references, orphan documents) |

For example, if you are adding a rule to the TBL category, the next slot after the existing TBL-001 through TBL-006 is **TBL-007**.

The rule ID format is `<PREFIX>-<3 digits>` (for documentation and log display), and the registry key is the lowercase concatenation `<prefix><3 digits>` (for example, `tbl007`).

## 2. Create the rule file

Create `packages/core/src/rules/<id>.ts`. For `TBL-007`, that is `packages/core/src/rules/tbl-007.ts`.

The minimum skeleton looks like this.

```typescript
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { globMatch } from "../utils/glob-match.js";

export const tbl007Schema = z.object({
  // Rule-specific options
  files: z.string().optional(),
}).strict();

export type Tbl007Options = z.infer<typeof tbl007Schema>;

export function tbl007(options: Tbl007Options): Rule {
  const isMatch = options.files ? globMatch(`**/${options.files}`) : null;

  return {
    id: "TBL-007",
    description: "Short English description of what this rule checks",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      // Walk tables or sections and report violations via context.report()
    },
  };
}
```

## 3. Define the Zod schema

Each rule uses **its Zod schema as the single source of truth**. Do not write a hand-rolled interface; derive the type with `z.infer<typeof xxxSchema>`.

- The schema name is `<prefix><number>Schema` (for example, `tbl007Schema`)
- Append `.strict()` to reject unknown fields
- For options that take a regular expression, use `regexString` from `utils/regex-string.ts` to catch invalid patterns at config load time
- Rules that accept a `files?: string` option for file matching must follow the convention: variable name `isMatch`, fallback `null`, and prefix `**/${options.files}`

The registry calls `schema.parse(options)`, so `as` casts and manual validation are unnecessary inside the rule body.

## 4. Register in the registry

Edit `packages/core/src/registry.ts` to register the new rule.

```typescript
import { tbl007, tbl007Schema } from "./rules/tbl-007.js";

const registry = {
  // ... existing rules ...
  tbl007: defineRule(tbl007Schema, tbl007),
};
```

`defineRule` pairs the schema with the factory so that `resolveRule` can call it through `schema.parse()`. Zod validation errors are automatically converted into user-facing messages with the rule name and field path.

## 5. Update `schema.json`

`schema.json` at the repository root is the JSON Schema that powers editor autocomplete for `contextlint.config.json`. Whenever you add a rule, you **must add a matching entry** to `properties.rules.items.oneOf`.

Follow the format of existing rules (for example, TBL-001).

```json
{
  "type": "object",
  "description": "TBL-007: Short description.",
  "properties": {
    "rule": { "const": "tbl007" },
    "options": {
      "type": "object",
      "description": "Options for TBL-007.",
      "properties": {
        // Fields that match the Zod schema
      },
      "required": ["..."],
      "additionalProperties": false
    }
  },
  "required": ["rule", "options"],
  "additionalProperties": false
}
```

In CI, `packages/core/src/schema.test.ts` verifies the consistency between the registry and `schema.json`. If you forget to add an entry, or leave a stale entry behind after removing a rule, the test fails.

## 6. Add tests

Create `<id>.test.ts` in the same directory as the rule file (for example, `packages/core/src/rules/tbl-007.test.ts`).

Tests are written with `bun:test`. Cover **the happy path, violation detection, and option-by-option behavior**, and always include **Japanese, Korean, and Chinese** test fixtures. See [Writing tests](/docs/contributing/writing-tests/) for the details of the CJK requirement.

## 7. Add documentation

Add or update the user-facing documentation in each language.

- `packages/site/src/content/docs/ja/docs/rules/<id>.md` (Japanese)
- `packages/site/src/content/docs/en/docs/rules/<id>.md` (English)
- `packages/site/src/content/docs/ko/docs/rules/<id>.md` (Korean)
- `packages/site/src/content/docs/zh/docs/rules/<id>.md` (Chinese)

Each rule page follows this structure.

1. Overview (what it detects)
2. Why you need it (what kind of issue it prevents)
3. Options (field table)
4. Violation example and fix (Bad → Good)
5. Config example (excerpt of `contextlint.config.json`)
6. Related rules

Also add a link to the new rule in the `Rules` category index (`rules/index.md` for each language). When your change affects the CLI, configuration, or README, update **all** of `README.md`, `README.ja.md`, `README.zh.md`, and `README.ko.md`. Do not update only one language.

## 8. Verify

Finally, run the following from the repository root and confirm everything passes.

```bash
bun test
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

If `schema.test.ts` passes, the registry and `schema.json` are in sync.

## Commit and pull request

Commit using the Conventional Commits format. New rules typically use the `feat:` prefix.

```text
feat: add TBL-007 rule for <what it validates>
```

Bundling the rule body, registry registration, `schema.json` update, tests, and documentation for a single rule into one PR makes review easier.

## Related

- [Writing tests](/docs/contributing/writing-tests/) — testing conventions and the CJK requirement
- [Rules](/docs/rules/) — list of existing rules (useful as implementation references)
