import { describe, it, expect } from "bun:test";
import { formatFileResults, formatFileResultsJson } from "@contextlint/core";
import type { FileLintResult, JsonLintEntry } from "@contextlint/core";

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

describe("formatFileResultsJson", () => {
  it("returns an empty JSON array when there are no issues", () => {
    const results: FileLintResult[] = [
      { filePath: "/project/doc.md", messages: [] },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: JsonLintEntry[] = JSON.parse(output) as JsonLintEntry[];
    expect(parsed).toEqual([]);
  });

  it("outputs valid JSON with correct fields", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/docs/requirements.md",
        messages: [
          {
            ruleId: "TBL-001",
            severity: "error",
            message: 'Required column "Status" not found in table',
            line: 12,
          },
        ],
      },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: JsonLintEntry[] = JSON.parse(output) as JsonLintEntry[];
    expect(parsed).toHaveLength(1);
    const entry = parsed[0];
    if (!entry) throw new Error("Expected entry");
    expect(entry.file).toBe("docs/requirements.md");
    expect(entry.line).toBe(12);
    expect(entry.severity).toBe("error");
    expect(entry.message).toBe('Required column "Status" not found in table');
    expect(entry.ruleId).toBe("TBL-001");
  });

  it("flattens messages from multiple files into a single array", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/a.md",
        messages: [
          { ruleId: "TBL-001", severity: "error", message: "msg1", line: 1 },
        ],
      },
      {
        filePath: "/project/b.md",
        messages: [
          { ruleId: "TBL-002", severity: "warning", message: "msg2", line: 5 },
        ],
      },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: JsonLintEntry[] = JSON.parse(output) as JsonLintEntry[];
    expect(parsed).toHaveLength(2);
    const first = parsed[0];
    const second = parsed[1];
    if (!first || !second) throw new Error("Expected two entries");
    expect(first.file).toBe("a.md");
    expect(second.file).toBe("b.md");
  });

  it("uses '(project)' for project-level results", () => {
    const results: FileLintResult[] = [
      {
        filePath: "<project>",
        messages: [
          { ruleId: "STR-001", severity: "error", message: "Missing file", line: 0 },
        ],
      },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: JsonLintEntry[] = JSON.parse(output) as JsonLintEntry[];
    expect(parsed).toHaveLength(1);
    const entry = parsed[0];
    if (!entry) throw new Error("Expected entry");
    expect(entry.file).toBe("(project)");
  });

  it("skips files with no messages", () => {
    const results: FileLintResult[] = [
      { filePath: "/project/clean.md", messages: [] },
      {
        filePath: "/project/dirty.md",
        messages: [
          { ruleId: "TBL-001", severity: "error", message: "err", line: 3 },
        ],
      },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: JsonLintEntry[] = JSON.parse(output) as JsonLintEntry[];
    expect(parsed).toHaveLength(1);
    const entry = parsed[0];
    if (!entry) throw new Error("Expected entry");
    expect(entry.file).toBe("dirty.md");
  });
});
