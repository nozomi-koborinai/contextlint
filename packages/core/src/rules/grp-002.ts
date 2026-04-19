import { resolve, dirname } from "node:path";
import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule, RuleContext } from "../rule.js";
import type { ParsedDocument } from "../parser.js";

export const grp002Schema = z.object({
  files: z.string().optional(),
  exclude: z.array(z.string()).optional(),
}).strict().optional();

export type Grp002Options = z.infer<typeof grp002Schema>;

/**
 * Resolve a relative link URL to an absolute file path,
 * stripping any anchor fragment.
 */
function resolveLink(linkUrl: string, fromFile: string): string | null {
  // Strip anchor fragment
  const hashIndex = linkUrl.indexOf("#");
  const filePart = hashIndex === -1 ? linkUrl : linkUrl.slice(0, hashIndex);

  // Skip empty file parts (anchor-only links like #section)
  if (!filePart) {
    return null;
  }

  // Only consider .md files
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

/**
 * Build an adjacency list from the documents map.
 * Keys are absolute file paths; values are arrays of absolute paths that the file links to.
 */
function buildAdjacencyList(
  documents: Map<string, ParsedDocument>,
  isFileMatch: ((path: string) => boolean) | null,
  isExclude: ((path: string) => boolean) | null,
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
      const target = resolveLink(link.url, filePath);
      if (!target) {
        continue;
      }
      // Only include edges to files that are in the documents set
      // and not excluded
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

/**
 * Detect all cycles in a directed graph using DFS with 3-color marking.
 * Returns unique cycles (canonicalized to avoid duplicates).
 */
function detectCycles(adj: Map<string, string[]>): CycleInfo[] {
  const color = new Map<string, Color>();
  const parent = new Map<string, string | null>();

  // Initialize all nodes as white
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
          // Back edge found — extract cycle
          const cycleStart = ancestors.indexOf(neighbor);
          if (cycleStart !== -1) {
            const cyclePath = [...ancestors.slice(cycleStart), neighbor];
            // Canonicalize: rotate so smallest path is first, to deduplicate
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
        // Black nodes are already fully explored — skip
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

/**
 * Canonicalize a cycle path for deduplication.
 * Rotates the cycle (excluding the last element which equals the first)
 * so that the lexicographically smallest element comes first.
 */
function canonicalizeCycle(cyclePath: string[]): string {
  // cyclePath: [A, B, C, A] — last element duplicates first
  const ring = cyclePath.slice(0, -1);
  if (ring.length === 0) return "";

  // Find the smallest element's index
  let minIndex = 0;
  for (let i = 1; i < ring.length; i++) {
    const el = ring[i];
    const minEl = ring[minIndex];
    if (el !== undefined && minEl !== undefined && el < minEl) {
      minIndex = i;
    }
  }

  // Rotate
  const rotated = [...ring.slice(minIndex), ...ring.slice(0, minIndex)];
  return rotated.join(" -> ");
}

/**
 * Format a cycle path for display, using relative-style short names.
 */
function formatCyclePath(cyclePath: string[]): string {
  return cyclePath.join(" -> ");
}

/**
 * Find the first link line in a file that points to a given target.
 */
function findLinkLine(
  doc: ParsedDocument,
  fromFile: string,
  toFile: string,
): number {
  for (const link of doc.links) {
    const target = resolveLink(link.url, fromFile);
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

      // Only run cycle detection once — from the first file in the documents map
      const firstKey = context.documents.keys().next();
      if (firstKey.done || firstKey.value !== context.filePath) {
        return;
      }

      const adj = buildAdjacencyList(context.documents, isFileMatch, isExclude);
      const cycles = detectCycles(adj);

      for (const cycle of cycles) {
        const cyclePath = cycle.path;
        const firstFile = cyclePath[0];
        const secondFile = cyclePath[1];

        if (!firstFile || !secondFile) {
          continue;
        }

        // Report the error on the first file's link that creates the cycle
        const doc = context.documents.get(firstFile);
        if (!doc) {
          continue;
        }

        const line = findLinkLine(doc, firstFile, secondFile);
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
