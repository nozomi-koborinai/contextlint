import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { grp002 } from "./grp-002.js";
import type { Grp002Options } from "./grp-002.js";

/**
 * Helper: lint all files in a project and collect all messages.
 * Runs the rule against every file, as the rule engine does in production.
 */
function lint(
  filesMap: Record<string, string>,
  options?: Grp002Options,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = grp002(options);
  const allMessages = [];

  for (const [filePath, doc] of documents) {
    const msgs = runRules([rule], doc, filePath, { documents });
    allMessages.push(...msgs);
  }

  return allMessages;
}

describe("GRP-002", () => {
  // --- Basic cycle detection ---

  it("detects a simple 2-file cycle (A -> B -> A)", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("GRP-002");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("Circular reference detected");
    expect(messages[0].message).toContain("/project/docs/a.md");
    expect(messages[0].message).toContain("/project/docs/b.md");
  });

  it("detects a 3-file cycle (A -> B -> C -> A)", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to C](./c.md)",
      "/project/docs/c.md": "[link to A](./a.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
    expect(messages[0].message).toContain("/project/docs/a.md");
    expect(messages[0].message).toContain("/project/docs/b.md");
    expect(messages[0].message).toContain("/project/docs/c.md");
  });

  it("detects a self-reference (A -> A)", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to self](./a.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
    expect(messages[0].message).toContain("/project/docs/a.md");
  });

  // --- No cycles ---

  it("passes when the graph is a DAG (no cycles)", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)\n[link to C](./c.md)",
      "/project/docs/b.md": "[link to C](./c.md)",
      "/project/docs/c.md": "# No outgoing links",
    });
    expect(messages).toEqual([]);
  });

  it("passes with no links at all", () => {
    const messages = lint({
      "/project/docs/a.md": "# Document A",
      "/project/docs/b.md": "# Document B",
    });
    expect(messages).toEqual([]);
  });

  it("passes when link target is not in documents set", () => {
    const messages = lint({
      "/project/docs/a.md": "[external](./missing.md)",
    });
    expect(messages).toEqual([]);
  });

  // --- Multiple independent cycles ---

  it("detects multiple independent cycles", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
      "/project/docs/c.md": "[link to D](./d.md)",
      "/project/docs/d.md": "[link to C](./c.md)",
    });
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => m.ruleId === "GRP-002")).toBe(true);
  });

  // --- Deduplication ---

  it("reports each cycle only once (not from every node in the cycle)", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
    });
    // Should be exactly 1 cycle, not 2
    expect(messages).toHaveLength(1);
  });

  // --- Anchor-only links are ignored ---

  it("ignores anchor-only links (#section)", () => {
    const messages = lint({
      "/project/docs/a.md": "# Title\n\n[internal anchor](#title)",
    });
    expect(messages).toEqual([]);
  });

  // --- Links with anchors ---

  it("detects cycles even when links have anchors", () => {
    const messages = lint({
      "/project/docs/a.md": "[B section](./b.md#overview)",
      "/project/docs/b.md": "[A section](./a.md#details)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
  });

  // --- Non-.md links are ignored ---

  it("ignores non-.md link targets", () => {
    const messages = lint({
      "/project/docs/a.md": "[image](./b.png)\n[pdf](./c.pdf)",
    });
    expect(messages).toEqual([]);
  });

  // --- files option ---

  it("skips files not matching the files option", () => {
    const messages = lint({
      "/project/src/a.md": "[link to B](./b.md)",
      "/project/src/b.md": "[link to A](./a.md)",
    }, { files: "docs/**/*.md" });
    expect(messages).toEqual([]);
  });

  it("checks files matching the files option", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
    }, { files: "**/docs/**/*.md" });
    expect(messages).toHaveLength(1);
  });

  // --- exclude option ---

  it("excludes files matching the exclude option", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to CHANGELOG](./CHANGELOG.md)",
      "/project/docs/CHANGELOG.md": "[link to A](./a.md)",
    }, { exclude: ["CHANGELOG.md"] });
    expect(messages).toEqual([]);
  });

  it("still detects cycles among non-excluded files", () => {
    const messages = lint({
      "/project/docs/a.md": "[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
      "/project/docs/CHANGELOG.md": "[link to A](./a.md)",
    }, { exclude: ["CHANGELOG.md"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).not.toContain("CHANGELOG.md");
  });

  // --- Edge case: documents not provided ---

  it("does nothing when documents is not provided", () => {
    const rule = grp002();
    const doc = parseDocument("[link](./b.md)");
    const messages = runRules([rule], doc, "/project/test.md");
    expect(messages).toEqual([]);
  });

  // --- Line number reporting ---

  it("reports the line of the link that creates the cycle edge", () => {
    const messages = lint({
      "/project/docs/a.md": "# Title\n\nSome text\n\n[link to B](./b.md)",
      "/project/docs/b.md": "[link to A](./a.md)",
    });
    expect(messages).toHaveLength(1);
    // The link in a.md is on line 5
    expect(messages[0].line).toBeGreaterThan(0);
  });

  // --- Complex graph with one cycle ---

  it("detects a cycle in a larger graph with both cyclic and acyclic paths", () => {
    const messages = lint({
      "/project/docs/index.md": "[overview](./overview.md)\n[design](./design.md)",
      "/project/docs/overview.md": "[design](./design.md)",
      "/project/docs/design.md": "[api](./api.md)",
      "/project/docs/api.md": "[design](./design.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
    // The cycle is design -> api -> design
    expect(messages[0].message).toContain("/project/docs/design.md");
    expect(messages[0].message).toContain("/project/docs/api.md");
  });

  // --- CJK content: Japanese ---

  it("detects cycles with Japanese file content", () => {
    const messages = lint({
      "/project/docs/設計.md": "# 設計書\n\n[API仕様を参照](./api仕様.md)",
      "/project/docs/api仕様.md": "# API仕様\n\n[設計書を参照](./設計.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("GRP-002");
    expect(messages[0].message).toContain("Circular reference detected");
  });

  it("passes with Japanese content and no cycles", () => {
    const messages = lint({
      "/project/docs/概要.md": "# 概要\n\n[設計書を参照](./設計.md)",
      "/project/docs/設計.md": "# 設計書\n\n内容はこちら",
    });
    expect(messages).toEqual([]);
  });

  it("detects 3-file cycle with Japanese content", () => {
    const messages = lint({
      "/project/docs/要件.md": "# 要件定義\n\n[設計](./設計.md)",
      "/project/docs/設計.md": "# 設計書\n\n[実装](./実装.md)",
      "/project/docs/実装.md": "# 実装\n\n[要件に戻る](./要件.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
  });

  // --- CJK content: Korean ---

  it("detects cycles with Korean file content", () => {
    const messages = lint({
      "/project/docs/설계.md": "# 설계 문서\n\n[API 사양 참조](./api사양.md)",
      "/project/docs/api사양.md": "# API 사양\n\n[설계 문서 참조](./설계.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("GRP-002");
    expect(messages[0].message).toContain("Circular reference detected");
  });

  it("passes with Korean content and no cycles", () => {
    const messages = lint({
      "/project/docs/개요.md": "# 개요\n\n[설계 참조](./설계.md)",
      "/project/docs/설계.md": "# 설계 문서\n\n내용은 여기에",
    });
    expect(messages).toEqual([]);
  });

  it("detects 3-file cycle with Korean content", () => {
    const messages = lint({
      "/project/docs/요구사항.md": "# 요구사항\n\n[설계](./설계.md)",
      "/project/docs/설계.md": "# 설계\n\n[구현](./구현.md)",
      "/project/docs/구현.md": "# 구현\n\n[요구사항으로](./요구사항.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
  });

  // --- CJK content: Chinese ---

  it("detects cycles with Chinese file content", () => {
    const messages = lint({
      "/project/docs/设计.md": "# 设计文档\n\n[API规格参照](./api规格.md)",
      "/project/docs/api规格.md": "# API规格\n\n[设计文档参照](./设计.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("GRP-002");
    expect(messages[0].message).toContain("Circular reference detected");
  });

  it("passes with Chinese content and no cycles", () => {
    const messages = lint({
      "/project/docs/概述.md": "# 概述\n\n[设计参照](./设计.md)",
      "/project/docs/设计.md": "# 设计文档\n\n内容在此",
    });
    expect(messages).toEqual([]);
  });

  it("detects 3-file cycle with Chinese content", () => {
    const messages = lint({
      "/project/docs/需求.md": "# 需求定义\n\n[设计](./设计.md)",
      "/project/docs/设计.md": "# 设计\n\n[实现](./实现.md)",
      "/project/docs/实现.md": "# 实现\n\n[返回需求](./需求.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
  });

  // --- Mixed CJK and ASCII ---

  it("detects cycles in a mixed CJK and ASCII graph", () => {
    const messages = lint({
      "/project/docs/overview.md": "# Overview\n\n[設計書](./設計.md)",
      "/project/docs/設計.md": "# 設計書\n\n[Overview](./overview.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Circular reference detected");
  });
});
