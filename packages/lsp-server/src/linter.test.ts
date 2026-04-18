import { describe, it, expect } from "bun:test";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { ContextlintConfig } from "@contextlint/core";
import { lintBuffer } from "./linter.js";

function md(content: string): TextDocument {
  return TextDocument.create("file:///tmp/test.md", "markdown", 1, content);
}

describe("lintBuffer", () => {
  it("returns empty when no rules are configured", () => {
    const doc = md("# Heading\n");
    const config: ContextlintConfig = { rules: [] };
    expect(lintBuffer(doc, config)).toEqual([]);
  });

  it("reports violations from a document-scope rule", () => {
    const doc = md(`
| Name | Age |
|------|-----|
| A    | 30  |
`);
    const config: ContextlintConfig = {
      rules: [
        {
          rule: "tbl001",
          options: { requiredColumns: ["ID", "Status"] },
        },
      ],
    };
    const messages = lintBuffer(doc, config);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]?.ruleId).toBe("TBL-001");
  });

  it("skips project-scope rules (e.g. STR-001) on a single buffer", () => {
    const doc = md("# anything\n");
    const config: ContextlintConfig = {
      rules: [
        {
          rule: "str001",
          options: { files: ["docs/overview.md"] },
        },
      ],
    };
    expect(lintBuffer(doc, config)).toEqual([]);
  });

  it("respects the files option when filtering by filePath", () => {
    const doc = md(`
| Name | Age |
|------|-----|
| A    | 30  |
`);
    const config: ContextlintConfig = {
      rules: [
        {
          rule: "tbl001",
          options: {
            requiredColumns: ["ID"],
            files: "**/other.md",
          },
        },
      ],
    };
    expect(lintBuffer(doc, config)).toEqual([]);
  });
});
