import { describe, it, expect } from "vitest";
import { parseDocument, runRules } from "../index.js";
import { sec001 } from "./sec-001.js";

describe("SEC-001", () => {
  it("passes when all required sections exist", () => {
    const doc = parseDocument("# Overview\n\nText\n\n# Requirements\n\nMore text");
    const rule = sec001({ sections: ["Overview", "Requirements"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports missing required sections", () => {
    const doc = parseDocument("# Overview\n\nText");
    const rule = sec001({ sections: ["Overview", "Requirements"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("SEC-001");
    expect(messages[0].message).toContain("Requirements");
  });

  it("reports all missing sections", () => {
    const doc = parseDocument("# Unrelated\n\nText");
    const rule = sec001({ sections: ["Overview", "Requirements"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(2);
  });

  it("passes on empty required sections list", () => {
    const doc = parseDocument("# Overview");
    const rule = sec001({ sections: [] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports when document has no sections", () => {
    const doc = parseDocument("Just some text without headings");
    const rule = sec001({ sections: ["Overview"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
  });

  it("skips files not matching the files pattern", () => {
    const doc = parseDocument("# Unrelated");
    const rule = sec001({
      sections: ["Overview", "Requirements"],
      files: "docs/**/table_*.md",
    });
    const messages = runRules([rule], doc, "docs/zones/auth/requirements.md");
    expect(messages).toHaveLength(0);
  });

  it("checks files matching the files pattern", () => {
    const doc = parseDocument("# Unrelated");
    const rule = sec001({
      sections: ["Overview", "Requirements"],
      files: "docs/**/table_*.md",
    });
    const messages = runRules([rule], doc, "docs/zones/auth/table_users.md");
    expect(messages).toHaveLength(2);
  });

  it("checks files matching the files pattern with absolute path", () => {
    const doc = parseDocument("# Unrelated");
    const rule = sec001({
      sections: ["Overview"],
      files: "docs/**/table_*.md",
    });
    const messages = runRules(
      [rule],
      doc,
      "/Users/someone/project/docs/zones/auth/table_users.md",
    );
    expect(messages).toHaveLength(1);
  });

  it("checks all files when files option is not set", () => {
    const doc = parseDocument("# Unrelated");
    const rule = sec001({ sections: ["Overview"] });
    const messages = runRules([rule], doc, "anything.md");
    expect(messages).toHaveLength(1);
  });

  it("detects Japanese section headings", () => {
    const doc = parseDocument("# 概要\n\nテキスト\n\n# 要件定義\n\n詳細");
    const rule = sec001({ sections: ["概要", "要件定義"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports missing Japanese section headings", () => {
    const doc = parseDocument("# 概要\n\nテキスト");
    const rule = sec001({ sections: ["概要", "要件定義", "仕様"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(2);
    expect(messages[0].message).toContain("要件定義");
    expect(messages[1].message).toContain("仕様");
  });

  it("detects Korean section headings", () => {
    const doc = parseDocument("# 개요\n\n텍스트\n\n# 요구사항\n\n상세");
    const rule = sec001({ sections: ["개요", "요구사항"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("detects Chinese section headings", () => {
    const doc = parseDocument("# 概述\n\n文本\n\n# 需求定义\n\n详情");
    const rule = sec001({ sections: ["概述", "需求定义"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
