import { describe, it, expect } from "vitest";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl005 } from "./tbl-005.js";

describe("TBL-005: cross-column conditional constraints", () => {
  describe("notEmpty constraint", () => {
    it("reports error when condition is met but target column is empty", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  | Done   |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].ruleId).toBe("TBL-005");
      expect(messages[0].message).toContain('Status="Done"');
      expect(messages[0].message).toContain("Date");
      expect(messages[0].message).toContain("must not be empty");
    });

    it("reports no errors when condition is met and target column is filled", () => {
      const md = `
| ID | Status | Date       |
|----|--------|------------|
| 1  | Done   | 2026-03-07 |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });

    it("skips rows where condition is not met", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  | WIP    |      |
| 2  | Todo   |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });
  });

  describe("equals constraint", () => {
    it("reports error when target column does not equal expected value", () => {
      const md = `
| ID | Priority | Reviewed |
|----|----------|----------|
| 1  | Critical | No       |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Priority", equals: "Critical" },
        then: { column: "Reviewed", equals: "Yes" },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain('must equal "Yes"');
    });

    it("reports no errors when target column equals expected value", () => {
      const md = `
| ID | Priority | Reviewed |
|----|----------|----------|
| 1  | Critical | Yes      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Priority", equals: "Critical" },
        then: { column: "Reviewed", equals: "Yes" },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });
  });

  describe("oneOf condition and constraint", () => {
    it("matches condition with oneOf", () => {
      const md = `
| ID | Type   | Severity |
|----|--------|----------|
| 1  | Bug    | Unknown  |
| 2  | Defect | Unknown  |
| 3  | Task   | Unknown  |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Type", oneOf: ["Bug", "Defect"] },
        then: { column: "Severity", oneOf: ["High", "Medium", "Low"] },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(2);
    });

    it("skips rows not matching oneOf condition", () => {
      const md = `
| ID | Type | Severity |
|----|------|----------|
| 1  | Task | Unknown  |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Type", oneOf: ["Bug", "Defect"] },
        then: { column: "Severity", oneOf: ["High", "Medium", "Low"] },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });
  });

  describe("matches condition and constraint", () => {
    it("uses regex for condition matching", () => {
      const md = `
| ID       | Date |
|----------|------|
| REQ-001  |      |
| NOTE-001 |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "ID", matches: "^REQ-" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
    });

    it("validates target column with regex", () => {
      const md = `
| ID | Status | Date       |
|----|--------|------------|
| 1  | Done   | 2026-03-07 |
| 2  | Done   | not-a-date |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", matches: "^\\d{4}-\\d{2}-\\d{2}$" },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain("must match");
    });
  });

  describe("table and file filtering", () => {
    it("skips tables not in the specified section", () => {
      const md = `
## Requirements

| ID | Status | Date |
|----|--------|------|
| 1  | Done   |      |

## Notes

| ID | Status | Date |
|----|--------|------|
| 2  | Done   |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
        section: "Requirements",
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
    });

    it("skips files not matching the files pattern", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  | Done   |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
        files: "**/requirements.md",
      });
      const messages = runRules([rule], doc, "docs/overview.md");
      expect(messages).toHaveLength(0);
    });

    it("checks files matching the files pattern", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  | Done   |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
        files: "**/requirements.md",
      });
      const messages = runRules([rule], doc, "docs/requirements.md");
      expect(messages).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("skips table when condition column does not exist", () => {
      const md = `
| ID | Name |
|----|------|
| 1  | foo  |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });

    it("skips table when target column does not exist", () => {
      const md = `
| ID | Status |
|----|--------|
| 1  | Done   |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });

    it("skips rows where condition column is empty", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  |        |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(0);
    });

    it("reports multiple violations across rows", () => {
      const md = `
| ID | Status | Date |
|----|--------|------|
| 1  | Done   |      |
| 2  | Done   |      |
| 3  | WIP    |      |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "Status", equals: "Done" },
        then: { column: "Date", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(2);
    });

    it("works with Japanese column names", () => {
      const md = `
| ID | 状態 | 完了日 |
|----|------|--------|
| 1  | 完了 |        |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "状態", equals: "完了" },
        then: { column: "完了日", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain("状態");
      expect(messages[0].message).toContain("完了日");
    });

    it("works with Korean column names", () => {
      const md = `
| ID | 상태 | 완료일 |
|----|------|--------|
| 1  | 완료 |        |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "상태", equals: "완료" },
        then: { column: "완료일", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain("상태");
      expect(messages[0].message).toContain("완료일");
    });

    it("works with Chinese column names", () => {
      const md = `
| ID | 状态 | 完成日期 |
|----|------|----------|
| 1  | 完成 |          |
`;
      const doc = parseDocument(md);
      const rule = tbl005({
        when: { column: "状态", equals: "完成" },
        then: { column: "完成日期", notEmpty: true },
      });
      const messages = runRules([rule], doc, "test.md");
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain("状态");
      expect(messages[0].message).toContain("完成日期");
    });
  });
});
