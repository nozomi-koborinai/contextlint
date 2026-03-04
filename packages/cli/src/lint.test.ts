import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { lintFiles } from "./lint.js";
import type { ContextlintConfig } from "./config.js";

const fixturesDir = join(import.meta.dirname, "__fixtures__");

const config: ContextlintConfig = {
  rules: [
    {
      rule: "tbl001",
      options: { requiredColumns: ["ID", "Status"] },
    },
  ],
};

describe("lintFiles", () => {
  it("returns no messages for a valid file", async () => {
    const results = await lintFiles(["valid.md"], config, fixturesDir);
    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(0);
  });

  it("returns messages for a file with missing columns", async () => {
    const results = await lintFiles(
      ["missing-column.md"],
      config,
      fixturesDir,
    );
    expect(results).toHaveLength(1);
    expect(results[0].messages.length).toBeGreaterThan(0);
    expect(results[0].messages[0].ruleId).toBe("TBL-001");
    expect(results[0].messages[0].message).toContain("ID");
  });

  it("runs STR-001 as project-scoped rule", async () => {
    const str001Config: ContextlintConfig = {
      rules: [
        {
          rule: "str001",
          options: { files: ["valid.md", "nonexistent.md"] },
        },
      ],
    };
    const results = await lintFiles(["valid.md"], str001Config, fixturesDir);
    const projectResult = results.find((r) => r.filePath === "<project>");
    expect(projectResult).toBeDefined();
    expect(projectResult!.messages).toHaveLength(1);
    expect(projectResult!.messages[0].ruleId).toBe("STR-001");
    expect(projectResult!.messages[0].message).toContain("nonexistent.md");
  });

  it("does not include project result when STR-001 passes", async () => {
    const str001Config: ContextlintConfig = {
      rules: [
        {
          rule: "str001",
          options: { files: ["valid.md"] },
        },
      ],
    };
    const results = await lintFiles(["valid.md"], str001Config, fixturesDir);
    const projectResult = results.find((r) => r.filePath === "<project>");
    expect(projectResult).toBeUndefined();
  });

  it("throws on unknown rule", async () => {
    const badConfig: ContextlintConfig = {
      rules: [{ rule: "unknown-rule" }],
    };
    await expect(
      lintFiles(["valid.md"], badConfig, fixturesDir),
    ).rejects.toThrow('Unknown rule: "unknown-rule"');
  });
});
