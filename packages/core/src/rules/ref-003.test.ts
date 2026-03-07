import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref003 } from "./ref-003.js";

const defaultOptions = {
  stabilityColumn: "Stability",
  stabilityOrder: ["draft", "review", "stable"],
  definitions: "docs/zones/*/requirements.md",
  references: ["docs/zones/**/table_*.md"],
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

  const rule = ref003(options);
  return runRules([rule], parseDocument(""), "<project>", { documents });
}

describe("REF-003", () => {
  it("passes when stability is consistent", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | review |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref | Stability |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | review |",
    });
    expect(messages).toEqual([]);
  });

  it("passes when reference has lower stability than definition", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | stable |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref | Stability |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | draft |",
    });
    expect(messages).toEqual([]);
  });

  it("warns when reference has higher stability than definition", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | draft |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref | Stability |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | review |",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("REQ-AUTH-01");
    expect(messages[0].message).toContain('"draft"');
    expect(messages[0].message).toContain('"review"');
  });

  it("warns when stable references draft", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | draft |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref | Stability |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | stable |",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('"draft"');
    expect(messages[0].message).toContain('"stable"');
  });

  it("handles multiple references in one row", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | draft |\n| REQ-AUTH-02 | stable |",
      "docs/zones/auth/table_users.md":
        "| Ref1 | Ref2 | Stability |\n|---|---|---|\n| REQ-AUTH-01 | REQ-AUTH-02 | review |",
    });
    // REQ-AUTH-01 is draft, row is review → warning
    // REQ-AUTH-02 is stable, row is review → ok
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("REQ-AUTH-01");
  });

  it("skips rows without stability value", () => {
    const messages = lint({
      "docs/zones/auth/requirements.md":
        "| ID | Stability |\n|---|---|\n| REQ-AUTH-01 | draft |",
      "docs/zones/auth/table_users.md":
        "| ID | Ref | Stability |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 |  |",
    });
    expect(messages).toEqual([]);
  });

  it("works with custom stability column name", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| ID | 安定度 |\n|---|---|\n| REQ-AUTH-01 | draft |",
        "docs/zones/auth/table_users.md":
          "| ID | Ref | 安定度 |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | stable |",
      },
      { ...defaultOptions, stabilityColumn: "安定度" },
    );
    expect(messages).toHaveLength(1);
  });

  it("does nothing when documents is not provided", () => {
    const rule = ref003(defaultOptions);
    const messages = runRules([rule], parseDocument(""), "<project>");
    expect(messages).toEqual([]);
  });

  it("works with Korean stability column name", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| ID | 안정성 |\n|---|---|\n| REQ-AUTH-01 | draft |",
        "docs/zones/auth/table_users.md":
          "| ID | Ref | 안정성 |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | stable |",
      },
      { ...defaultOptions, stabilityColumn: "안정성" },
    );
    expect(messages).toHaveLength(1);
  });

  it("works with Chinese stability column name", () => {
    const messages = lint(
      {
        "docs/zones/auth/requirements.md":
          "| ID | 稳定性 |\n|---|---|\n| REQ-AUTH-01 | draft |",
        "docs/zones/auth/table_users.md":
          "| ID | Ref | 稳定性 |\n|---|---|---|\n| TBL-01 | REQ-AUTH-01 | stable |",
      },
      { ...defaultOptions, stabilityColumn: "稳定性" },
    );
    expect(messages).toHaveLength(1);
  });
});
