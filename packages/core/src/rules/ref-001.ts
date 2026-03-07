import { resolve, dirname } from "node:path";
import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const ref001Schema = z.object({
  exclude: z.array(z.string()).optional(),
}).strict().optional();

export type Ref001Options = z.infer<typeof ref001Schema>;

export function ref001(options?: Ref001Options): Rule {
  const excludeMatchers = options?.exclude?.map((p) => picomatch(`**/${p}`)) ?? [];

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

        // Strip leading ../ or ./ to match against exclude patterns
        const stripped = urlWithoutAnchor.replace(/^(\.\.?\/)+/, "");
        if (excludeMatchers.some((m) => m(stripped))) {
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
