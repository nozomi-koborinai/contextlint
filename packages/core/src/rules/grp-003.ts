import { resolve, dirname, basename } from "node:path";
import { globMatch } from "../utils/glob-match.js";
import {
  siteRouterSchema,
  resolveRoutedUrl,
} from "../utils/site-router.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const grp003Schema = z.object({
  files: z.string().optional(),
  entryPoints: z.array(z.string()).optional(),
  siteRouter: siteRouterSchema.optional(),
}).strict().optional();

export type Grp003Options = z.infer<typeof grp003Schema>;

export function grp003(options?: Grp003Options): Rule {
  const isMatch = options?.files
    ? globMatch(`**/${options.files}`)
    : null;

  const entryPointMatchers = options?.entryPoints
    ? options.entryPoints.map((pattern) => globMatch(`**/${pattern}`))
    : [];

  const siteRouter = options?.siteRouter;

  return {
    id: "GRP-003",
    description:
      "Every document in the matched set should have at least one incoming reference",
    severity: "warning",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Build a lookup from resolved (absolute) path to original key.
      const resolvedToOriginal = new Map<string, string>();
      for (const filePath of context.documents.keys()) {
        resolvedToOriginal.set(resolve(filePath), filePath);
      }

      // Collect all file paths that pass the files filter
      const matchedFiles = new Set<string>();
      for (const filePath of context.documents.keys()) {
        if (isMatch && !isMatch(filePath)) {
          continue;
        }
        matchedFiles.add(resolve(filePath));
      }

      if (matchedFiles.size === 0) {
        return;
      }

      // Build incoming reference count for each matched file
      const incomingCount = new Map<string, number>();
      for (const absPath of matchedFiles) {
        incomingCount.set(absPath, 0);
      }

      // Scan all documents for outgoing links
      for (const [sourcePath, doc] of context.documents) {
        for (const link of doc.links) {
          const urlWithoutAnchor = link.url.split("#")[0] ?? "";
          if (urlWithoutAnchor === "") {
            continue;
          }

          let resolvedTarget: string;
          if (urlWithoutAnchor.startsWith("/") && siteRouter) {
            // Try siteRouter candidates; pick the first whose absolute
            // path is in incomingCount (i.e. a matched file).
            const candidates = resolveRoutedUrl(urlWithoutAnchor, siteRouter);
            const found = candidates
              .map((c) => resolve(c))
              .find((r) => incomingCount.has(r));
            if (!found) {
              continue;
            }
            resolvedTarget = found;
          } else {
            resolvedTarget = resolve(dirname(sourcePath), urlWithoutAnchor);
          }

          if (incomingCount.has(resolvedTarget)) {
            const current = incomingCount.get(resolvedTarget);
            if (current !== undefined) {
              incomingCount.set(resolvedTarget, current + 1);
            }
          }
        }
      }

      // Report orphan files (zero incoming references, not entry points)
      for (const [absPath, count] of incomingCount) {
        if (count > 0) {
          continue;
        }

        const originalPath = resolvedToOriginal.get(absPath) ?? absPath;

        const isEntryPoint = entryPointMatchers.some(
          (matcher) => matcher(originalPath) || matcher(basename(originalPath)),
        );
        if (isEntryPoint) {
          continue;
        }

        context.report({
          severity: "warning",
          message: `${originalPath} has no incoming references from any other document`,
          line: 1,
          filePath: originalPath,
        });
      }
    },
  };
}
