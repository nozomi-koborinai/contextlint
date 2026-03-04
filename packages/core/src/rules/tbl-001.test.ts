import { describe, it, expect } from "vitest";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status | Name |
|----|--------|------|
| 1  | done   | foo  |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports error when a required column is missing", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(2);
    expect(messages[0].ruleId).toBe("TBL-001");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("ID");
    expect(messages[1].message).toContain("Status");
  });

  it("checks each table independently", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |

| Name | Age |
|------|-----|
| Bob  | 25  |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("ID");
  });
});
