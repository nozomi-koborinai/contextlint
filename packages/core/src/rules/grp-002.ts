import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { globMatch } from "../utils/glob-match.js";
import {
  siteRouterSchema,
  resolveRoutedUrl,
} from "../utils/site-router.js";
import type { SiteRouterOptions } from "../utils/site-router.js";
import * as z from "zod/v4";
import type { Rule, RuleContext } from "../rule.js";
import type { ParsedDocument } from "../parser.js";

export const grp002Schema = z.object({
  files: z.string().optional(),
  exclude: z.array(z.string()).optional(),
  siteRouter: siteRouterSchema.optional(),
}).strict().optional();

export type Grp002Options = z.infer<typeof grp002Schema>;

/**
 * Resolve a Markdown link to a file path within the documents map.
 * Returns null if the link cannot be resolved or doesn't end in .md.
 *
 * Handles two cases:
 * - Relative links (e.g. `./other.md`) — resolved against the source file
 * - Absolute SSG-routed URLs (e.g. `/docs/x/`) — resolved via siteRouter
 *   when configured, returning the first candidate that exists in the
 *   documents map or on disk.
 */
function resolveLink(
  linkUrl: string,
  fromFile: string,
  documents: Map<string, ParsedDocument>,
  siteRouter: SiteRouterOptions | undefined,
): string | null {
  const hashIndex = linkUrl.indexOf("#");
  const filePart = hashIndex === -1 ? linkUrl : linkUrl.slice(0, hashIndex);

  if (!filePart) {
    return null;
  }

  if (filePart.startsWith("/") && siteRouter) {
    const candidates = resolveRoutedUrl(filePart, siteRouter);
    for (const candidate of candidates) {
      const resolved = resolve(candidate);
      if (documents.has(resolved) || existsSync(resolved)) {
        return resolved;
      }
    }
    return null;
  }

  if (!filePart.endsWith(".md")) {
    return null;
  }

  return resolve(dirname(fromFile), filePart);
}

const enum Color {
  White = 0,
  Gray = 1,
  Black = 2,
}

function buildAdjacencyList(
  documents: Map<string, ParsedDocument>,
  isFileMatch: ((path: string) => boolean) | null,
  isExclude: ((path: string) => boolean) | null,
  siteRouter: SiteRouterOptions | undefined,
): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const [filePath, doc] of documents) {
    if (isFileMatch && !isFileMatch(filePath)) {
      continue;
    }
    if (isExclude && isExclude(filePath)) {
      continue;
    }

    const neighbors: string[] = [];
    for (const link of doc.links) {
      const target = resolveLink(link.url, filePath, documents, siteRouter);
      if (!target) {
        continue;
      }
      if (!documents.has(target)) {
        continue;
      }
      if (isExclude && isExclude(target)) {
        continue;
      }
      if (isFileMatch && !isFileMatch(target)) {
        continue;
      }
      neighbors.push(target);
    }

    adj.set(filePath, neighbors);
  }

  return adj;
}

interface CycleInfo {
  /** Ordered list of file paths forming the cycle (first === last) */
  path: string[];
}

function detectCycles(adj: Map<string, string[]>): CycleInfo[] {
  const color = new Map<string, Color>();
  const parent = new Map<string, string | null>();

  for (const node of adj.keys()) {
    color.set(node, Color.White);
  }

  const cycles: CycleInfo[] = [];
  const reportedCycleKeys = new Set<string>();

  function dfs(node: string, ancestors: string[]): void {
    color.set(node, Color.Gray);

    const neighbors = adj.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const neighborColor = color.get(neighbor);

        if (neighborColor === Color.Gray) {
          const cycleStart = ancestors.indexOf(neighbor);
          if (cycleStart !== -1) {
            const cyclePath = [...ancestors.slice(cycleStart), neighbor];
            const canonicalKey = canonicalizeCycle(cyclePath);
            if (!reportedCycleKeys.has(canonicalKey)) {
              reportedCycleKeys.add(canonicalKey);
              cycles.push({ path: cyclePath });
            }
          }
        } else if (neighborColor === Color.White || neighborColor === undefined) {
          parent.set(neighbor, node);
          dfs(neighbor, [...ancestors, neighbor]);
        }
      }
    }

    color.set(node, Color.Black);
  }

  for (const node of adj.keys()) {
    const nodeColor = color.get(node);
    if (nodeColor === Color.White) {
      parent.set(node, null);
      dfs(node, [node]);
    }
  }

  return cycles;
}

function canonicalizeCycle(cyclePath: string[]): string {
  const ring = cyclePath.slice(0, -1);
  if (ring.length === 0) return "";

  let minIndex = 0;
  for (let i = 1; i < ring.length; i++) {
    const el = ring[i];
    const minEl = ring[minIndex];
    if (el !== undefined && minEl !== undefined && el < minEl) {
      minIndex = i;
    }
  }

  const rotated = [...ring.slice(minIndex), ...ring.slice(0, minIndex)];
  return rotated.join(" -> ");
}

function formatCyclePath(cyclePath: string[]): string {
  return cyclePath.join(" -> ");
}

function findLinkLine(
  doc: ParsedDocument,
  fromFile: string,
  toFile: string,
  documents: Map<string, ParsedDocument>,
  siteRouter: SiteRouterOptions | undefined,
): number {
  for (const link of doc.links) {
    const target = resolveLink(link.url, fromFile, documents, siteRouter);
    if (target === toFile) {
      return link.line;
    }
  }
  return 1;
}

export function grp002(options?: Grp002Options): Rule {
  const isFileMatch = options?.files ? globMatch(`**/${options.files}`) : null;
  const excludeMatchers = options?.exclude
    ? options.exclude.map((p) => globMatch(`**/${p}`))
    : null;
  const isExclude = excludeMatchers
    ? (path: string) => excludeMatchers.some((m) => m(path))
    : null;
  const siteRouter = options?.siteRouter;

  return {
    id: "GRP-002",
    description:
      "Document reference graph must be acyclic (no circular references)",
    severity: "error",
    scope: "project",
    check: (context: RuleContext) => {
      if (!context.documents) {
        return;
      }

      const adj = buildAdjacencyList(
        context.documents,
        isFileMatch,
        isExclude,
        siteRouter,
      );
      const cycles = detectCycles(adj);

      for (const cycle of cycles) {
        const cyclePath = cycle.path;
        const firstFile = cyclePath[0];
        const secondFile = cyclePath[1];

        if (!firstFile || !secondFile) {
          continue;
        }

        const doc = context.documents.get(firstFile);
        if (!doc) {
          continue;
        }

        const line = findLinkLine(
          doc,
          firstFile,
          secondFile,
          context.documents,
          siteRouter,
        );
        const message = `Circular reference detected: ${formatCyclePath(cyclePath)}`;

        context.report({
          severity: "error",
          message,
          line,
          filePath: firstFile,
        });
      }
    },
  };
}
