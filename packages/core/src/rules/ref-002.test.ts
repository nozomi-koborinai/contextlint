import { describe, it, expect } from "vitest";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref002 } from "./ref-002.js";

const defaultOptions = {
  definitions: "docs/zones/*/requirements.md",
  references: ["docs/zones/**/table_*.md", "docs/zones/**/spec_*.md"],
  idColumn: "ID",
  idPattern: "^REQ-",
};

function lint(
  filesMap: Record<string, string>,
  options = defaultOptions,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref002(options);
  return runRules([rule], parseDocument(""), "<project>", { documents });
}

describe("REF-002", () => {
  it("passes when all defined IDs are referenced and all references exist", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
    });
    expect(messages).toEqual([]);
  });

  it("reports dangling reference (referenced but not defined)", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref |\n|---|---|\n| TBL-01 | REQ-AUTH-99 |",
    });
    const dangling = messages.filter((m) => m.severity === "error");
    const orphan = messages.filter((m) => m.severity === "warning");
    expect(dangling).toHaveLength(1);
    expect(dangling[0].message).toContain("REQ-AUTH-99");
    expect(dangling[0].message).toContain("not defined");
    expect(orphan).toHaveLength(1);
    expect(orphan[0].message).toContain("REQ-AUTH-01");
    expect(orphan[0].message).toContain("never referenced");
  });

  it("reports orphan definition (defined but not referenced)", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |\n| REQ-AUTH-02 | Logout |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("REQ-AUTH-02");
  });

  it("detects references in prose text", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/zones/auth/spec_login.md":
        "# Login Spec\n\nThis implements REQ-AUTH-01 from the requirements.",
    });
    expect(messages).toEqual([]);
  });

  it("detects dangling references in prose text", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/zones/auth/spec_login.md":
        "# Login Spec\n\nSee REQ-AUTH-99 for details.",
    });
    const dangling = messages.filter((m) => m.severity === "error");
    expect(dangling).toHaveLength(1);
    expect(dangling[0].message).toContain("REQ-AUTH-99");
  });

  it("only scans definition files matching the definitions pattern", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/other/notes.md":
        "| ID | Name |\n|---|---|\n| REQ-OTHER-01 | Note |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
    });
    // REQ-OTHER-01 is not in a definitions file, so no orphan warning for it
    expect(messages).toEqual([]);
  });

  it("only scans reference files matching the references pattern", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | Login |",
      "docs/zones/auth/notes.md":
        "| Ref |\n|---|\n| REQ-AUTH-01 |",
    });
    // notes.md doesn't match table_* or spec_* pattern, so REQ-AUTH-01 is orphaned
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe("warning");
  });

  it("does nothing when documents is not provided", () => {
    const rule = ref002(defaultOptions);
    const messages = runRules([rule], parseDocument(""), "<project>");
    expect(messages).toEqual([]);
  });

  it("traces IDs with Japanese column names", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| 識別子 | 名前 |\n|---|---|\n| REQ-AUTH-01 | ログイン |",
        "docs/zones/auth/table_users.md":
          "| 識別子 | 参照 |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
      },
      { ...defaultOptions, idColumn: "識別子" },
    );
    expect(messages).toEqual([]);
  });

  it("traces IDs with Korean column names", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| 식별자 | 이름 |\n|---|---|\n| REQ-AUTH-01 | 로그인 |",
        "docs/zones/auth/table_users.md":
          "| 식별자 | 참조 |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
      },
      { ...defaultOptions, idColumn: "식별자" },
    );
    expect(messages).toEqual([]);
  });

  it("traces IDs with Chinese column names", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| 标识符 | 名称 |\n|---|---|\n| REQ-AUTH-01 | 登录 |",
        "docs/zones/auth/table_users.md":
          "| 标识符 | 引用 |\n|---|---|\n| TBL-01 | REQ-AUTH-01 |",
      },
      { ...defaultOptions, idColumn: "标识符" },
    );
    expect(messages).toEqual([]);
  });

  it("detects references in Japanese prose text", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | ログイン |",
      "docs/zones/auth/spec_login.md":
        "# ログイン仕様\n\nこの機能は REQ-AUTH-01 の要件を実装します。",
    });
    expect(messages).toEqual([]);
  });

  it("detects references in Korean prose text", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | 로그인 |",
      "docs/zones/auth/spec_login.md":
        "# 로그인 사양\n\n이 기능은 REQ-AUTH-01 요구사항을 구현합니다.",
    });
    expect(messages).toEqual([]);
  });

  it("detects references in Chinese prose text", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-AUTH-01 | 登录 |",
      "docs/zones/auth/spec_login.md":
        "# 登录规范\n\n本功能实现了 REQ-AUTH-01 的需求。",
    });
    expect(messages).toEqual([]);
  });
});
