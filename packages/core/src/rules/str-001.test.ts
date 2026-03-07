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
});
