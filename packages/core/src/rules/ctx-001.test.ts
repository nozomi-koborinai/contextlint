import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import { ctx001 } from "./ctx-001.js";
import type { Ctx001Options } from "./ctx-001.js";

function lint(content: string, options?: Ctx001Options, filePath = "/project/docs/spec.md") {
  const doc = parseDocument(content);
  const rule = ctx001(options);
  return runRules([rule], doc, filePath);
}

describe("CTX-001", () => {
  // --- Empty sections ---

  it("reports a section with no content", () => {
    const md = [
      "## Overview",
      "",
      "## Details",
      "Some real content here.",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("CTX-001");
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("no content");
  });

  it("reports a section with only whitespace", () => {
    const md = [
      "## Overview",
      "   ",
      "  ",
      "## Details",
      "Real content.",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Overview");
    expect(messages[0].message).toContain("no content");
  });

  // --- Placeholder-only sections ---

  it("reports a section containing only TBD", () => {
    const md = [
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("placeholder");
    expect(messages[0].message).toContain("TBD");
  });

  it("reports a section containing only TODO (case-insensitive)", () => {
    const md = [
      "## Overview",
      "todo",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("placeholder");
    expect(messages[0].message).toContain("TODO");
  });

  it("reports a section containing only WIP", () => {
    const md = [
      "## Status",
      "WIP",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("WIP");
  });

  it("reports a section containing only FIXME", () => {
    const md = [
      "## Notes",
      "FIXME",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("FIXME");
  });

  it("reports a section containing only N/A", () => {
    const md = [
      "## Dependencies",
      "N/A",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("N/A");
  });

  it("reports a section containing only an em dash", () => {
    const md = [
      "## Overview",
      "\u2014",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("placeholder");
  });

  it("reports a section containing only an en dash", () => {
    const md = [
      "## Overview",
      "\u2013",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("placeholder");
  });

  it("reports a section containing only a single dash", () => {
    const md = [
      "## Overview",
      "",
      "-",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("placeholder");
  });

  // --- Sections with real content ---

  it("passes when section has meaningful content", () => {
    const md = [
      "## Overview",
      "This project provides a linter for Markdown documents.",
    ].join("\n");
    expect(lint(md)).toEqual([]);
  });

  it("passes when section has content with TBD mixed in", () => {
    const md = [
      "## Overview",
      "This feature is partially TBD but has some content.",
    ].join("\n");
    expect(lint(md)).toEqual([]);
  });

  it("passes when all sections have content", () => {
    const md = [
      "## Overview",
      "Description of the project.",
      "",
      "## Requirements",
      "List of requirements.",
    ].join("\n");
    expect(lint(md)).toEqual([]);
  });

  // --- section option ---

  it("only checks the specified section", () => {
    const md = [
      "## Overview",
      "TBD",
      "",
      "## Details",
      "TODO",
    ].join("\n");
    const messages = lint(md, { section: "Overview" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Overview");
  });

  it("does nothing when the specified section does not exist", () => {
    const md = [
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md, { section: "Nonexistent" });
    expect(messages).toEqual([]);
  });

  // --- files option ---

  it("skips files not matching the files option", () => {
    const md = [
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md, { files: "docs/specs/**/*.md" }, "/project/src/notes.md");
    expect(messages).toEqual([]);
  });

  it("checks files matching the files option", () => {
    const md = [
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md, { files: "**/docs/**/*.md" });
    expect(messages).toHaveLength(1);
  });

  // --- Custom placeholders option ---

  it("uses custom placeholders when provided", () => {
    const md = [
      "## Overview",
      "PENDING",
    ].join("\n");
    const messages = lint(md, { placeholders: ["PENDING", "DRAFT"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("PENDING");
  });

  it("does not flag default placeholders when custom list replaces them", () => {
    const md = [
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md, { placeholders: ["PENDING"] });
    expect(messages).toEqual([]);
  });

  // --- Heading levels ---

  it("respects heading level boundaries", () => {
    const md = [
      "## Overview",
      "### Sub-section",
      "TBD",
      "",
      "## Details",
      "Real content.",
    ].join("\n");
    const messages = lint(md);
    // "Overview" has a sub-section as content so it's not empty,
    // but "Sub-section" itself contains only TBD
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Sub-section");
    expect(messages[0].message).toContain("TBD");
  });

  it("scopes section body to same-level boundaries", () => {
    const md = [
      "## First",
      "",
      "## Second",
      "Content here.",
      "",
      "## Third",
      "TBD",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(2);
    expect(messages[0].message).toContain("First");
    expect(messages[0].message).toContain("no content");
    expect(messages[1].message).toContain("Third");
    expect(messages[1].message).toContain("TBD");
  });

  // --- Edge cases ---

  it("passes with empty document", () => {
    expect(lint("")).toEqual([]);
  });

  it("passes with no headings", () => {
    const md = "Just some plain text without any headings.";
    expect(lint(md)).toEqual([]);
  });

  it("includes line number in report", () => {
    const md = [
      "",
      "",
      "## Overview",
      "TBD",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(3);
  });

  it("handles last section at end of file", () => {
    const md = [
      "## Overview",
      "Real content.",
      "",
      "## Notes",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Notes");
    expect(messages[0].message).toContain("no content");
  });

  // --- CJK content: Japanese ---

  it("reports empty Japanese section", () => {
    const md = [
      "## \u6982\u8981",
      "",
      "## \u8A73\u7D30",
      "\u3053\u3053\u306B\u5185\u5BB9\u304C\u3042\u308A\u307E\u3059\u3002",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u6982\u8981");
    expect(messages[0].message).toContain("no content");
  });

  it("reports placeholder in Japanese section", () => {
    const md = [
      "## \u8A2D\u8A08\u65B9\u91DD",
      "TBD",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u8A2D\u8A08\u65B9\u91DD");
    expect(messages[0].message).toContain("TBD");
  });

  it("detects custom Japanese placeholders", () => {
    const md = [
      "## \u8981\u4EF6",
      "\u672A\u5B9A",
    ].join("\n");
    const messages = lint(md, { placeholders: ["\u672A\u5B9A", "\u672A\u5B9F\u88C5"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u672A\u5B9A");
  });

  it("detects \u672A\u5B9F\u88C5 as custom Japanese placeholder", () => {
    const md = [
      "## \u6A5F\u80FD",
      "\u672A\u5B9F\u88C5",
    ].join("\n");
    const messages = lint(md, { placeholders: ["\u672A\u5B9A", "\u672A\u5B9F\u88C5"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u672A\u5B9F\u88C5");
  });

  it("scopes to Japanese section name", () => {
    const md = [
      "## \u6982\u8981",
      "TBD",
      "",
      "## \u8A73\u7D30",
      "TODO",
    ].join("\n");
    const messages = lint(md, { section: "\u6982\u8981" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u6982\u8981");
  });

  // --- CJK content: Korean ---

  it("reports empty Korean section", () => {
    const md = [
      "## \uAC1C\uC694",
      "",
      "## \uC138\uBD80 \uC0AC\uD56D",
      "\uC5EC\uAE30\uC5D0 \uB0B4\uC6A9\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\uAC1C\uC694");
    expect(messages[0].message).toContain("no content");
  });

  it("reports placeholder in Korean section", () => {
    const md = [
      "## \uC124\uACC4",
      "TODO",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\uC124\uACC4");
    expect(messages[0].message).toContain("TODO");
  });

  it("detects custom Korean placeholder", () => {
    const md = [
      "## \uC694\uAD6C\uC0AC\uD56D",
      "\uBBF8\uC815",
    ].join("\n");
    const messages = lint(md, { placeholders: ["\uBBF8\uC815"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\uBBF8\uC815");
  });

  it("scopes to Korean section name", () => {
    const md = [
      "## \uAC1C\uC694",
      "TBD",
      "",
      "## \uC138\uBD80",
      "TODO",
    ].join("\n");
    const messages = lint(md, { section: "\uAC1C\uC694" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\uAC1C\uC694");
  });

  // --- CJK content: Chinese ---

  it("reports empty Chinese section", () => {
    const md = [
      "## \u6982\u8FF0",
      "",
      "## \u8BE6\u7EC6\u4FE1\u606F",
      "\u8FD9\u91CC\u6709\u5185\u5BB9\u3002",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u6982\u8FF0");
    expect(messages[0].message).toContain("no content");
  });

  it("reports placeholder in Chinese section", () => {
    const md = [
      "## \u8BBE\u8BA1",
      "WIP",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u8BBE\u8BA1");
    expect(messages[0].message).toContain("WIP");
  });

  it("detects custom Chinese placeholder", () => {
    const md = [
      "## \u9700\u6C42",
      "\u5F85\u5B9A",
    ].join("\n");
    const messages = lint(md, { placeholders: ["\u5F85\u5B9A"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u5F85\u5B9A");
  });

  it("scopes to Chinese section name", () => {
    const md = [
      "## \u6982\u8FF0",
      "TBD",
      "",
      "## \u8BE6\u7EC6",
      "FIXME",
    ].join("\n");
    const messages = lint(md, { section: "\u6982\u8FF0" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("\u6982\u8FF0");
  });
});
