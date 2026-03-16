import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { lintFiles } from "../../packages/core/src/lint-files.js";
import { loadConfig } from "../../packages/core/src/config.js";
import type { FileLintResult } from "../../packages/core/src/lint-files.js";
import type { LintMessage } from "../../packages/core/src/rule.js";

const fixturesDir = join(import.meta.dirname, "fixtures");

const fixtures = [
  { lang: "en", dir: "todo-app" },
  { lang: "ja", dir: "todo-app-ja" },
  { lang: "zh", dir: "todo-app-zh" },
  { lang: "ko", dir: "todo-app-ko" },
];

function runFixtureLint(fixtureDir: string): FileLintResult[] {
  const configPath = join(fixtureDir, "contextlint.config.json");
  const config = loadConfig(configPath);
  const patterns = config.include ?? ["**/*.md"];
  return lintFiles(patterns, config, fixtureDir);
}

function messagesFor(
  results: FileLintResult[],
  ruleId: string,
): LintMessage[] {
  return results.flatMap((r) =>
    r.messages.filter((m) => m.ruleId === ruleId),
  );
}

for (const fixture of fixtures) {
  describe(`E2E [${fixture.lang}]: ${fixture.dir}`, () => {
    const fixtureDir = join(fixturesDir, fixture.dir);
    const results = runFixtureLint(fixtureDir);

    it("loads config and lints all fixture files", () => {
      // 11 zone docs + 1 glossary.md = 12 files
      const fileCount = results.filter((r) => r.filePath !== "<project>").length;
      expect(fileCount).toBe(12);
    });

    // --- Table rules ---

    it("TBL-001: detects missing columns in non-requirement tables", () => {
      const violations = messagesFor(results, "TBL-001");
      // task/requirements.md has an "open items" table without ID/Requirement/Stability.
      // 1 table x 3 missing columns = 3 expected violations.
      expect(violations).toHaveLength(3);
      expect(violations.every((v) => v.message.includes("Missing required column"))).toBe(true);
    });

    it("TBL-003: stability values are all draft/review/stable", () => {
      expect(messagesFor(results, "TBL-003")).toHaveLength(0);
    });

    it("TBL-004: requirement IDs all match ^REQ- pattern", () => {
      expect(messagesFor(results, "TBL-004")).toHaveLength(0);
    });

    it("TBL-005: stable requirements have non-empty rationale", () => {
      expect(messagesFor(results, "TBL-005")).toHaveLength(0);
    });

    it("TBL-006: requirement IDs are unique across files", () => {
      expect(messagesFor(results, "TBL-006")).toHaveLength(0);
    });

    // --- Section rules ---

    it("SEC-001: overview files have required sections", () => {
      const violations = results
        .filter((r) => r.filePath.endsWith("overview.md"))
        .flatMap((r) => r.messages.filter((m) => m.ruleId === "SEC-001"));
      expect(violations).toHaveLength(0);
    });

    it("SEC-001: table design files have required sections", () => {
      const violations = results
        .filter((r) => /table_.*\.md$/.test(r.filePath))
        .flatMap((r) => r.messages.filter((m) => m.ruleId === "SEC-001"));
      expect(violations).toHaveLength(0);
    });

    it("SEC-002: table design files have sections in correct order", () => {
      expect(messagesFor(results, "SEC-002")).toHaveLength(0);
    });

    it("STR-001: all required zone files exist", () => {
      expect(messagesFor(results, "STR-001")).toHaveLength(0);
    });

    // --- Reference rules ---

    it("REF-001: detects the intentional broken link in spec_task.md", () => {
      const violations = messagesFor(results, "REF-001");
      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain("api_tasks.md");
    });

    it("REF-005: no broken anchor references", () => {
      expect(messagesFor(results, "REF-005")).toHaveLength(0);
    });

    // --- Context rules (CTX) ---

    it("CTX-001: detects placeholder content in overview", () => {
      const violations = messagesFor(results, "CTX-001");
      // task/overview.md has a "Future Enhancements" section with only "TBD"
      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain("TBD");
    });

    it("CTX-002: no glossary alias misuse detected", () => {
      // Glossary defines aliases but they are not used in the zone documents
      expect(messagesFor(results, "CTX-002")).toHaveLength(0);
    });

    // --- Graph rules (GRP) ---

    it("GRP-002: no circular references detected", () => {
      expect(messagesFor(results, "GRP-002")).toHaveLength(0);
    });

    it("GRP-003: detects orphan document (screen_login.md)", () => {
      const violations = messagesFor(results, "GRP-003");
      // screen_login.md has no incoming references from any other document
      // (overview.md and glossary.md are entry points, so excluded)
      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain("screen_login.md");
    });

    it("total violation count is 6", () => {
      const total = results.reduce((sum, r) => sum + r.messages.length, 0);
      // 3 TBL-001 (open items table) + 1 REF-001 (broken link)
      // + 1 CTX-001 (TBD placeholder) + 1 GRP-003 (orphan) = 6
      expect(total).toBe(6);
    });
  });
}
