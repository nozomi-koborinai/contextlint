import { describe, it, expect } from "vitest";
import { parseDocument, runRules } from "../index.js";
import { tbl004 } from "./tbl-004.js";

const validTable = `
| ID | Name |
|----|------|
| AUTH-LOGIN-01 | Login |
| AUTH-LOGOUT-02 | Logout |
`;

const invalidTable = `
| ID | Name |
|----|------|
| AUTH-LOGIN-01 | Login |
| bad-id | Invalid |
| 123 | Numbers |
`;

const noIdColumn = `
| Name | Status |
|------|--------|
| Login | draft |
`;

describe("TBL-004", () => {
  it("passes when all values match the pattern", () => {
    const doc = parseDocument(validTable);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports values that do not match the pattern", () => {
    const doc = parseDocument(invalidTable);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(2);
    expect(messages[0].ruleId).toBe("TBL-004");
    expect(messages[0].message).toContain("bad-id");
    expect(messages[1].message).toContain("123");
  });

  it("skips tables without the specified column", () => {
    const doc = parseDocument(noIdColumn);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("skips empty cells", () => {
    const md = `
| ID | Name |
|----|------|
|  | Empty |
| AUTH-LOGIN-01 | Valid |
`;
    const doc = parseDocument(md);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
