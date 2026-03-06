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

  it("skips files not matching the files pattern", () => {
    const doc = parseDocument(invalidTable);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$", files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/overview.md");
    expect(messages).toHaveLength(0);
  });

  it("checks files matching the files pattern", () => {
    const doc = parseDocument(invalidTable);
    const rule = tbl004({ column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$", files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/requirements.md");
    expect(messages).toHaveLength(2);
  });

  it("validates pattern in a Japanese column name", () => {
    const md = `
| 識別子 | 名前 |
|--------|------|
| REQ-01 | ログイン |
| bad | 無効 |
`;
    const doc = parseDocument(md);
    const rule = tbl004({ column: "識別子", pattern: "^REQ-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("bad");
    expect(messages[0].message).toContain("識別子");
  });

  it("validates pattern in a Korean column name", () => {
    const md = `
| 식별자 | 이름 |
|--------|------|
| REQ-01 | 로그인 |
| bad | 잘못됨 |
`;
    const doc = parseDocument(md);
    const rule = tbl004({ column: "식별자", pattern: "^REQ-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("bad");
    expect(messages[0].message).toContain("식별자");
  });

  it("validates pattern in a Chinese column name", () => {
    const md = `
| 标识符 | 名称 |
|--------|------|
| REQ-01 | 登录 |
| bad | 无效 |
`;
    const doc = parseDocument(md);
    const rule = tbl004({ column: "标识符", pattern: "^REQ-\\d{2}$" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("bad");
    expect(messages[0].message).toContain("标识符");
  });
});
