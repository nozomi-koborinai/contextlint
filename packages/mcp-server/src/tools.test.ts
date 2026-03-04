import { describe, it, expect } from "vitest";
import { parseDocument, runRules, resolveRule } from "@contextlint/core";
import { formatContentResults } from "./format.js";

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
