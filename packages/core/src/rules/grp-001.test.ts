import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { grp001 } from "./grp-001.js";

function lint(
  filesMap: Record<string, string>,
  options: {
    chain: { stage: string; files: string; idColumn?: string; refColumn?: string }[];
    idPattern?: string;
  },
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = grp001(options);
  return runRules([rule], parseDocument(""), "<project>", { documents });
}

const twoStageChain = {
  chain: [
    { stage: "Requirements", files: "**/requirements.md", idColumn: "ID" },
    { stage: "Design", files: "**/design.md", refColumn: "Requirement" },
  ],
};

const threeStageChain = {
  chain: [
    { stage: "Requirements", files: "**/requirements.md", idColumn: "ID" },
    { stage: "Design", files: "**/design.md", refColumn: "Requirement" },
    { stage: "Test", files: "**/test-plan.md", refColumn: "Covers" },
  ],
};

describe("GRP-001", () => {
  // --- 2-stage chain ---

  it("passes when all IDs are traced in a 2-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| REQ-002 | Logout |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |\n| REQ-002 | Design logout |",
      },
      twoStageChain,
    );
    expect(messages).toEqual([]);
  });

  it("reports IDs missing in second stage of a 2-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| REQ-002 | Logout |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      twoStageChain,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("GRP-001");
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("REQ-002");
    expect(messages[0].message).toContain("defined in docs/requirements.md");
    expect(messages[0].message).toContain('stage "Design"');
  });

  // --- 3-stage chain ---

  it("passes when all IDs are traced through a 3-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
        "docs/test-plan.md":
          "| Covers | Test |\n|---|---|\n| REQ-001 | Test login |",
      },
      threeStageChain,
    );
    expect(messages).toEqual([]);
  });

  it("reports gaps at each transition in a 3-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| REQ-002 | Logout |\n| REQ-003 | Profile |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |\n| REQ-003 | Design profile |",
        "docs/test-plan.md":
          "| Covers | Test |\n|---|---|\n| REQ-001 | Test login |",
      },
      threeStageChain,
    );
    // REQ-002 missing in Design, REQ-003 traced to Design but missing in Test
    const stage1Gaps = messages.filter((m) => m.message.includes('stage "Design"'));
    const stage2Gaps = messages.filter((m) => m.message.includes('stage "Test"'));
    expect(stage1Gaps).toHaveLength(1);
    expect(stage1Gaps[0].message).toContain("REQ-002");
    expect(stage2Gaps).toHaveLength(1);
    expect(stage2Gaps[0].message).toContain("REQ-003");
  });

  it("reports only second transition gap when first transition is complete", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| REQ-002 | Logout |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |\n| REQ-002 | Design logout |",
        "docs/test-plan.md":
          "| Covers | Test |\n|---|---|\n| REQ-001 | Test login |",
      },
      threeStageChain,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-002");
    expect(messages[0].message).toContain('traced to "Design"');
    expect(messages[0].message).toContain('stage "Test"');
  });

  // --- idPattern filtering ---

  it("only checks IDs matching idPattern", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| NOTE-1 | Note |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      { ...twoStageChain, idPattern: "^REQ-\\d{3}$" },
    );
    // NOTE-1 does not match pattern, so no gap reported for it
    expect(messages).toEqual([]);
  });

  it("reports gaps only for IDs matching idPattern", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n| REQ-002 | Logout |\n| NOTE-1 | Note |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      { ...twoStageChain, idPattern: "^REQ-\\d{3}$" },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-002");
  });

  // --- file matching ---

  it("only matches files according to stage file patterns", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |",
        "docs/other.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      twoStageChain,
    );
    // other.md doesn't match **/design.md, so REQ-001 is not traced
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-001");
  });

  // --- missing columns ---

  it("skips tables without the expected column", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| Name |\n|---|\n| Login |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      twoStageChain,
    );
    // No IDs collected from requirements since "ID" column is absent
    expect(messages).toEqual([]);
  });

  // --- empty cells ---

  it("skips empty cell values", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| ID | Name |\n|---|---|\n| REQ-001 | Login |\n|  | Empty |",
        "docs/design.md":
          "| Requirement | Detail |\n|---|---|\n| REQ-001 | Design login |",
      },
      twoStageChain,
    );
    expect(messages).toEqual([]);
  });

  // --- no documents ---

  it("does nothing when documents is not provided", () => {
    const rule = grp001(twoStageChain);
    const messages = runRules([rule], parseDocument(""), "<project>");
    expect(messages).toEqual([]);
  });

  // --- CJK: Japanese ---

  it("traces IDs with Japanese column names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 識別子 | 名前 |\n|---|---|\n| REQ-001 | ログイン |",
        "docs/design.md":
          "| 要件 | 詳細 |\n|---|---|\n| REQ-001 | ログイン設計 |",
      },
      {
        chain: [
          { stage: "要件", files: "**/requirements.md", idColumn: "識別子" },
          { stage: "設計", files: "**/design.md", refColumn: "要件" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports gaps with Japanese stage names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 識別子 | 名前 |\n|---|---|\n| REQ-001 | ログイン |\n| REQ-002 | ログアウト |",
        "docs/design.md":
          "| 要件 | 詳細 |\n|---|---|\n| REQ-001 | ログイン設計 |",
      },
      {
        chain: [
          { stage: "要件", files: "**/requirements.md", idColumn: "識別子" },
          { stage: "設計", files: "**/design.md", refColumn: "要件" },
        ],
      },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-002");
    expect(messages[0].message).toContain('"設計"');
  });

  it("traces Japanese IDs through a 3-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 識別子 | 名前 |\n|---|---|\n| 要件-001 | ログイン |",
        "docs/design.md":
          "| 要件参照 | 詳細 |\n|---|---|\n| 要件-001 | ログイン設計 |",
        "docs/test-plan.md":
          "| 対象 | テスト内容 |\n|---|---|\n| 要件-001 | ログインテスト |",
      },
      {
        chain: [
          { stage: "要件", files: "**/requirements.md", idColumn: "識別子" },
          { stage: "設計", files: "**/design.md", refColumn: "要件参照" },
          { stage: "テスト", files: "**/test-plan.md", refColumn: "対象" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });

  // --- CJK: Korean ---

  it("traces IDs with Korean column names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 식별자 | 이름 |\n|---|---|\n| REQ-001 | 로그인 |",
        "docs/design.md":
          "| 요구사항 | 상세 |\n|---|---|\n| REQ-001 | 로그인 설계 |",
      },
      {
        chain: [
          { stage: "요구사항", files: "**/requirements.md", idColumn: "식별자" },
          { stage: "설계", files: "**/design.md", refColumn: "요구사항" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports gaps with Korean stage names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 식별자 | 이름 |\n|---|---|\n| REQ-001 | 로그인 |\n| REQ-002 | 로그아웃 |",
        "docs/design.md":
          "| 요구사항 | 상세 |\n|---|---|\n| REQ-001 | 로그인 설계 |",
      },
      {
        chain: [
          { stage: "요구사항", files: "**/requirements.md", idColumn: "식별자" },
          { stage: "설계", files: "**/design.md", refColumn: "요구사항" },
        ],
      },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-002");
    expect(messages[0].message).toContain('"설계"');
  });

  it("traces Korean IDs through a 3-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 식별자 | 이름 |\n|---|---|\n| 요구-001 | 로그인 |",
        "docs/design.md":
          "| 요구참조 | 상세 |\n|---|---|\n| 요구-001 | 로그인 설계 |",
        "docs/test-plan.md":
          "| 대상 | 테스트 |\n|---|---|\n| 요구-001 | 로그인 테스트 |",
      },
      {
        chain: [
          { stage: "요구사항", files: "**/requirements.md", idColumn: "식별자" },
          { stage: "설계", files: "**/design.md", refColumn: "요구참조" },
          { stage: "테스트", files: "**/test-plan.md", refColumn: "대상" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });

  // --- CJK: Chinese ---

  it("traces IDs with Chinese column names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 标识符 | 名称 |\n|---|---|\n| REQ-001 | 登录 |",
        "docs/design.md":
          "| 需求 | 详情 |\n|---|---|\n| REQ-001 | 登录设计 |",
      },
      {
        chain: [
          { stage: "需求", files: "**/requirements.md", idColumn: "标识符" },
          { stage: "设计", files: "**/design.md", refColumn: "需求" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports gaps with Chinese stage names", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 标识符 | 名称 |\n|---|---|\n| REQ-001 | 登录 |\n| REQ-002 | 登出 |",
        "docs/design.md":
          "| 需求 | 详情 |\n|---|---|\n| REQ-001 | 登录设计 |",
      },
      {
        chain: [
          { stage: "需求", files: "**/requirements.md", idColumn: "标识符" },
          { stage: "设计", files: "**/design.md", refColumn: "需求" },
        ],
      },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-002");
    expect(messages[0].message).toContain('"设计"');
  });

  it("traces Chinese IDs through a 3-stage chain", () => {
    const messages = lint(
      {
        "docs/requirements.md":
          "| 标识符 | 名称 |\n|---|---|\n| 需求-001 | 登录 |",
        "docs/design.md":
          "| 需求引用 | 详情 |\n|---|---|\n| 需求-001 | 登录设计 |",
        "docs/test-plan.md":
          "| 覆盖 | 测试 |\n|---|---|\n| 需求-001 | 登录测试 |",
      },
      {
        chain: [
          { stage: "需求", files: "**/requirements.md", idColumn: "标识符" },
          { stage: "设计", files: "**/design.md", refColumn: "需求引用" },
          { stage: "测试", files: "**/test-plan.md", refColumn: "覆盖" },
        ],
      },
    );
    expect(messages).toEqual([]);
  });
});
