import { resolve, dirname } from "node:path";
import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Ref006Options {
  exclude?: string[];
}

export function ref006(options?: Ref006Options): Rule {
  const excludeMatchers =
    options?.exclude?.map((p) => picomatch(`**/${p}`)) ?? [];

  return {
    id: "REF-006",
    description: "Image references must point to files that exist",
    severity: "error",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      const allPaths = new Set(context.documents.keys());

      for (const image of context.document.images) {
        const urlWithoutAnchor = image.url.split("#")[0];
        if (!urlWithoutAnchor) {
          continue;
        }

        const stripped = urlWithoutAnchor.replace(/^(\.\.?\/)+/, "");
        if (excludeMatchers.some((m) => m(stripped))) {
          continue;
        }

        const resolved = resolve(dirname(context.filePath), urlWithoutAnchor);

        if (!allPaths.has(resolved)) {
          context.report({
            severity: "error",
            message: `Image target "${image.url}" does not exist`,
            line: image.line,
          });
        }
      }
    },
  };
}
