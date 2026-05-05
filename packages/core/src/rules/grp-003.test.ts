import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { grp003 } from "./grp-003.js";
import type { Grp003Options } from "./grp-003.js";

function lint(
  filesMap: Record<string, string>,
  options?: Grp003Options,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = grp003(options);
  const emptyDoc = parseDocument("");
  return runRules([rule], emptyDoc, "<project>", { documents });
}

describe("GRP-003", () => {
  it("reports a file with no incoming references (orphan)", () => {
    const messages = lint({
      "docs/index.md": "# Index\n\nSee [design](./design.md)",
      "docs/design.md": "# Design\n\nSee [index](./index.md)",
      "docs/old-draft.md": "# Old Draft\n\nObsolete content.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe("GRP-003");
    expect(messages[0]?.severity).toBe("warning");
    expect(messages[0]?.message).toContain("docs/old-draft.md");
    expect(messages[0]?.message).toContain("no incoming references");
  });

  it("passes when all files have incoming references", () => {
    const messages = lint({
      "docs/index.md": "# Index\n\nSee [design](./design.md) and [api](./api.md)",
      "docs/design.md": "# Design\n\nSee [index](./index.md)",
      "docs/api.md": "# API\n\nSee [index](./index.md)",
    });
    // index.md gets references from design.md and api.md
    // design.md gets reference from index.md
    // api.md gets reference from index.md
    expect(messages).toEqual([]);
  });

  it("skips entry points with no references", () => {
    const messages = lint(
      {
        "docs/README.md": "# README\n\nSee [design](./design.md)",
        "docs/design.md": "# Design\n\nSome content.",
      },
      { entryPoints: ["README.md"] },
    );
    // README.md has no incoming references but is an entry point
    // design.md has a reference from README.md
    expect(messages).toEqual([]);
  });

  it("reports multiple orphan files", () => {
    const messages = lint({
      "docs/index.md": "# Index\n\nMain page.",
      "docs/orphan1.md": "# Orphan One\n\nNo one links here.",
      "docs/orphan2.md": "# Orphan Two\n\nNo one links here either.",
    });
    expect(messages).toHaveLength(3);
    const reported = messages.map((m) => m.message);
    expect(reported.some((msg) => msg.includes("docs/index.md"))).toBe(true);
    expect(reported.some((msg) => msg.includes("docs/orphan1.md"))).toBe(true);
    expect(reported.some((msg) => msg.includes("docs/orphan2.md"))).toBe(true);
  });

  it("filters files using the files option", () => {
    const messages = lint(
      {
        "docs/spec/design.md": "# Design\n\nContent.",
        "docs/spec/api.md": "# API\n\nContent.",
        "notes/scratch.md": "# Scratch\n\nDraft.",
      },
      { files: "docs/**/*.md" },
    );
    // Only docs/ files are checked; notes/scratch.md is outside the filter
    expect(messages).toHaveLength(2);
    const reported = messages.map((m) => m.message);
    expect(reported.some((msg) => msg.includes("docs/spec/design.md"))).toBe(true);
    expect(reported.some((msg) => msg.includes("docs/spec/api.md"))).toBe(true);
    expect(reported.some((msg) => msg.includes("notes/scratch.md"))).toBe(false);
  });

  it("counts references from files outside the filtered set", () => {
    const messages = lint(
      {
        "README.md": "# README\n\nSee [spec](./docs/spec.md)",
        "docs/spec.md": "# Spec\n\nContent.",
      },
      { files: "docs/**/*.md" },
    );
    // docs/spec.md is referenced from README.md (outside filter)
    expect(messages).toEqual([]);
  });

  it("handles anchor-only links (does not count as file reference)", () => {
    const messages = lint({
      "docs/index.md": "# Index\n\nSee [section](#overview)",
      "docs/other.md": "# Other\n\nContent.",
    });
    // Anchor-only links should not count as incoming references
    expect(messages).toHaveLength(2);
  });

  it("does nothing when documents is not provided", () => {
    const rule = grp003();
    const doc = parseDocument("# Hello");
    const messages = runRules([rule], doc, "<project>");
    expect(messages).toEqual([]);
  });

  it("handles multiple entry point patterns", () => {
    const messages = lint(
      {
        "docs/README.md": "# README\n\nSee [design](./design.md)",
        "docs/index.md": "# Index\n\nSee [design](./design.md)",
        "docs/design.md": "# Design\n\nContent.",
      },
      { entryPoints: ["README.md", "index.md"] },
    );
    // Both README.md and index.md are entry points, design.md is referenced
    expect(messages).toEqual([]);
  });

  // CJK tests — Japanese content
  it("reports orphan document with Japanese headings", () => {
    const messages = lint({
      "docs/概要.md": "# 概要\n\n[設計](./設計.md)を参照",
      "docs/設計.md": "# 設計\n\n[概要](./概要.md)を参照",
      "docs/古い下書き.md": "# 古い下書き\n\n誰もリンクしていません。",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("古い下書き.md");
  });

  // CJK tests — Korean content
  it("reports orphan document with Korean headings", () => {
    const messages = lint({
      "docs/개요.md": "# 개요\n\n[설계](./설계.md) 참조",
      "docs/설계.md": "# 설계\n\n[개요](./개요.md) 참조",
      "docs/오래된초안.md": "# 오래된 초안\n\n아무도 링크하지 않습니다.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("오래된초안.md");
  });

  // CJK tests — Chinese content
  it("reports orphan document with Chinese headings", () => {
    const messages = lint({
      "docs/概述.md": "# 概述\n\n参见[设计](./设计.md)",
      "docs/设计.md": "# 设计\n\n参见[概述](./概述.md)",
      "docs/旧草稿.md": "# 旧草稿\n\n没有人链接到这里。",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("旧草稿.md");
  });

  it("entry points work with CJK filenames", () => {
    const messages = lint(
      {
        "docs/はじめに.md": "# はじめに\n\n[設計](./設計.md)を参照",
        "docs/設計.md": "# 設計\n\n内容です。",
      },
      { entryPoints: ["はじめに.md"] },
    );
    // はじめに.md is an entry point, 設計.md is referenced
    expect(messages).toEqual([]);
  });

  it("resolves relative paths with parent directory traversal", () => {
    const messages = lint({
      "docs/index.md": "# Index\n\nSee [api](../api/spec.md)",
      "api/spec.md": "# API Spec\n\nSee [index](../docs/index.md)",
    });
    // Both files reference each other
    expect(messages).toEqual([]);
  });

  // --- siteRouter (starlight preset) ---

  it("counts incoming references via Starlight URL routing", () => {
    const messages = lint(
      {
        "/project/site/docs/docs/index/index.md": "[design](/docs/design/)",
        "/project/site/docs/docs/design/index.md": "Content",
      },
      {
        siteRouter: {
          preset: "starlight",
          contentDir: "/project/site/docs",
          defaultLocale: "root",
          locales: ["root"],
        },
        entryPoints: ["index/index.md"],
      },
    );
    // design/index.md gets a reference via /docs/design/
    // index/index.md is an entry point
    expect(messages).toEqual([]);
  });

  it("reports orphan even when other files have Starlight URLs", () => {
    const messages = lint(
      {
        "/project/site/docs/docs/index/index.md": "[design](/docs/design/)",
        "/project/site/docs/docs/design/index.md": "Content",
        "/project/site/docs/docs/orphan/index.md": "Nobody links here",
      },
      {
        siteRouter: {
          preset: "starlight",
          contentDir: "/project/site/docs",
          defaultLocale: "root",
          locales: ["root"],
        },
        entryPoints: ["index/index.md"],
      },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain("orphan/index.md");
  });

  it("counts ja-locale incoming references via Starlight URLs", () => {
    const messages = lint(
      {
        "/project/site/docs/ja/docs/index/index.md": "[設計](/ja/docs/design/)",
        "/project/site/docs/ja/docs/design/index.md": "コンテンツ",
      },
      {
        siteRouter: {
          preset: "starlight",
          contentDir: "/project/site/docs",
          defaultLocale: "root",
          locales: ["root", "ja"],
        },
        entryPoints: ["ja/docs/index/index.md"],
      },
    );
    expect(messages).toEqual([]);
  });
});
