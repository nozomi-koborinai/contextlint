import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref004 } from "./ref-004.js";
import type { Ref004Options } from "./ref-004.js";

const defaultOptions: Ref004Options = {
  zonesDir: "docs/zones",
};

function lint(
  currentFile: string,
  filesMap: Record<string, string>,
  options = defaultOptions,
) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref004(options);
  const doc = documents.get(currentFile);
  if (!doc) throw new Error("unreachable");
  return runRules([rule], doc, currentFile, { documents });
}

describe("REF-004", () => {
  it("passes when cross-zone reference is declared in Dependencies", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [users](../auth/table_users.md)",
        "docs/zones/bulletin-board/overview.md":
          "# Overview\n\n## Dependencies\n\n| Zone | Reason |\n|---|---|\n| auth | User identity |",
        "docs/zones/auth/table_users.md": "# Users",
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports undeclared cross-zone reference", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [users](../auth/table_users.md)",
        "docs/zones/bulletin-board/overview.md":
          "# Overview\n\nNo dependencies section here.",
        "docs/zones/auth/table_users.md": "# Users",
      },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("REF-004");
    expect(messages[0].message).toContain('"auth"');
    expect(messages[0].message).toContain("Dependencies");
  });

  it("passes for same-zone references", () => {
    const messages = lint(
      "docs/zones/auth/spec_login.md",
      {
        "docs/zones/auth/spec_login.md":
          "See [requirements](./requirements.md)",
        "docs/zones/auth/requirements.md": "# Requirements",
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports multiple undeclared cross-zone references", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [auth](../auth/table_users.md) and [infra](../infrastructure/design.md)",
        "docs/zones/bulletin-board/overview.md":
          "# Overview\n\n## Dependencies\n\n| Zone | Reason |\n|---|---|\n",
        "docs/zones/auth/table_users.md": "# Users",
        "docs/zones/infrastructure/design.md": "# Design",
      },
    );
    expect(messages).toHaveLength(2);
  });

  it("passes for files outside zones directory", () => {
    const messages = lint(
      "docs/foundation/standards.md",
      {
        "docs/foundation/standards.md":
          "See [overview](../zones/auth/overview.md)",
        "docs/zones/auth/overview.md": "# Auth",
      },
    );
    expect(messages).toEqual([]);
  });

  it("works with custom dependency section name", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [users](../auth/table_users.md)",
        "docs/zones/bulletin-board/overview.md":
          "# Overview\n\n## 依存関係\n\n| Zone | Reason |\n|---|---|\n| auth | User identity |",
        "docs/zones/auth/table_users.md": "# Users",
      },
      { zonesDir: "docs/zones", dependencySection: "依存関係" },
    );
    expect(messages).toEqual([]);
  });

  it("does nothing when documents is not provided", () => {
    const rule = ref004(defaultOptions);
    const doc = parseDocument("See [link](../auth/file.md)");
    const messages = runRules([rule], doc, "docs/zones/bb/spec.md");
    expect(messages).toEqual([]);
  });

  it("works with Korean dependency section name", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [users](../auth/table_users.md)",
        "docs/zones/bulletin-board/overview.md":
          "# 개요\n\n## 의존성\n\n| Zone | Reason |\n|---|---|\n| auth | 사용자 인증 |",
        "docs/zones/auth/table_users.md": "# Users",
      },
      { zonesDir: "docs/zones", dependencySection: "의존성" },
    );
    expect(messages).toEqual([]);
  });

  it("works with Chinese dependency section name", () => {
    const messages = lint(
      "docs/zones/bulletin-board/spec_content.md",
      {
        "docs/zones/bulletin-board/spec_content.md":
          "See [users](../auth/table_users.md)",
        "docs/zones/bulletin-board/overview.md":
          "# 概述\n\n## 依赖关系\n\n| Zone | Reason |\n|---|---|\n| auth | 用户认证 |",
        "docs/zones/auth/table_users.md": "# Users",
      },
      { zonesDir: "docs/zones", dependencySection: "依赖关系" },
    );
    expect(messages).toEqual([]);
  });
});
