import { describe, it, expect } from "bun:test";
import { formatFileResults } from "@contextlint/core";
import type { FileLintResult } from "@contextlint/core";

describe("formatFileResults", () => {
  it("returns 'No issues found.' when there are no errors", () => {
    const results: FileLintResult[] = [
      { filePath: "/project/doc.md", messages: [] },
    ];
    expect(formatFileResults(results, "/project")).toBe("No issues found.");
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
    const output = formatFileResults(results, "/project");
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
    const output = formatFileResults(results, "/project");
    expect(output).toContain("2 errors in 2 files");
  });

  it("separates error and warning counts in summary", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/doc.md",
        messages: [
          {
            ruleId: "TBL-001",
            severity: "error",
            message: "error msg",
            line: 1,
          },
          {
            ruleId: "TBL-002",
            severity: "warning",
            message: "warning msg",
            line: 2,
          },
        ],
      },
    ];
    const output = formatFileResults(results, "/project");
    expect(output).toContain("1 error, 1 warning in 1 file");
  });

  it("shows only warnings in summary when no errors", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/doc.md",
        messages: [
          {
            ruleId: "TBL-002",
            severity: "warning",
            message: "warning msg",
            line: 1,
          },
        ],
      },
    ];
    const output = formatFileResults(results, "/project");
    expect(output).toContain("1 warning in 1 file");
    expect(output).not.toContain("error");
  });
});
