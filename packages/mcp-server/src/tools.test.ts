import { describe, it, expect } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  parseDocument,
  runRules,
  resolveRule,
  formatContentResults,
  findConfig,
  loadConfig,
  lintFiles,
  formatFileResults,
} from "@contextlint/core";

function lintContent(
  content: string,
  rules: { rule: string; options?: Record<string, unknown> }[],
): string {
  const resolved = rules.map((entry) =>
    resolveRule(entry.rule, entry.options),
  );
  const document = parseDocument(content);
  const messages = runRules(resolved, document, "<input>");
  return formatContentResults(messages);
}

describe("lint tool logic", () => {
  it("returns no issues for valid content", () => {
    const content = `
| ID | Status |
|----|--------|
| 1  | Done   |
`;
    const result = lintContent(content, [
      { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
    ]);
    expect(result).toBe("No issues found.");
  });

  it("reports errors for missing columns", () => {
    const content = `
| ID |
|----|
| 1  |
`;
    const result = lintContent(content, [
      { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
    ]);
    expect(result).toContain("Status");
    expect(result).toContain("TBL-001");
    expect(result).toContain("1 error");
  });

  it("throws for unknown rule", () => {
    expect(() => lintContent("test", [{ rule: "unknown-rule" }])).toThrow(
      'Unknown rule: "unknown-rule"',
    );
  });
});

describe("lint-files tool logic", () => {
  const tmpDir = join(import.meta.dirname, "__tmp_mcp_lint_files__");

  it("lints files using config and formats results", () => {
    mkdirSync(tmpDir, { recursive: true });
    try {
      writeFileSync(
        join(tmpDir, "contextlint.config.json"),
        JSON.stringify({
          rules: [{ rule: "tbl001", options: { requiredColumns: ["ID"] } }],
        }),
      );
      writeFileSync(
        join(tmpDir, "doc.md"),
        "# Doc\n\n| Name |\n|------|\n| Foo  |\n",
      );

      const configPath = findConfig(tmpDir);
      expect(configPath).toBeDefined();
      if (!configPath) throw new Error("unreachable");

      const config = loadConfig(configPath);
      const results = lintFiles(["**/*.md"], config, tmpDir);
      const output = formatFileResults(results, tmpDir);
      expect(output).toContain("TBL-001");
      expect(output).toContain("ID");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
