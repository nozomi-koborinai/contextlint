import { resolve, dirname } from "node:path";
import type { Rule } from "../rule.js";

export function ref001(): Rule {
  return {
    id: "REF-001",
    description: "All relative Markdown links must point to files that exist",
    severity: "error",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      const allPaths = new Set(context.documents.keys());

      for (const link of context.document.links) {
        // Strip anchor fragment (e.g. ./file.md#section -> ./file.md)
        const urlWithoutAnchor = link.url.split("#")[0];
        if (!urlWithoutAnchor) {
          continue;
        }

        const resolved = resolve(dirname(context.filePath), urlWithoutAnchor);

        if (!allPaths.has(resolved)) {
          context.report({
            severity: "error",
            message: `Link target "${link.url}" does not exist`,
            line: link.line,
          });
        }
      }
    },
  };
}
