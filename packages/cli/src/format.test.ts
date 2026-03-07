import { describe, it, expect } from "bun:test";
import { formatResults } from "./format.js";
import type { FileLintResult } from "./lint.js";

describe("formatResults", () => {
  it("returns 'No issues found.' when there are no errors", () => {
    const results: FileLintResult[] = [
      { filePath: "/project/doc.md", messages: [] },
    ];
    expect(formatResults(results, "/project")).toBe("No issues found.");
  });

  it("formats errors with line number, severity, and ruleId", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/docs/CONTEXT.md",
        messages: [
          {
            ruleId: "TBL-001",
            severity: "error",
            message: 'Missing required column "ID" in table',
            line: 5,
          },
        ],
      },
    ];
    const output = formatResults(results, "/project");
    expect(output).toContain("docs/CONTEXT.md");
    expect(output).toContain("line 5");
    expect(output).toContain("error");
    expect(output).toContain("TBL-001");
    expect(output).toContain("1 error in 1 file");
  });

  it("shows correct plural for multiple errors in multiple files", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/a.md",
        messages: [
          {
            ruleId: "TBL-001",
            severity: "error",
            message: "msg1",
            line: 1,
          },
        ],
      },
      {
        filePath: "/project/b.md",
        messages: [
          {
            ruleId: "TBL-001",
            severity: "error",
            message: "msg2",
            line: 2,
          },
        ],
      },
    ];
    const output = formatResults(results, "/project");
    expect(output).toContain("2 errors in 2 files");
  });
});
