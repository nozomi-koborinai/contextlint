import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Ref002Options {
  definitions: string;
  references: string[];
  idColumn: string;
  idPattern: string;
}

export function ref002(options: Ref002Options): Rule {
  const isDefinition = picomatch(`**/${options.definitions}`);
  const isReference = options.references.map((p) => picomatch(`**/${p}`));
  const idRegex = new RegExp(options.idPattern);

  function matchesReference(filePath: string): boolean {
    return isReference.some((matcher) => matcher(filePath));
  }

  return {
    id: "REF-002",
    description:
      "Validate that requirement IDs defined in definition files are referenced, and that IDs referenced elsewhere exist in definition files",
    severity: "error",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Collect defined IDs: id -> { filePath, line }
      const defined = new Map<string, { filePath: string; line: number }>();
      for (const [filePath, doc] of context.documents) {
        if (!isDefinition(filePath)) {
          continue;
        }
        for (const table of doc.tables) {
          if (!table.headers.includes(options.idColumn)) {
            continue;
          }
          for (const row of table.rows) {
            const value = row[options.idColumn];
            if (value && idRegex.test(value)) {
              defined.set(value, { filePath, line: table.line });
            }
          }
        }
      }

      // Collect referenced IDs from table columns and prose text
      const referenced = new Set<string>();
      for (const [filePath, doc] of context.documents) {
        if (!matchesReference(filePath)) {
          continue;
        }

        // From table columns
        for (const table of doc.tables) {
          for (const row of table.rows) {
            for (const value of Object.values(row)) {
              if (value && idRegex.test(value)) {
                referenced.add(value);
              }
            }
          }
        }

        // From prose text (split into tokens, strip punctuation, check pattern)
        const tokens = doc.content.match(/\S+/g) ?? [];
        for (const token of tokens) {
          const cleaned = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
          if (cleaned && idRegex.test(cleaned)) {
            referenced.add(cleaned);
          }
        }
      }

      // Report dangling references (referenced but not defined)
      for (const id of referenced) {
        if (!defined.has(id)) {
          context.report({
            severity: "error",
            message: `ID "${id}" is referenced but not defined in any definition file`,
            line: 0,
          });
        }
      }

      // Report orphan definitions (defined but not referenced)
      for (const [id, location] of defined) {
        if (!referenced.has(id)) {
          context.report({
            severity: "warning",
            message: `ID "${id}" is defined in ${location.filePath}:${String(location.line)} but never referenced`,
            line: 0,
          });
        }
      }
    },
  };
}
