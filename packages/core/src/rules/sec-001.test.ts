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
});
