import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import { sec002 } from "./sec-002.js";
import type { Sec002Options } from "./sec-002.js";

function lint(content: string, options: Sec002Options, filePath = "/project/docs/spec.md") {
  const doc = parseDocument(content);
  const rule = sec002(options);
  return runRules([rule], doc, filePath);
}

describe("SEC-002", () => {
  // --- Basic order validation ---

  it("passes when sections appear in the correct order", () => {
    const md = "## Overview\n\n## Requirements\n\n## Design";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
    });
    expect(messages).toEqual([]);
  });

  it("reports sections out of order", () => {
    const md = "## Requirements\n\n## Overview\n\n## Design";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("SEC-002");
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("Requirements");
  });

  it("reports multiple out-of-order sections", () => {
    const md = "## Design\n\n## Requirements\n\n## Overview";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
    });
    expect(messages).toHaveLength(2);
  });

  // --- Unlisted headings are ignored ---

  it("ignores headings not in the order list", () => {
    const md = "## Overview\n\n## Changelog\n\n## Requirements";
    const messages = lint(md, {
      order: ["Overview", "Requirements"],
    });
    expect(messages).toEqual([]);
  });

  // --- Missing headings are not reported ---

  it("does not report missing headings (SEC-001 responsibility)", () => {
    const md = "## Overview\n\n## Design";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
    });
    expect(messages).toEqual([]);
  });

  // --- level option (parent grouping) ---

  it("groups h3 headings by h2 parent and checks independently", () => {
    const md = [
      "## Auth",
      "### Overview",
      "### Requirements",
      "",
      "## Payment",
      "### Design",
      "### Overview",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
      level: 3,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("Design");
  });

  it("passes when all groups follow the order", () => {
    const md = [
      "## Auth",
      "### Overview",
      "### Requirements",
      "",
      "## Payment",
      "### Overview",
      "### Design",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
      level: 3,
    });
    expect(messages).toEqual([]);
  });

  it("groups h2 headings by h1 parent", () => {
    const md = [
      "# Part A",
      "## Overview",
      "## Requirements",
      "",
      "# Part B",
      "## Design",
      "## Overview",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
      level: 2,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("Design");
  });

  it("passes when wrong order is at a different level", () => {
    const md = "## Overview\n\n## Requirements\n\n### Design\n\n### Overview";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
      level: 2,
    });
    expect(messages).toEqual([]);
  });

  it("checks all levels when level is not specified", () => {
    const md = "# Design\n\n## Overview";
    const messages = lint(md, {
      order: ["Overview", "Design"],
    });
    expect(messages).toHaveLength(1);
  });

  // --- section option ---

  it("only checks headings under the specified section", () => {
    const md = [
      "## Auth",
      "### Overview",
      "### Requirements",
      "",
      "## Payment",
      "### Design",
      "### Overview",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
      level: 3,
      section: "Payment",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("Design");
  });

  it("passes when the targeted section is in order", () => {
    const md = [
      "## Auth",
      "### Design",
      "### Overview",
      "",
      "## Payment",
      "### Overview",
      "### Design",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Design"],
      level: 3,
      section: "Payment",
    });
    expect(messages).toEqual([]);
  });

  it("does nothing when the specified section does not exist", () => {
    const md = "## Auth\n\n### Overview\n\n### Requirements";
    const messages = lint(md, {
      order: ["Overview", "Requirements"],
      level: 3,
      section: "Billing",
    });
    expect(messages).toEqual([]);
  });

  // --- files option ---

  it("skips files not matching the files option", () => {
    const md = "## Design\n\n## Overview";
    const messages = lint(md, {
      order: ["Overview", "Design"],
      files: "docs/**/*.md",
    }, "/project/src/notes.md");
    expect(messages).toEqual([]);
  });

  it("checks files matching the files option", () => {
    const md = "## Design\n\n## Overview";
    const messages = lint(md, {
      order: ["Overview", "Design"],
      files: "**/docs/**/*.md",
    });
    expect(messages).toHaveLength(1);
  });

  // --- Edge cases ---

  it("passes with empty document", () => {
    const messages = lint("", {
      order: ["Overview", "Requirements"],
    });
    expect(messages).toEqual([]);
  });

  it("passes with a single matching heading", () => {
    const md = "## Requirements";
    const messages = lint(md, {
      order: ["Overview", "Requirements", "Design"],
    });
    expect(messages).toEqual([]);
  });

  it("includes line number in report", () => {
    const md = "## Design\n\n## Overview";
    const messages = lint(md, {
      order: ["Overview", "Design"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(3);
  });

  it("handles headings before any parent as a standalone group", () => {
    const md = [
      "### Requirements",
      "### Overview",
      "",
      "## Auth",
      "### Overview",
      "### Requirements",
    ].join("\n");
    const messages = lint(md, {
      order: ["Overview", "Requirements"],
      level: 3,
    });
    // The orphan group (before any h2) has wrong order, Auth group is correct
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(2);
  });

  // --- CJK content ---

  it("validates Japanese section order", () => {
    const md = "## 概要\n\n## 要件定義\n\n## 設計";
    const messages = lint(md, {
      order: ["概要", "要件定義", "設計"],
    });
    expect(messages).toEqual([]);
  });

  it("reports Japanese sections out of order", () => {
    const md = "## 要件定義\n\n## 概要\n\n## 設計";
    const messages = lint(md, {
      order: ["概要", "要件定義", "設計"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("概要");
    expect(messages[0].message).toContain("要件定義");
  });

  it("groups Japanese h3 by h2 parent", () => {
    const md = [
      "## 認証",
      "### 概要",
      "### 要件",
      "",
      "## 決済",
      "### 設計",
      "### 概要",
    ].join("\n");
    const messages = lint(md, {
      order: ["概要", "要件", "設計"],
      level: 3,
    });
    expect(messages).toHaveLength(1);
  });

  it("validates Korean section order", () => {
    const md = "## 개요\n\n## 요구사항\n\n## 설계";
    const messages = lint(md, {
      order: ["개요", "요구사항", "설계"],
    });
    expect(messages).toEqual([]);
  });

  it("reports Korean sections out of order", () => {
    const md = "## 요구사항\n\n## 개요\n\n## 설계";
    const messages = lint(md, {
      order: ["개요", "요구사항", "설계"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("개요");
    expect(messages[0].message).toContain("요구사항");
  });

  it("groups Korean h3 by h2 parent", () => {
    const md = [
      "## 인증",
      "### 개요",
      "### 요구사항",
      "",
      "## 결제",
      "### 설계",
      "### 개요",
    ].join("\n");
    const messages = lint(md, {
      order: ["개요", "요구사항", "설계"],
      level: 3,
    });
    expect(messages).toHaveLength(1);
  });

  it("validates Chinese section order", () => {
    const md = "## 概述\n\n## 需求定义\n\n## 设计";
    const messages = lint(md, {
      order: ["概述", "需求定义", "设计"],
    });
    expect(messages).toEqual([]);
  });

  it("reports Chinese sections out of order", () => {
    const md = "## 需求定义\n\n## 概述\n\n## 设计";
    const messages = lint(md, {
      order: ["概述", "需求定义", "设计"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("概述");
    expect(messages[0].message).toContain("需求定义");
  });

  it("groups Chinese h3 by h2 parent", () => {
    const md = [
      "## 认证",
      "### 概述",
      "### 需求",
      "",
      "## 支付",
      "### 设计",
      "### 概述",
    ].join("\n");
    const messages = lint(md, {
      order: ["概述", "需求", "设计"],
      level: 3,
    });
    expect(messages).toHaveLength(1);
  });
});
