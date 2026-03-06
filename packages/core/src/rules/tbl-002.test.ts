import { describe, it, expect } from "vitest";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl002 } from "./tbl-002.js";

describe("TBL-002: empty cell check", () => {
  it("reports no warnings when all cells have values", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl002();
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports warning for empty cells", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  |        |
`;
    const doc = parseDocument(md);
    const rule = tbl002();
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("TBL-002");
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("Status");
  });

  it("reports warning for whitespace-only cells", () => {
    const md = `
| ID | Status |
|----|--------|
|    | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl002();
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("ID");
  });

  it("only checks specified columns when columns option is set", () => {
    const md = `
| ID | Status | Note |
|----|--------|------|
| 1  |        |      |
`;
    const doc = parseDocument(md);
    const rule = tbl002({ columns: ["Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Status");
  });

  it("skips columns not present in table", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl002({ columns: ["Priority"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("skips files not matching the files pattern", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  |        |
`;
    const doc = parseDocument(md);
    const rule = tbl002({ columns: ["Status"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/overview.md");
    expect(messages).toHaveLength(0);
  });

  it("checks files matching the files pattern", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  |        |
`;
    const doc = parseDocument(md);
    const rule = tbl002({ columns: ["Status"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/requirements.md");
    expect(messages).toHaveLength(1);
  });
});
