import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

const siteRouterSchema = z.object({
  preset: z.enum(["starlight"]).optional(),
  contentDir: z.string(),
  defaultLocale: z.string().optional(),
  locales: z.array(z.string()).optional(),
  urlPrefix: z.string().optional(),
  indexFile: z.string().optional(),
}).strict();

type SiteRouterOptions = z.infer<typeof siteRouterSchema>;

export const ref001Schema = z.object({
  exclude: z.array(z.string()).optional(),
  siteRouter: siteRouterSchema.optional(),
}).strict().optional();

export type Ref001Options = z.infer<typeof ref001Schema>;

function resolveStarlightUrl(url: string, router: SiteRouterOptions): string[] {
  const contentDir = router.contentDir;
  const locales = router.locales ?? [];
  const defaultLocale = router.defaultLocale ?? "root";
  const indexFile = router.indexFile ?? "index.md";

  const trimmed = url.replace(/\/$/, "").replace(/^\//, "");
  const parts = trimmed.split("/").filter(Boolean);

  let localeFolder = "";
  let restParts = parts;

  const firstPart = parts[0];
  if (
    firstPart &&
    locales.includes(firstPart) &&
    firstPart !== defaultLocale &&
    firstPart !== "root"
  ) {
    localeFolder = firstPart;
    restParts = parts.slice(1);
  }

  const basePath = [contentDir, localeFolder, ...restParts]
    .filter((s): s is string => Boolean(s))
    .join("/");

  return [`${basePath}/${indexFile}`, `${basePath}.md`];
}

function resolveGenericUrl(url: string, router: SiteRouterOptions): string[] {
  const contentDir = router.contentDir;
  const indexFile = router.indexFile ?? "index.md";
  const urlPrefix = router.urlPrefix ?? "";

  let path = url;
  if (urlPrefix && path.startsWith(urlPrefix)) {
    path = path.slice(urlPrefix.length);
  }

  const trimmed = path.replace(/\/$/, "").replace(/^\//, "");
  const basePath = [contentDir, trimmed]
    .filter((s): s is string => Boolean(s))
    .join("/");

  return [`${basePath}/${indexFile}`, `${basePath}.md`];
}

function resolveRoutedUrl(url: string, router: SiteRouterOptions): string[] {
  if (router.preset === "starlight") {
    return resolveStarlightUrl(url, router);
  }
  return resolveGenericUrl(url, router);
}

export function ref001(options?: Ref001Options): Rule {
  const excludeMatchers = options?.exclude?.map((p) => globMatch(`**/${p}`)) ?? [];
  const siteRouter = options?.siteRouter;

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
        const urlWithoutAnchor = link.url.split("#")[0];
        if (!urlWithoutAnchor) {
          continue;
        }

        const stripped = urlWithoutAnchor.replace(/^(\.\.?\/)+/, "");
        if (excludeMatchers.some((m) => m(stripped))) {
          continue;
        }

        // siteRouter resolution for absolute URLs (e.g. /docs/x/, /ja/docs/x/)
        if (urlWithoutAnchor.startsWith("/") && siteRouter) {
          const candidates = resolveRoutedUrl(urlWithoutAnchor, siteRouter);
          const found = candidates.some((p) => {
            const resolved = resolve(p);
            return allPaths.has(resolved) || existsSync(resolved);
          });

          if (!found) {
            context.report({
              severity: "error",
              message: `Link target "${link.url}" does not exist`,
              line: link.line,
            });
          }
          continue;
        }

        const resolvedPath = resolve(dirname(context.filePath), urlWithoutAnchor);

        if (!allPaths.has(resolvedPath) && !existsSync(resolvedPath)) {
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
