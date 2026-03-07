import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref005 } from "./ref-005.js";
import type { Ref005Options } from "./ref-005.js";

function lint(
  currentFile: string,
  filesMap: Record<string, string>,
  options?: Ref005Options,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref005(options);
  const doc = documents.get(currentFile)!;
  return runRules([rule], doc, currentFile, { documents });
}

describe("REF-005", () => {
  // --- Same-file anchors ---

  it("passes when same-file anchor matches a heading", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# Overview\n\n[link](#overview)\n\n## Getting Started\n\n[link](#getting-started)",
    });
    expect(messages).toEqual([]);
  });

  it("reports a broken same-file anchor", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# Overview\n\n[link](#getting-started)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("REF-005");
    expect(messages[0].message).toContain("#getting-started");
    expect(messages[0].message).toContain("this file");
  });

  // --- Cross-file anchors ---

  it("passes when cross-file anchor matches a heading", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[Error Handling](./design.md#error-handling)",
      "/project/docs/design.md": "# Design\n\n## Error Handling\n\nDetails...",
    });
    expect(messages).toEqual([]);
  });

  it("reports a broken cross-file anchor", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[Error Handling](./design.md#error-handling)",
      "/project/docs/design.md": "# Design\n\n## API Reference\n\nDetails...",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("#error-handling");
    expect(messages[0].message).toContain("./design.md");
  });

  it("skips cross-file anchors when target file does not exist", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[link](./missing.md#section)",
    });
    expect(messages).toEqual([]);
  });

  // --- Anchor generation rules ---

  it("lowercases heading text for anchor matching", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# Getting Started\n\n[link](#getting-started)",
    });
    expect(messages).toEqual([]);
  });

  it("converts spaces to hyphens", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# Error Handling Guide\n\n[link](#error-handling-guide)",
    });
    expect(messages).toEqual([]);
  });

  it("strips special characters", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# What's New?\n\n[link](#whats-new)",
    });
    expect(messages).toEqual([]);
  });

  it("handles duplicate headings with suffixes", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": [
        "# Overview",
        "## Section",
        "content",
        "## Section",
        "content",
        "## Section",
        "[a](#section)",
        "[b](#section-1)",
        "[c](#section-2)",
      ].join("\n"),
    });
    expect(messages).toEqual([]);
  });

  it("reports wrong suffix for duplicate headings", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": [
        "# Overview",
        "## Section",
        "## Section",
        "[link](#section-3)",
      ].join("\n"),
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("#section-3");
  });

  // --- Empty/missing anchor ---

  it("ignores links without anchor fragment", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[link](./design.md)",
      "/project/docs/design.md": "# Design",
    });
    expect(messages).toEqual([]);
  });

  it("ignores links with empty anchor fragment", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "# Overview\n\n[link](#)",
    });
    expect(messages).toEqual([]);
  });

  // --- files option ---

  it("skips files not matching the files option", () => {
    const messages = lint("/project/src/notes.md", {
      "/project/src/notes.md": "[link](#nonexistent)",
    }, { files: "docs/**/*.md" });
    expect(messages).toEqual([]);
  });

  it("checks files matching the files option", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[link](#nonexistent)",
    }, { files: "**/docs/**/*.md" });
    expect(messages).toHaveLength(1);
  });

  // --- Edge cases ---

  it("does nothing when documents is not provided", () => {
    const rule = ref005();
    const doc = parseDocument("# Heading\n\n[link](#nonexistent)");
    const messages = runRules([rule], doc, "/project/test.md");
    expect(messages).toEqual([]);
  });

  it("handles multiple broken anchors in one file", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "# Overview\n\n[a](#missing-one)\n[b](#missing-two)\n[c](#overview)",
    });
    expect(messages).toHaveLength(2);
  });

  it("handles parent directory cross-file anchors", () => {
    const messages = lint("/project/docs/zones/auth/spec.md", {
      "/project/docs/zones/auth/spec.md":
        "[link](../shared/glossary.md#terms)",
      "/project/docs/zones/shared/glossary.md":
        "# Glossary\n\n## Terms\n\nDefinitions...",
    });
    expect(messages).toEqual([]);
  });

  // --- CJK content ---

  it("handles Japanese headings as anchors", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": [
        "# 概要",
        "## エラーハンドリング",
        "",
        "[概要へ](#概要)",
        "[エラーハンドリングへ](#エラーハンドリング)",
      ].join("\n"),
    });
    expect(messages).toEqual([]);
  });

  it("reports broken Japanese anchor", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": "# 概要\n\n[link](#要件定義)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("#要件定義");
  });

  it("handles cross-file Japanese anchors", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md":
        "[設計](./設計.md#エラーハンドリング)",
      "/project/docs/設計.md":
        "# 設計\n\n## エラーハンドリング\n\n詳細...",
    });
    expect(messages).toEqual([]);
  });

  it("handles Korean headings as anchors", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": [
        "# 개요",
        "## 오류 처리",
        "",
        "[개요로](#개요)",
        "[오류 처리로](#오류-처리)",
      ].join("\n"),
    });
    expect(messages).toEqual([]);
  });

  it("reports broken Korean anchor", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": "# 개요\n\n[link](#요구사항)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("#요구사항");
  });

  it("handles cross-file Korean anchors", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md":
        "[설계](./설계.md#오류-처리)",
      "/project/docs/설계.md":
        "# 설계\n\n## 오류 처리\n\n상세...",
    });
    expect(messages).toEqual([]);
  });

  it("handles Chinese headings as anchors", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": [
        "# 概述",
        "## 错误处理",
        "",
        "[概述](#概述)",
        "[错误处理](#错误处理)",
      ].join("\n"),
    });
    expect(messages).toEqual([]);
  });

  it("reports broken Chinese anchor", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": "# 概述\n\n[link](#需求文档)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("#需求文档");
  });

  it("handles cross-file Chinese anchors", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md":
        "[设计](./设计.md#错误处理)",
      "/project/docs/设计.md":
        "# 设计\n\n## 错误处理\n\n详情...",
    });
    expect(messages).toEqual([]);
  });
});
