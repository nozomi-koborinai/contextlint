import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Ref003Options {
  stabilityColumn: string;
  stabilityOrder: string[];
  definitions: string;
  references: string[];
  idColumn?: string;
  idPattern?: string;
}

export function ref003(options: Ref003Options): Rule {
  const isDefinition = picomatch(`**/${options.definitions}`);
  const isReference = options.references.map((p) => picomatch(`**/${p}`));
  const idColumn = options.idColumn ?? "ID";
  const idRegex = options.idPattern ? new RegExp(options.idPattern) : null;

  const stabilityRank = new Map<string, number>();
  for (let i = 0; i < options.stabilityOrder.length; i++) {
    stabilityRank.set(options.stabilityOrder[i], i);
  }

  function matchesReference(filePath: string): boolean {
    return isReference.some((matcher) => matcher(filePath));
  }

  return {
    id: "REF-003",
    description:
      "A document item's stability should not exceed the stability of items it depends on",
    severity: "warning",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Collect defined IDs with their stability: id -> { stability, filePath }
      const definitions = new Map<
        string,
        { stability: string; filePath: string }
      >();

      for (const [filePath, doc] of context.documents) {
        if (!isDefinition(filePath)) {
          continue;
        }
        for (const table of doc.tables) {
          if (
            !table.headers.includes(idColumn) ||
            !table.headers.includes(options.stabilityColumn)
          ) {
            continue;
          }
          for (const row of table.rows) {
            const id = row[idColumn];
            const stability = row[options.stabilityColumn];
            if (!id || !stability) {
              continue;
            }
            if (idRegex && !idRegex.test(id)) {
              continue;
            }
            definitions.set(id, { stability, filePath });
          }
        }
      }

      // Check reference files for stability mismatches
      for (const [filePath, doc] of context.documents) {
        if (!matchesReference(filePath)) {
          continue;
        }
        for (const table of doc.tables) {
          if (!table.headers.includes(options.stabilityColumn)) {
            continue;
          }
          for (const row of table.rows) {
            const refStability = row[options.stabilityColumn];
            if (!refStability || !stabilityRank.has(refStability)) {
              continue;
            }
            const refRank = stabilityRank.get(refStability)!;

            // Find referenced IDs in other cells of this row
            for (const [col, value] of Object.entries(row)) {
              if (col === options.stabilityColumn || !value) {
                continue;
              }
              const def = definitions.get(value);
              if (!def || !stabilityRank.has(def.stability)) {
                continue;
              }
              const defRank = stabilityRank.get(def.stability)!;

              if (refRank > defRank) {
                context.report({
                  severity: "warning",
                  message: `Item "${value}" has stability "${def.stability}" in ${def.filePath}, but is referenced from a row with stability "${refStability}" in ${filePath}`,
                  line: table.line,
                });
              }
            }
          }
        }
      }
    },
  };
}
