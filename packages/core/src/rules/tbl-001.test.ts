import { describe, it, expect } from "vitest";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status | Name |
|----|--------|------|
| 1  | done   | foo  |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports error when a required column is missing", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(2);
    expect(messages[0].ruleId).toBe("TBL-001");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("ID");
    expect(messages[1].message).toContain("Status");
  });

  it("checks each table independently", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |

| Name | Age |
|------|-----|
| Bob  | 25  |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("ID");
  });

  it("skips files not matching the files pattern", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/overview.md");
    expect(messages).toHaveLength(0);
  });

  it("checks files matching the files pattern", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"], files: "**/requirements.md" });
    const messages = runRules([rule], doc, "docs/requirements.md");
    expect(messages).toHaveLength(1);
  });

  it("checks all files when files option is not set", () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"] });
    const messages = runRules([rule], doc, "docs/anything.md");
    expect(messages).toHaveLength(1);
  });

  it("only checks tables in the matching section", () => {
    const md = `
## What (Requirements)

| ID | Requirement | Stability |
|----|-------------|-----------|
| REQ-01 | Something | draft |

## Spec (Specification)

### Stability Model

| Stability | Meaning | Cost of Change |
|-----------|---------|----------------|
| draft | Hypothesis | Low |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Stability"], section: "What" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports errors only for tables in the matching section", () => {
    const md = `
## What (Requirements)

| Requirement | Stability |
|-------------|-----------|
| Something | draft |

## Glossary

| Term | Definition |
|------|------------|
| DNA | Decisions |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"], section: "What" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("ID");
  });

  it("skips all tables when no section matches", () => {
    const md = `
## Glossary

| Term | Definition |
|------|------------|
| DNA | Decisions |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"], section: "What" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("checks all tables when section option is not set", () => {
    const md = `
## What (Requirements)

| ID | Stability |
|----|-----------|
| REQ-01 | draft |

## Glossary

| Term | Definition |
|------|------------|
| DNA | Decisions |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
  });

  it("matches section with text between heading and table", () => {
    const md = `
## What (Requirements)

This section describes the requirements for the project.
Here is some additional explanation.

| ID | Requirement | Stability |
|----|-------------|-----------|
| REQ-01 | Something | draft |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Stability"], section: "What" });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("combines section and files options", () => {
    const md = `
## What (Requirements)

| Requirement | Stability |
|-------------|-----------|
| Something | draft |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID"], section: "What", files: "**/requirements.md" });
    // File matches, section matches -> checks and finds error
    expect(runRules([rule], doc, "docs/requirements.md")).toHaveLength(1);
    // File doesn't match -> skips entirely
    expect(runRules([rule], doc, "docs/overview.md")).toHaveLength(0);
  });

  it("validates required columns with Japanese column names", () => {
    const md = `
| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-01 | ユーザー認証 | draft |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports missing Japanese column names", () => {
    const md = `
| ID | 要件 |
|----|------|
| REQ-01 | ユーザー認証 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("安定度");
  });

  it("validates required columns with Korean column names", () => {
    const md = `
| ID | 요구사항 | 안정성 |
|----|----------|--------|
| REQ-01 | 사용자 인증 | draft |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "안정성"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports missing Korean column names", () => {
    const md = `
| ID | 요구사항 |
|----|----------|
| REQ-01 | 사용자 인증 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "안정성"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("안정성");
  });

  it("validates required columns with Chinese column names", () => {
    const md = `
| ID | 需求 | 稳定性 |
|----|------|--------|
| REQ-01 | 用户认证 | draft |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "稳定性"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });

  it("reports missing Chinese column names", () => {
    const md = `
| ID | 需求 |
|----|------|
| REQ-01 | 用户认证 |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "稳定性"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("稳定性");
  });
});
