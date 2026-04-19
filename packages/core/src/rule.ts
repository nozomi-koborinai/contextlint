import type { ParsedDocument } from "./parser.js";

export type Severity = "error" | "warning";

export interface LintMessage {
  ruleId: string;
  severity: Severity;
  message: string;
  line: number;
  /**
   * Optional file attribution. When set, `lintFiles` groups the message
   * under this file instead of the rule's `context.filePath`. Use this in
   * project-scope rules to attach violations to the actual offending
   * file rather than the virtual `<project>` bucket.
   */
  filePath?: string;
}

export interface RuleContext {
  document: ParsedDocument;
  filePath: string;
  projectFiles?: string[];
  documents?: Map<string, ParsedDocument>;
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
  documents?: Map<string, ParsedDocument>;
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
      documents: options?.documents,
      report: (msg) => {
        messages.push({ ruleId: rule.id, ...msg });
      },
    };
    rule.check(context);
  }

  return messages;
}
