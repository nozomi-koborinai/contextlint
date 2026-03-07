# @contextlint/core

Rule engine and Markdown parser for
[contextlint](https://github.com/nozomi-koborinai/contextlint) —
a rule-based linter for structured Markdown documents.

## Installation

```bash
npm install @contextlint/core
```

> Most users should install
> [`@contextlint/cli`](https://www.npmjs.com/package/@contextlint/cli)
> instead. This package is for programmatic usage.

## Usage

```typescript
import { parseDocument, runRules, tbl001 } from "@contextlint/core";

const doc = parseDocument(
  "| ID | Status |\n|----|--------|\n| 1  | Done   |",
);
const rule = tbl001({
  requiredColumns: ["ID", "Status", "Description"],
});
const messages = runRules([rule], doc, "example.md");

console.log(messages);
// [{ ruleId: "TBL-001", severity: "error",
//    message: "Missing required column ...", line: 1 }]
```

See the
[main repository](https://github.com/nozomi-koborinai/contextlint)
for the full list of rules and configuration options.

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
