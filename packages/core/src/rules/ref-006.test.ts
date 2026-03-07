import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref006 } from "./ref-006.js";
import type { Ref006Options } from "./ref-006.js";

function lint(
  currentFile: string,
  filesMap: Record<string, string>,
  options?: Ref006Options,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref006(options);
  const doc = documents.get(currentFile)!;
  return runRules([rule], doc, currentFile, { documents });
}

describe("REF-006", () => {
  // --- Basic image validation ---

  it("passes when all image targets exist", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "![diagram](./img/diagram.png)",
      "/project/docs/img/diagram.png": "",
    });
    expect(messages).toEqual([]);
  });

  it("reports a broken image reference", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "![diagram](./img/old-diagram.png)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("REF-006");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("./img/old-diagram.png");
  });

  it("resolves relative paths with parent directories", () => {
    const messages = lint("/project/docs/zones/auth/spec.md", {
      "/project/docs/zones/auth/spec.md":
        "![flow](../../img/auth-flow.png)",
      "/project/docs/img/auth-flow.png": "",
    });
    expect(messages).toEqual([]);
  });

  it("reports multiple broken image references", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "![a](./img/missing1.png)\n\n![b](./img/missing2.png)",
    });
    expect(messages).toHaveLength(2);
  });

  // --- External URLs are ignored ---

  it("ignores absolute URL images", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "![logo](https://example.com/logo.png)",
    });
    expect(messages).toEqual([]);
  });

  it("ignores data URI images", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "![pixel](data:image/png;base64,abc)",
    });
    expect(messages).toEqual([]);
  });

  // --- exclude option ---

  it("skips images matching exclude patterns", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "![icon](./assets/icon.svg)\n\n![photo](./img/missing.png)",
    }, { exclude: ["*.svg"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("missing.png");
  });

  it("supports multiple exclude patterns", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "![a](./assets/icon.svg)\n\n![b](./generated/chart.png)",
    }, { exclude: ["*.svg", "generated/**"] });
    expect(messages).toEqual([]);
  });

  it("checks all images when exclude is not set", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "![icon](./assets/icon.svg)",
    });
    expect(messages).toHaveLength(1);
  });

  // --- Edge cases ---

  it("does nothing when documents is not provided", () => {
    const rule = ref006();
    const doc = parseDocument("![img](./missing.png)");
    const messages = runRules([rule], doc, "/project/test.md");
    expect(messages).toEqual([]);
  });

  it("handles document with no images", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "# Overview\n\nJust text.",
    });
    expect(messages).toEqual([]);
  });

  // --- CJK file names ---

  it("resolves images with Japanese file names", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": "![図](./画像/構成図.png)",
      "/project/docs/画像/構成図.png": "",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken images with Japanese file names", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": "![図](./画像/構成図.png)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("構成図.png");
  });

  it("resolves images with Korean file names", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": "![다이어그램](./이미지/구성도.png)",
      "/project/docs/이미지/구성도.png": "",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken images with Korean file names", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": "![다이어그램](./이미지/구성도.png)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("구성도.png");
  });

  it("resolves images with Chinese file names", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": "![图表](./图片/架构图.png)",
      "/project/docs/图片/架构图.png": "",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken images with Chinese file names", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": "![图表](./图片/架构图.png)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("架构图.png");
  });
});
