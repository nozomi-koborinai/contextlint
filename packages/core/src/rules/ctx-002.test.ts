import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ctx002 } from "./ctx-002.js";
import type { Ctx002Options } from "./ctx-002.js";

const defaultOptions: Ctx002Options = {
  glossary: "docs/glossary.md",
  termColumn: "Term",
  aliasColumn: "Aliases",
};

function lint(
  filesMap: Record<string, string>,
  options: Ctx002Options = defaultOptions,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ctx002(options);
  return runRules([rule], parseDocument(""), "<project>", {
    documents,
  });
}

describe("CTX-002", () => {
  it("reports alias usage in prose text", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB, database |",
      "docs/design.md": "# Design\n\nWe use a DB for storage.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("CTX-002");
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain('"DB"');
    expect(messages[0].message).toContain('"Database"');
    expect(messages[0].message).toContain("glossary");
  });

  it("does not report canonical terms", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |",
      "docs/design.md": "# Design\n\nWe use a Database for storage.",
    });
    expect(messages).toEqual([]);
  });

  it("performs case-insensitive matching", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | db |",
      "docs/design.md": "# Design\n\nWe use a DB for storage.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"db"');
    expect(messages[0].message).toContain('"Database"');
  });

  it("skips the glossary file itself", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |\n\nDB is an alias.",
    });
    expect(messages).toEqual([]);
  });

  it("reports correct line numbers", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |",
      "docs/design.md": "# Design\n\nLine 3\n\nLine 5 uses DB here.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(5);
  });

  it("handles multiple aliases per term", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Authentication | auth, authn |",
      "docs/design.md": "# Design\n\nUse auth for login. Also authn works.",
    });
    expect(messages).toHaveLength(2);
    const aliasTexts = messages.map((m) => m.message);
    expect(aliasTexts.some((m) => m.includes('"auth"'))).toBe(true);
    expect(aliasTexts.some((m) => m.includes('"authn"'))).toBe(true);
  });

  it("handles multiple glossary entries", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |\n| Server | srv |",
      "docs/design.md": "# Design\n\nDB connects to srv.",
    });
    expect(messages).toHaveLength(2);
  });

  it("reports aliases in multiple files", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |",
      "docs/design.md": "# Design\n\nUses a DB.",
      "docs/spec.md": "# Spec\n\nDB layer.",
    });
    expect(messages).toHaveLength(2);
  });

  it("respects the files option", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| Term | Aliases |\n|---|---|\n| Database | DB |",
        "docs/design.md": "# Design\n\nUses a DB.",
        "other/notes.md": "# Notes\n\nDB here too.",
      },
      { ...defaultOptions, files: "docs/**/*.md" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"DB"');
  });

  it("respects the section option for glossary table", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "# Other\n\n| Term | Aliases |\n|---|---|\n| Ignored | ign |\n\n# Glossary\n\n| Term | Aliases |\n|---|---|\n| Database | DB |",
        "docs/design.md": "# Design\n\nUses a DB. Also ign here.",
      },
      { ...defaultOptions, section: "Glossary" },
    );
    // Only the "Glossary" section table should be used
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"DB"');
  });

  it("word boundary: does not match ASCII alias inside larger word", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Authentication | auth |",
      "docs/design.md":
        "# Design\n\nThe authentication module is ready.",
    });
    // "auth" should NOT match inside "authentication"
    expect(messages).toEqual([]);
  });

  it("word boundary: matches ASCII alias as standalone word", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Authentication | auth |",
      "docs/design.md": "# Design\n\nUse auth to log in.",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"auth"');
  });

  it("handles empty alias column gracefully", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database |  |",
      "docs/design.md": "# Design\n\nDB is here.",
    });
    expect(messages).toEqual([]);
  });

  it("does nothing when documents is not provided", () => {
    const rule = ctx002(defaultOptions);
    const messages = runRules([rule], parseDocument(""), "<project>");
    expect(messages).toEqual([]);
  });

  it("does nothing when glossary file is not found", () => {
    const messages = lint({
      "docs/other.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |",
      "docs/design.md": "# Design\n\nDB is here.",
    });
    expect(messages).toEqual([]);
  });

  it("skips tables missing the term or alias column", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Name | Description |\n|---|---|\n| Database | A storage system |",
      "docs/design.md": "# Design\n\nDB is here.",
    });
    expect(messages).toEqual([]);
  });

  // CJK: Japanese
  it("detects Japanese aliases", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 用語 | 別名 |\n|---|---|\n| ユーザー | 利用者, User |",
        "docs/design.md": "# 設計\n\n利用者がログインする。",
      },
      { ...defaultOptions, termColumn: "用語", aliasColumn: "別名" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"利用者"');
    expect(messages[0].message).toContain('"ユーザー"');
  });

  it("does not report canonical Japanese terms", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 用語 | 別名 |\n|---|---|\n| ユーザー | 利用者 |",
        "docs/design.md": "# 設計\n\nユーザーがログインする。",
      },
      { ...defaultOptions, termColumn: "用語", aliasColumn: "別名" },
    );
    expect(messages).toEqual([]);
  });

  it("detects Japanese aliases in table cells", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 用語 | 別名 |\n|---|---|\n| 認証 | Authentication, auth |",
        "docs/spec.md":
          "# 仕様\n\n| 機能 | 説明 |\n|---|---|\n| ログイン | auth で本人確認 |",
      },
      { ...defaultOptions, termColumn: "用語", aliasColumn: "別名" },
    );
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const authMsg = messages.find((m) => m.message.includes('"auth"'));
    expect(authMsg).toBeDefined();
  });

  // CJK: Korean
  it("detects Korean aliases", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 용어 | 별칭 |\n|---|---|\n| 사용자 | 이용자, User |",
        "docs/design.md": "# 설계\n\n이용자가 로그인합니다.",
      },
      { ...defaultOptions, termColumn: "용어", aliasColumn: "별칭" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"이용자"');
    expect(messages[0].message).toContain('"사용자"');
  });

  it("does not report canonical Korean terms", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 용어 | 별칭 |\n|---|---|\n| 사용자 | 이용자 |",
        "docs/design.md": "# 설계\n\n사용자가 로그인합니다.",
      },
      { ...defaultOptions, termColumn: "용어", aliasColumn: "별칭" },
    );
    expect(messages).toEqual([]);
  });

  // CJK: Chinese
  it("detects Chinese aliases", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 术语 | 别名 |\n|---|---|\n| 用户 | 使用者, User |",
        "docs/design.md": "# 设计\n\n使用者登录系统。",
      },
      { ...defaultOptions, termColumn: "术语", aliasColumn: "别名" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"使用者"');
    expect(messages[0].message).toContain('"用户"');
  });

  it("does not report canonical Chinese terms", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 术语 | 别名 |\n|---|---|\n| 用户 | 使用者 |",
        "docs/design.md": "# 设计\n\n用户登录系统。",
      },
      { ...defaultOptions, termColumn: "术语", aliasColumn: "别名" },
    );
    expect(messages).toEqual([]);
  });

  it("detects mixed CJK and ASCII aliases", () => {
    const messages = lint(
      {
        "docs/glossary.md":
          "| 用語 | 別名 |\n|---|---|\n| 認証 | auth, 本人確認 |",
        "docs/design.md":
          "# 設計\n\nauth を使って本人確認を行う。",
      },
      { ...defaultOptions, termColumn: "用語", aliasColumn: "別名" },
    );
    expect(messages).toHaveLength(2);
    const msgs = messages.map((m) => m.message);
    expect(msgs.some((m) => m.includes('"auth"'))).toBe(true);
    expect(msgs.some((m) => m.includes('"本人確認"'))).toBe(true);
  });

  it("handles multiple occurrences of the same alias", () => {
    const messages = lint({
      "docs/glossary.md":
        "| Term | Aliases |\n|---|---|\n| Database | DB |",
      "docs/design.md":
        "# Design\n\nDB is used here.\n\nAnd DB is used again.",
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].line).toBe(3);
    expect(messages[1].line).toBe(5);
  });
});
