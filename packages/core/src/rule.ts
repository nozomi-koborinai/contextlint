import type { ParsedDocument } from "./parser.js";

export type Severity = "error" | "warning";

export interface LintMessage {
  ruleId: string;
  severity: Severity;
  message: string;
  line: number;
}

export interface RuleContext {
  document: ParsedDocument;
  filePath: string;
  projectFiles?: string[];
  report: (msg: Omit<LintMessage, "ruleId">) => void;
}

export interface Rule {
  id: string;
  description: string;
  severity: Severity;
  scope?: "document" | "project";
  check: (context: RuleContext) => void;
}

export interface RunOptions {
  projectFiles?: string[];
}

export function runRules(
  rules: Rule[],
  document: ParsedDocument,
  filePath: string,
  options?: RunOptions,
): LintMessage[] {
  const messages: LintMessage[] = [];

  for (const rule of rules) {
    const context: RuleContext = {
      document,
      filePath,
      projectFiles: options?.projectFiles,
      report: (msg) => {
        messages.push({ ruleId: rule.id, ...msg });
      },
    };
    rule.check(context);
  }

  return messages;
}
