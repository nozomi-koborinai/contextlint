import { describe, it, expect } from "vitest";
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
  });

  it("returns empty tables for document without tables", () => {
    const md = `
# Just a heading

Some paragraph text.
`;
    const doc = parseDocument(md);
    expect(doc.tables).toHaveLength(0);
    expect(doc.sections).toEqual(["Just a heading"]);
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
});
