import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import { chk001 } from "./chk-001.js";
import type { Chk001Options } from "./chk-001.js";

function lint(content: string, options?: Chk001Options, filePath = "/project/docs/review.md") {
  const doc = parseDocument(content);
  const rule = chk001(options);
  return runRules([rule], doc, filePath);
}

describe("CHK-001", () => {
  // --- Basic checklist validation ---

  it("passes when all items are checked", () => {
    const md = [
      "## Review Checklist",
      "- [x] Code review completed",
      "- [x] Tests passing",
    ].join("\n");
    expect(lint(md)).toEqual([]);
  });

  it("reports unchecked items", () => {
    const md = [
      "## Review Checklist",
      "- [x] Code review completed",
      "- [ ] Security review completed",
      "- [x] Tests passing",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("CHK-001");
    expect(messages[0].severity).toBe("warning");
    expect(messages[0].message).toContain("Security review completed");
    expect(messages[0].message).toContain("Review Checklist");
  });

  it("reports multiple unchecked items", () => {
    const md = [
      "- [ ] Item A",
      "- [ ] Item B",
      "- [x] Item C",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(2);
  });

  // --- Non-checklist items are ignored ---

  it("ignores regular list items", () => {
    const md = [
      "- Regular item",
      "- Another regular item",
    ].join("\n");
    expect(lint(md)).toEqual([]);
  });

  // --- section option ---

  it("only checks items under the specified section", () => {
    const md = [
      "## Review Checklist",
      "- [ ] Unchecked review item",
      "",
      "## Notes",
      "- [ ] Unchecked note item",
    ].join("\n");
    const messages = lint(md, { section: "Review Checklist" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Unchecked review item");
  });

  it("passes when specified section has all items checked", () => {
    const md = [
      "## Review Checklist",
      "- [x] All done",
      "",
      "## Notes",
      "- [ ] Not done but different section",
    ].join("\n");
    const messages = lint(md, { section: "Review Checklist" });
    expect(messages).toEqual([]);
  });

  it("does nothing when specified section does not exist", () => {
    const md = [
      "## Other",
      "- [ ] Unchecked item",
    ].join("\n");
    const messages = lint(md, { section: "Review Checklist" });
    expect(messages).toEqual([]);
  });

  // --- files option ---

  it("skips files not matching the files option", () => {
    const md = "- [ ] Unchecked";
    const messages = lint(md, { files: "docs/reviews/**/*.md" }, "/project/src/notes.md");
    expect(messages).toEqual([]);
  });

  it("checks files matching the files option", () => {
    const md = "- [ ] Unchecked";
    const messages = lint(md, { files: "**/docs/**/*.md" });
    expect(messages).toHaveLength(1);
  });

  // --- Edge cases ---

  it("passes with empty document", () => {
    expect(lint("")).toEqual([]);
  });

  it("passes with no checklist items", () => {
    const md = "## Review\n\nSome text without checklists.";
    expect(lint(md)).toEqual([]);
  });

  it("includes line number in report", () => {
    const md = "- [x] Done\n- [ ] Not done";
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(2);
  });

  it("handles checklist items without a section", () => {
    const md = "- [ ] Orphan item";
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Unchecked item "Orphan item"');
  });

  // --- CJK content ---

  it("reports unchecked Japanese checklist items", () => {
    const md = [
      "## レビューチェックリスト",
      "- [x] コードレビュー完了",
      "- [ ] セキュリティレビュー完了",
      "- [x] テスト合格",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("セキュリティレビュー完了");
    expect(messages[0].message).toContain("レビューチェックリスト");
  });

  it("scopes to Japanese section name", () => {
    const md = [
      "## レビュー",
      "- [ ] 未完了項目",
      "",
      "## メモ",
      "- [ ] メモ項目",
    ].join("\n");
    const messages = lint(md, { section: "レビュー" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("未完了項目");
  });

  it("reports unchecked Korean checklist items", () => {
    const md = [
      "## 검토 체크리스트",
      "- [x] 코드 리뷰 완료",
      "- [ ] 보안 리뷰 완료",
      "- [x] 테스트 통과",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("보안 리뷰 완료");
    expect(messages[0].message).toContain("검토 체크리스트");
  });

  it("scopes to Korean section name", () => {
    const md = [
      "## 검토",
      "- [ ] 미완료 항목",
      "",
      "## 메모",
      "- [ ] 메모 항목",
    ].join("\n");
    const messages = lint(md, { section: "검토" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("미완료 항목");
  });

  it("reports unchecked Chinese checklist items", () => {
    const md = [
      "## 审查清单",
      "- [x] 代码审查完成",
      "- [ ] 安全审查完成",
      "- [x] 测试通过",
    ].join("\n");
    const messages = lint(md);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("安全审查完成");
    expect(messages[0].message).toContain("审查清单");
  });

  it("scopes to Chinese section name", () => {
    const md = [
      "## 审查",
      "- [ ] 未完成项目",
      "",
      "## 笔记",
      "- [ ] 笔记项目",
    ].join("\n");
    const messages = lint(md, { section: "审查" });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("未完成项目");
  });
});
