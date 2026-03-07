import { describe, it, expect } from "vitest";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { tbl006 } from "./tbl-006.js";

function lint(
  filesMap: Record<string, string>,
  options: { files: string; column: string; idPattern?: string },
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = tbl006(options);
  return runRules([rule], parseDocument(""), "<project>", {
    documents,
  });
}

describe("TBL-006", () => {
  it("passes when all IDs are unique across files", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n| REQ-01 |",
        "docs/file2.md": "| ID |\n|---|\n| REQ-02 |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toEqual([]);
  });

  it("reports duplicate IDs across files", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n| REQ-01 |",
        "docs/file2.md": "| ID |\n|---|\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("TBL-006");
    expect(messages[0].message).toContain("REQ-01");
    expect(messages[0].message).toContain("docs/file1.md");
  });

  it("reports duplicate IDs within the same file", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n| REQ-01 |\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-01");
  });

  it("only checks files matching the files pattern", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n| REQ-01 |",
        "other/file2.md": "| ID |\n|---|\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toEqual([]);
  });

  it("only checks values matching idPattern", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n| REQ-01 |\n| NOTE-1 |",
        "docs/file2.md": "| ID |\n|---|\n| REQ-02 |\n| NOTE-1 |",
      },
      { files: "docs/**/*.md", column: "ID", idPattern: "^REQ-" },
    );
    expect(messages).toEqual([]);
  });

  it("skips tables without the specified column", () => {
    const messages = lint(
      {
        "docs/file1.md": "| Name |\n|---|\n| Alice |",
        "docs/file2.md": "| Name |\n|---|\n| Alice |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toEqual([]);
  });

  it("skips empty cell values", () => {
    const messages = lint(
      {
        "docs/file1.md": "| ID |\n|---|\n|  |",
        "docs/file2.md": "| ID |\n|---|\n|  |",
      },
      { files: "docs/**/*.md", column: "ID" },
    );
    expect(messages).toEqual([]);
  });

  it("does nothing when documents is not provided", () => {
    const rule = tbl006({ files: "docs/**/*.md", column: "ID" });
    const messages = runRules([rule], parseDocument(""), "<project>");
    expect(messages).toEqual([]);
  });

  it("reports duplicate IDs with Japanese column names", () => {
    const messages = lint(
      {
        "docs/file1.md": "| 識別子 |\n|---|\n| REQ-01 |",
        "docs/file2.md": "| 識別子 |\n|---|\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "識別子" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-01");
  });

  it("reports duplicate IDs with Korean column names", () => {
    const messages = lint(
      {
        "docs/file1.md": "| 식별자 |\n|---|\n| REQ-01 |",
        "docs/file2.md": "| 식별자 |\n|---|\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "식별자" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-01");
  });

  it("reports duplicate IDs with Chinese column names", () => {
    const messages = lint(
      {
        "docs/file1.md": "| 标识符 |\n|---|\n| REQ-01 |",
        "docs/file2.md": "| 标识符 |\n|---|\n| REQ-01 |",
      },
      { files: "docs/**/*.md", column: "标识符" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-01");
  });
});
