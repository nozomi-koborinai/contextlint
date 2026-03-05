import { describe, it, expect } from "vitest";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref001 } from "./ref-001.js";

function lint(currentFile: string, filesMap: Record<string, string>) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref001();
  const doc = documents.get(currentFile)!;
  return runRules([rule], doc, currentFile, { documents });
}

describe("REF-001", () => {
  it("passes when all link targets exist", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[requirements](./requirements.md)",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports a broken link", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[old doc](./deleted.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("REF-001");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("./deleted.md");
  });

  it("resolves relative paths with parent directories", () => {
    const messages = lint("/project/docs/zones/auth/spec.md", {
      "/project/docs/zones/auth/spec.md":
        "[users](../bulletin-board/table_contents.md)",
      "/project/docs/zones/bulletin-board/table_contents.md": "# Contents",
    });
    expect(messages).toEqual([]);
  });

  it("ignores external URLs", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[Google](https://google.com) and [HTTP](http://example.com)",
    });
    expect(messages).toEqual([]);
  });

  it("ignores anchor-only links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](#some-section)",
    });
    expect(messages).toEqual([]);
  });

  it("handles links with anchors to existing files", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](./requirements.md#heading)",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports links with anchors to non-existing files", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](./missing.md#heading)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("./missing.md#heading");
  });

  it("handles reference-style links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "See [ref][link1]\n\n[link1]: ./requirements.md",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports multiple broken links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[a](./missing1.md) and [b](./missing2.md)",
    });
    expect(messages).toHaveLength(2);
  });

  it("does nothing when documents is not provided", () => {
    const rule = ref001();
    const doc = parseDocument("[link](./file.md)");
    const messages = runRules([rule], doc, "/project/test.md");
    expect(messages).toEqual([]);
  });
});
