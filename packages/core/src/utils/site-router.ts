import * as z from "zod/v4";

export const siteRouterSchema = z.object({
  preset: z.enum(["starlight"]).optional(),
  contentDir: z.string(),
  defaultLocale: z.string().optional(),
  locales: z.array(z.string()).optional(),
  urlPrefix: z.string().optional(),
  indexFile: z.string().optional(),
}).strict();

export type SiteRouterOptions = z.infer<typeof siteRouterSchema>;

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

/**
 * Resolve a routed URL (e.g. `/docs/x/`, `/ja/docs/x/`) to candidate
 * file paths that should be checked. Returns up to 2 candidates:
 * `<basePath>/<indexFile>` and `<basePath>.md`.
 *
 * Used by cross-file rules (REF-001, GRP-002, GRP-003) to resolve
 * absolute URLs emitted by SSGs like Starlight, Docusaurus, etc.
 * Without a siteRouter, such URLs cannot be validated against the
 * source content tree.
 */
export function resolveRoutedUrl(url: string, router: SiteRouterOptions): string[] {
  if (router.preset === "starlight") {
    return resolveStarlightUrl(url, router);
  }
  return resolveGenericUrl(url, router);
}
