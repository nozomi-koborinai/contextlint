import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { regexString } from "../utils/regex-string.js";

const chainStageSchema = z.object({
  stage: z.string(),
  files: z.string(),
  idColumn: z.string().optional(),
  refColumn: z.string().optional(),
});

export const grp001Schema = z.object({
  chain: z.array(chainStageSchema).min(2),
  idPattern: regexString.optional(),
}).strict();

export type Grp001Options = z.infer<typeof grp001Schema>;

export function grp001(options: Grp001Options): Rule {
  const matchers = options.chain.map((s) => globMatch(`**/${s.files}`));
  const idRegex = options.idPattern ? new RegExp(options.idPattern) : null;

  return {
    id: "GRP-001",
    description:
      "Every ID must be traceable through all specified stages of the document chain",
    severity: "warning",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Walk each stage transition: N -> N+1
      for (let i = 0; i < options.chain.length - 1; i++) {
        const currentStage = options.chain[i];
        const nextStage = options.chain[i + 1];

        if (!currentStage || !nextStage) {
          continue;
        }

        const currentMatcher = matchers[i];
        const nextMatcher = matchers[i + 1];

        if (!currentMatcher || !nextMatcher) {
          continue;
        }

        // Determine which column to read IDs from in the current stage
        // First stage uses idColumn; subsequent stages use refColumn
        const currentColumn = i === 0 ? currentStage.idColumn : currentStage.refColumn;
        const nextColumn = nextStage.refColumn;

        if (!currentColumn || !nextColumn) {
          continue;
        }

        // Collect IDs from the current stage
        const currentIds = new Map<string, { filePath: string; line: number }>();
        for (const [filePath, doc] of context.documents) {
          if (!currentMatcher(filePath)) {
            continue;
          }
          for (const table of doc.tables) {
            if (!table.headers.includes(currentColumn)) {
              continue;
            }
            for (const row of table.rows) {
              const value = row.cells[currentColumn];
              if (!value) {
                continue;
              }
              if (idRegex && !idRegex.test(value)) {
                continue;
              }
              currentIds.set(value, { filePath, line: row.line });
            }
          }
        }

        // Collect references from the next stage
        const nextRefs = new Set<string>();
        for (const [filePath, doc] of context.documents) {
          if (!nextMatcher(filePath)) {
            continue;
          }
          for (const table of doc.tables) {
            if (!table.headers.includes(nextColumn)) {
              continue;
            }
            for (const row of table.rows) {
              const value = row.cells[nextColumn];
              if (!value) {
                continue;
              }
              if (idRegex && !idRegex.test(value)) {
                continue;
              }
              nextRefs.add(value);
            }
          }
        }

        // Report IDs present in current stage but missing in next stage
        for (const [id, location] of currentIds) {
          if (!nextRefs.has(id)) {
            const stageLabel = i === 0 ? "defined" : "traced";
            const stageSource = i === 0
              ? `${stageLabel} in ${location.filePath}`
              : `${stageLabel} to "${currentStage.stage}"`;
            context.report({
              severity: "warning",
              message: `${id} ${stageSource} but not referenced in stage "${nextStage.stage}"`,
              line: location.line,
              filePath: location.filePath,
            });
          }
        }
      }
    },
  };
}
