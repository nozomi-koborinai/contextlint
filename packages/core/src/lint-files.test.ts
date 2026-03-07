import { describe, it, expect } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { lintFiles } from "./lint-files.js";

const tmpDir = join(import.meta.dirname, "__tmp_lint_files_test__");

function setup() {
  mkdirSync(tmpDir, { recursive: true });
}

function cleanup() {
  rmSync(tmpDir, { recursive: true, force: true });
}

describe("lintFiles", () => {
  it("returns no messages for valid files", () => {
    setup();
    try {
      writeFileSync(
        join(tmpDir, "valid.md"),
        "# Tasks\n\n| ID | Status |\n|----|--------|\n| 1  | Done   |\n",
      );

      const results = lintFiles(["valid.md"], {
        rules: [
          { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
        ],
      }, tmpDir);

      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(0);
    } finally {
      cleanup();
    }
  });

  it("returns messages for document-scoped rule violations", () => {
    setup();
    try {
      writeFileSync(
        join(tmpDir, "missing.md"),
        "# Tasks\n\n| Title |\n|-------|\n| Setup |\n",
      );

      const results = lintFiles(["missing.md"], {
        rules: [
          { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
        ],
      }, tmpDir);

      expect(results).toHaveLength(1);
      expect(results[0].messages.length).toBeGreaterThan(0);
      expect(results[0].messages[0].ruleId).toBe("TBL-001");
    } finally {
      cleanup();
    }
  });

  it("runs project-scoped rules", () => {
    setup();
    try {
      writeFileSync(join(tmpDir, "a.md"), "# A\n");

      const results = lintFiles(["a.md"], {
        rules: [
          { rule: "str001", options: { files: ["a.md", "nonexistent.md"] } },
        ],
      }, tmpDir);

      const projectResult = results.find((r) => r.filePath === "<project>");
      expect(projectResult).toBeDefined();
      if (!projectResult) throw new Error("unreachable");
      expect(projectResult.messages).toHaveLength(1);
      expect(projectResult.messages[0].ruleId).toBe("STR-001");
    } finally {
      cleanup();
    }
  });

  it("passes documents map to cross-file document-scoped rules (REF-001)", () => {
    setup();
    try {
      writeFileSync(
        join(tmpDir, "a.md"),
        "# A\n\n[link to b](./b.md)\n\n[link to c](./c.md)\n",
      );
      writeFileSync(join(tmpDir, "b.md"), "# B\n");

      const results = lintFiles(["a.md", "b.md"], {
        rules: [{ rule: "ref001" }],
      }, tmpDir);

      const aResult = results.find((r) => r.filePath.endsWith("a.md"));
      expect(aResult).toBeDefined();
      if (!aResult) throw new Error("unreachable");
      expect(aResult.messages).toHaveLength(1);
      expect(aResult.messages[0].ruleId).toBe("REF-001");
      expect(aResult.messages[0].message).toContain("c.md");
    } finally {
      cleanup();
    }
  });

  it("passes documents map to cross-file project-scoped rules (REF-002)", () => {
    setup();
    try {
      writeFileSync(
        join(tmpDir, "requirements.md"),
        "# Requirements\n\n| ID | Description |\n|----|-------------|\n| REQ-01 | First |\n| REQ-02 | Second |\n",
      );
      writeFileSync(
        join(tmpDir, "spec.md"),
        "# Spec\n\nThis implements REQ-01.\n",
      );

      const results = lintFiles(["requirements.md", "spec.md"], {
        rules: [
          {
            rule: "ref002",
            options: {
              definitions: "**/requirements.md",
              references: ["**/spec.md"],
              idColumn: "ID",
              idPattern: "^REQ-\\d{2}$",
            },
          },
        ],
      }, tmpDir);

      const projectResult = results.find((r) => r.filePath === "<project>");
      expect(projectResult).toBeDefined();
      if (!projectResult) throw new Error("unreachable");
      // REQ-02 is defined but never referenced
      expect(projectResult.messages).toHaveLength(1);
      expect(projectResult.messages[0].ruleId).toBe("REF-002");
      expect(projectResult.messages[0].message).toContain("REQ-02");
    } finally {
      cleanup();
    }
  });
});
