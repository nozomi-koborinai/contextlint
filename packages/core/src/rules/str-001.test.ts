import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { str001 } from "./str-001.js";

describe("STR-001: required files check", () => {
  const emptyDoc = parseDocument("");

  it("reports no errors when all required files exist", () => {
    const rule = str001({ files: ["README.md", "CLAUDE.md"] });
    const messages = runRules([rule], emptyDoc, "<project>", {
      projectFiles: ["README.md", "CLAUDE.md", "package.json"],
    });
    expect(messages).toHaveLength(0);
  });

  it("reports error for missing files", () => {
    const rule = str001({ files: ["README.md", "CONTRIBUTING.md"] });
    const messages = runRules([rule], emptyDoc, "<project>", {
      projectFiles: ["README.md", "package.json"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("STR-001");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("CONTRIBUTING.md");
  });

  it("skips when projectFiles is not provided (no-op)", () => {
    const rule = str001({ files: ["README.md"] });
    const messages = runRules([rule], emptyDoc, "<project>");
    expect(messages).toHaveLength(0);
  });

  it("works with Japanese file names", () => {
    const rule = str001({ files: ["ドキュメント/概要.md", "ドキュメント/要件.md"] });
    const messages = runRules([rule], emptyDoc, "<project>", {
      projectFiles: ["ドキュメント/概要.md"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("STR-001");
    expect(messages[0].message).toContain("ドキュメント/要件.md");
  });

  it("works with Korean file names", () => {
    const rule = str001({ files: ["문서/개요.md", "문서/요구사항.md"] });
    const messages = runRules([rule], emptyDoc, "<project>", {
      projectFiles: ["문서/개요.md", "문서/요구사항.md"],
    });
    expect(messages).toHaveLength(0);
  });

  it("works with Chinese file names", () => {
    const rule = str001({ files: ["文档/概述.md", "文档/需求.md"] });
    const messages = runRules([rule], emptyDoc, "<project>", {
      projectFiles: ["文档/概述.md"],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("文档/需求.md");
  });
});
