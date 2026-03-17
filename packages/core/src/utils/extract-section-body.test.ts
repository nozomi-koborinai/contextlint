import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { extractSectionBody } from "./extract-section-body.js";

function extract(content: string, targetHeading: string): string | null {
  const doc = parseDocument(content);
  return extractSectionBody(content, doc.headings, targetHeading);
}

describe("extractSectionBody", () => {
  // --- Basic functionality ---

  it("extracts body from a section", () => {
    const md = [
      "## Overview",
      "Some content here.",
      "",
      "## Details",
      "More details.",
    ].join("\n");
    const body = extract(md, "Overview");
    expect(body).toBe("Some content here.\n");
  });

  it("extracts body of the last section to end of file", () => {
    const md = [
      "## Overview",
      "First section.",
      "",
      "## Details",
      "Last section content.",
    ].join("\n");
    const body = extract(md, "Details");
    expect(body).toBe("Last section content.");
  });

  it("returns null when heading is not found", () => {
    const md = [
      "## Overview",
      "Content.",
    ].join("\n");
    const body = extract(md, "Nonexistent");
    expect(body).toBeNull();
  });

  it("extracts empty body when section has no content", () => {
    const md = [
      "## Overview",
      "",
      "## Details",
      "Content.",
    ].join("\n");
    const body = extract(md, "Overview");
    expect(body).not.toBeNull();
    expect(body?.trim()).toBe("");
  });

  // --- Heading level boundaries ---

  it("stops at same-level heading", () => {
    const md = [
      "## First",
      "Body of first.",
      "",
      "## Second",
      "Body of second.",
    ].join("\n");
    const body = extract(md, "First");
    expect(body).toBe("Body of first.\n");
  });

  it("stops at higher-level heading", () => {
    const md = [
      "## Section",
      "### Subsection",
      "Sub content.",
      "",
      "## Next Section",
      "Next content.",
    ].join("\n");
    const body = extract(md, "Section");
    expect(body).toContain("Subsection");
    expect(body).toContain("Sub content.");
    expect(body).not.toContain("Next content.");
  });

  it("includes sub-headings within the section", () => {
    const md = [
      "## Overview",
      "### Part A",
      "Part A content.",
      "### Part B",
      "Part B content.",
      "",
      "## Details",
      "Details content.",
    ].join("\n");
    const body = extract(md, "Overview");
    expect(body).toContain("Part A");
    expect(body).toContain("Part B");
    expect(body).not.toContain("Details content.");
  });

  it("extracts sub-heading body correctly", () => {
    const md = [
      "## Overview",
      "### Part A",
      "Part A content.",
      "### Part B",
      "Part B content.",
    ].join("\n");
    const body = extract(md, "Part A");
    expect(body).toBe("Part A content.");
  });

  // --- Edge cases ---

  it("returns null for empty content", () => {
    const body = extract("", "Overview");
    expect(body).toBeNull();
  });

  it("returns null for content with no headings", () => {
    const body = extract("Just some text.", "Overview");
    expect(body).toBeNull();
  });

  it("handles single heading at start of file", () => {
    const md = [
      "## Overview",
      "All the content.",
    ].join("\n");
    const body = extract(md, "Overview");
    expect(body).toBe("All the content.");
  });

  it("handles section with only whitespace", () => {
    const md = [
      "## Overview",
      "   ",
      "  ",
      "## Details",
      "Content.",
    ].join("\n");
    const body = extract(md, "Overview");
    expect(body).not.toBeNull();
    expect(body?.trim()).toBe("");
  });

  // --- CJK content: Japanese ---

  it("extracts Japanese section body", () => {
    const md = [
      "## 概要",
      "プロジェクトの説明です。",
      "",
      "## 要件",
      "要件一覧。",
    ].join("\n");
    const body = extract(md, "概要");
    expect(body).toBe("プロジェクトの説明です。\n");
  });

  it("returns null for missing Japanese heading", () => {
    const md = [
      "## 概要",
      "内容。",
    ].join("\n");
    const body = extract(md, "存在しない");
    expect(body).toBeNull();
  });

  it("handles Japanese sub-headings", () => {
    const md = [
      "## 設計",
      "### アーキテクチャ",
      "アーキテクチャの説明。",
      "### データモデル",
      "データモデルの説明。",
      "",
      "## 実装",
      "実装内容。",
    ].join("\n");
    const body = extract(md, "設計");
    expect(body).toContain("アーキテクチャ");
    expect(body).toContain("データモデル");
    expect(body).not.toContain("実装内容。");
  });

  // --- CJK content: Korean ---

  it("extracts Korean section body", () => {
    const md = [
      "## 개요",
      "프로젝트 설명입니다.",
      "",
      "## 요구사항",
      "요구사항 목록.",
    ].join("\n");
    const body = extract(md, "개요");
    expect(body).toBe("프로젝트 설명입니다.\n");
  });

  it("returns null for missing Korean heading", () => {
    const md = [
      "## 개요",
      "내용.",
    ].join("\n");
    const body = extract(md, "존재하지않음");
    expect(body).toBeNull();
  });

  it("handles Korean sub-headings", () => {
    const md = [
      "## 설계",
      "### 아키텍처",
      "아키텍처 설명.",
      "### 데이터 모델",
      "데이터 모델 설명.",
      "",
      "## 구현",
      "구현 내용.",
    ].join("\n");
    const body = extract(md, "설계");
    expect(body).toContain("아키텍처");
    expect(body).toContain("데이터 모델");
    expect(body).not.toContain("구현 내용.");
  });

  // --- CJK content: Chinese ---

  it("extracts Chinese section body", () => {
    const md = [
      "## 概述",
      "项目描述。",
      "",
      "## 需求",
      "需求列表。",
    ].join("\n");
    const body = extract(md, "概述");
    expect(body).toBe("项目描述。\n");
  });

  it("returns null for missing Chinese heading", () => {
    const md = [
      "## 概述",
      "内容。",
    ].join("\n");
    const body = extract(md, "不存在的");
    expect(body).toBeNull();
  });

  it("handles Chinese sub-headings", () => {
    const md = [
      "## 设计",
      "### 架构",
      "架构说明。",
      "### 数据模型",
      "数据模型说明。",
      "",
      "## 实现",
      "实现内容。",
    ].join("\n");
    const body = extract(md, "设计");
    expect(body).toContain("架构");
    expect(body).toContain("数据模型");
    expect(body).not.toContain("实现内容。");
  });
});
