import { describe, it, expect } from "vitest";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl003 } from "./tbl-003.js";

describe("TBL-003: allowed values check", () => {
  it("reports no errors when all values are allowed", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
| 2  | todo   |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "Status", values: ["done", "todo", "wip"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports error for invalid values", () => {
    const md = `
| ID | Status  |
|----|---------|
| 1  | done    |
| 2  | invalid |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "Status", values: ["done", "todo"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("TBL-003");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("invalid");
    expect(messages[0].message).toContain("Status");
  });

  it("skips when target column does not exist in table", () => {
    const md = `
| ID | Name |
|----|------|
| 1  | foo  |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "Status", values: ["done"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("skips files not matching the files pattern", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | invalid |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "Status", values: ["done"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/overview.md");
    expect(messages).toHaveLength(0);
  });

  it("checks files matching the files pattern", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | invalid |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "Status", values: ["done"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/requirements.md");
    expect(messages).toHaveLength(1);
  });

  it("validates values in a Japanese column name", () => {
    const md = `
| ID | 安定度 |
|----|--------|
| REQ-01 | draft |
| REQ-02 | stable |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "安定度", values: ["draft", "review", "stable"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports invalid values in a Japanese column name", () => {
    const md = `
| ID | 安定度 |
|----|--------|
| REQ-01 | 不明 |
`;
    const doc = parseDocument(md);
    const rule = tbl003({ column: "安定度", values: ["draft", "review", "stable"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("不明");
    expect(messages[0].message).toContain("安定度");
  });
});
