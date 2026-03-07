import { describe, it, expect } from "bun:test";
import { parseDocument } from "./parser.js";

describe("parseDocument", () => {
  it("parses a basic table", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob   | 25 |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].headers).toEqual(["Name", "Age"]);
    expect(doc.tables[0].rows).toEqual([
      { Name: "Alice", Age: "30" },
      { Name: "Bob", Age: "25" },
    ]);
    expect(doc.tables[0].section).toBeNull();
  });

  it("parses multiple tables", () => {
    const md = `
| A | B |
|---|---|
| 1 | 2 |

| X | Y | Z |
|---|---|---|
| a | b | c |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(2);
    expect(doc.tables[0].headers).toEqual(["A", "B"]);
    expect(doc.tables[1].headers).toEqual(["X", "Y", "Z"]);
  });

  it("assigns section from nearest heading above", () => {
    const md = `
# Section One

Some text.

| Col1 | Col2 |
|------|------|
| a    | b    |

## Section Two

| Col3 | Col4 |
|------|------|
| c    | d    |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(2);
    expect(doc.tables[0].section).toBe("Section One");
    expect(doc.tables[1].section).toBe("Section Two");
    expect(doc.sections).toEqual(["Section One", "Section Two"]);
    expect(doc.headings).toEqual([
      { text: "Section One", level: 1, line: 2 },
      { text: "Section Two", level: 2, line: 10 },
    ]);
  });

  it("returns empty tables for document without tables", () => {
    const md = `
# Just a heading

Some paragraph text.
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(0);
    expect(doc.sections).toEqual(["Just a heading"]);
    expect(doc.headings).toEqual([
      { text: "Just a heading", level: 1, line: 2 },
    ]);
  });

  it("includes line numbers", () => {
    const md = `# Title

| H1 | H2 |
|----|----|
| v1 | v2 |
`;
    const doc = parseDocument(md);
    expect(doc.tables[0].line).toBe(3);
  });

  it("parses table with Japanese headers and cell values", () => {
    const md = `
## 要件定義

| ID | 要件 | 安定度 | 備考 |
|----|------|--------|------|
| REQ-AUTH-01 | ユーザー認証 | draft | |
| REQ-AUTH-02 | パスワードリセット | review | 要確認 |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].headers).toEqual(["ID", "要件", "安定度", "備考"]);
    expect(doc.tables[0].rows[0]["要件"]).toBe("ユーザー認証");
    expect(doc.tables[0].rows[1]["安定度"]).toBe("review");
    expect(doc.tables[0].section).toBe("要件定義");
  });

  it("parses table with Korean headers and cell values", () => {
    const md = `
## 요구사항

| ID | 요구사항 | 안정도 |
|----|----------|--------|
| REQ-01 | 사용자 인증 | draft |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].headers).toEqual(["ID", "요구사항", "안정도"]);
    expect(doc.tables[0].rows[0]["요구사항"]).toBe("사용자 인증");
    expect(doc.tables[0].section).toBe("요구사항");
  });

  it("parses table with Chinese headers and cell values", () => {
    const md = `
## 需求定义

| ID | 需求 | 稳定性 |
|----|------|--------|
| REQ-01 | 用户认证 | draft |
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].headers).toEqual(["ID", "需求", "稳定性"]);
    expect(doc.tables[0].rows[0]["需求"]).toBe("用户认证");
    expect(doc.tables[0].section).toBe("需求定义");
  });

  it("collects relative file links and anchor-only links but skips URI schemes", () => {
    const md = `
[local](./other.md)
[absolute](https://example.com)
[email](mailto:user@example.com)
[phone](tel:+1234567890)
[data](data:text/plain;base64,abc)
[anchor](#section)
[relative](../docs/spec.md)
`;
    const doc = parseDocument(md);
    expect(doc.links).toHaveLength(3);
    expect(doc.links[0].url).toBe("./other.md");
    expect(doc.links[1].url).toBe("#section");
    expect(doc.links[2].url).toBe("../docs/spec.md");
  });

  it("collects checklist items with checked state and section", () => {
    const md = `
## Review
- [x] Done item
- [ ] Pending item
- Regular item

## Notes
- [x] Another done item
`;
    const doc = parseDocument(md);
    expect(doc.checkItems).toHaveLength(3);
    expect(doc.checkItems[0]).toEqual({
      text: "Done item",
      checked: true,
      line: 3,
      section: "Review",
    });
    expect(doc.checkItems[1]).toEqual({
      text: "Pending item",
      checked: false,
      line: 4,
      section: "Review",
    });
    expect(doc.checkItems[2]).toEqual({
      text: "Another done item",
      checked: true,
      line: 8,
      section: "Notes",
    });
  });

  it("collects relative image references but skips absolute URLs", () => {
    const md = `
![local](./img/diagram.png)
![external](https://example.com/logo.png)
![data](data:image/png;base64,abc)
![relative](../assets/photo.jpg)
`;
    const doc = parseDocument(md);
    expect(doc.images).toHaveLength(2);
    expect(doc.images[0].url).toBe("./img/diagram.png");
    expect(doc.images[1].url).toBe("../assets/photo.jpg");
  });
});
