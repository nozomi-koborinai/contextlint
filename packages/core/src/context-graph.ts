import { dirname, resolve, relative } from "node:path";
import type { ParsedDocument } from "./parser.js";

export interface GraphNode {
  filePath: string;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "link" | "image";
  line: number;
}

export interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Build a dependency graph from parsed documents.
 *
 * Document map keys are expected to be relative file paths (consistent
 * with how `lintFiles` produces them) **or** absolute paths. Edges are
 * created only when the resolved target exists in the map.
 */
export function buildContextGraph(
  documents: Map<string, ParsedDocument>,
): ContextGraph {
  const allPaths = new Set(documents.keys());

  // We need to resolve relative link URLs against the source file directory.
  // Since map keys can be either absolute or relative, we normalise once.
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const key of allPaths) {
    inDegree.set(key, 0);
    outDegree.set(key, 0);
  }

  const edges: GraphEdge[] = [];

  for (const [sourcePath, doc] of documents) {
    const sourceDir = dirname(sourcePath);

    const addEdge = (url: string, type: "link" | "image", line: number) => {
      // Strip anchor fragment
      const urlWithoutAnchor = url.split("#")[0];
      if (!urlWithoutAnchor) return;

      const resolved = resolve(sourceDir, urlWithoutAnchor);

      // Check both resolved path and relative form
      let targetKey: string | undefined;
      if (allPaths.has(resolved)) {
        targetKey = resolved;
      } else {
        // Try relative form for each key
        for (const key of allPaths) {
          const keyResolved = resolve(key);
          if (keyResolved === resolved) {
            targetKey = key;
            break;
          }
        }
      }

      if (targetKey === undefined) return;

      // Skip self-references
      const sourceResolved = resolve(sourcePath);
      const targetResolved = resolve(targetKey);
      if (sourceResolved === targetResolved) return;

      edges.push({ source: sourcePath, target: targetKey, type, line });

      const prevOut = outDegree.get(sourcePath);
      if (prevOut !== undefined) {
        outDegree.set(sourcePath, prevOut + 1);
      }

      const prevIn = inDegree.get(targetKey);
      if (prevIn !== undefined) {
        inDegree.set(targetKey, prevIn + 1);
      }
    };

    for (const link of doc.links) {
      addEdge(link.url, "link", link.line);
    }

    for (const image of doc.images) {
      addEdge(image.url, "image", image.line);
    }
  }

  const nodes: GraphNode[] = [];
  for (const filePath of allPaths) {
    nodes.push({
      filePath,
      inDegree: inDegree.get(filePath) ?? 0,
      outDegree: outDegree.get(filePath) ?? 0,
    });
  }

  // Sort for deterministic output
  nodes.sort((a, b) => a.filePath.localeCompare(b.filePath));
  edges.sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target) || a.line - b.line,
  );

  return { nodes, edges };
}

/**
 * Get all files affected by changing a given file (direct + transitive).
 *
 * Follows reverse edges: returns every file that references the changed
 * file, either directly or transitively.
 */
export function getImpactSet(
  graph: ContextGraph,
  filePath: string,
): string[] {
  // Build reverse adjacency list (target -> sources)
  const reverseAdj = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const sources = reverseAdj.get(edge.target);
    if (sources) {
      sources.push(edge.source);
    } else {
      reverseAdj.set(edge.target, [edge.source]);
    }
  }

  const visited = new Set<string>();
  const queue: string[] = [filePath];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    if (visited.has(current)) continue;
    visited.add(current);

    const sources = reverseAdj.get(current);
    if (sources) {
      for (const source of sources) {
        if (!visited.has(source)) {
          queue.push(source);
        }
      }
    }
  }

  // Remove the starting file itself
  visited.delete(filePath);

  const result = [...visited];
  result.sort();
  return result;
}

/**
 * Get the minimal set of files relevant to a query (ID or file path).
 *
 * - If query is a file path that exists in the graph: follows outgoing
 *   edges up to `maxDepth` (default 2).
 * - If query looks like an ID (matches common ID patterns): searches
 *   all documents for the ID in table cells and expands from matching
 *   files.
 */
export function getContextSlice(
  graph: ContextGraph,
  documents: Map<string, ParsedDocument>,
  query: string,
  maxDepth = 2,
): string[] {
  const nodeSet = new Set(graph.nodes.map((n) => n.filePath));

  // Build forward adjacency list
  const forwardAdj = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const targets = forwardAdj.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    } else {
      forwardAdj.set(edge.source, [edge.target]);
    }
  }

  const startFiles: string[] = [];

  if (nodeSet.has(query)) {
    // Query is a file path in the graph
    startFiles.push(query);
  } else {
    // Query might be an ID — search all documents for it in table cells
    for (const [filePath, doc] of documents) {
      let found = false;
      for (const table of doc.tables) {
        for (const row of table.rows) {
          for (const value of Object.values(row)) {
            if (value === query) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (found) {
        startFiles.push(filePath);
      }
    }
  }

  if (startFiles.length === 0) return [];

  // BFS from start files up to maxDepth
  const visited = new Set<string>();
  let currentLevel = new Set(startFiles);

  for (const f of startFiles) {
    visited.add(f);
  }

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextLevel = new Set<string>();
    for (const file of currentLevel) {
      const targets = forwardAdj.get(file);
      if (targets) {
        for (const target of targets) {
          if (!visited.has(target)) {
            visited.add(target);
            nextLevel.add(target);
          }
        }
      }
    }
    if (nextLevel.size === 0) break;
    currentLevel = nextLevel;
  }

  const result = [...visited];
  result.sort();
  return result;
}

/**
 * Topological sort of the document graph using Kahn's algorithm.
 *
 * Returns file paths in dependency order (files with no dependencies
 * come first). If the graph contains cycles, the returned array will
 * be shorter than the total number of nodes — the omitted nodes form
 * at least one cycle.
 */
export function topologicalSort(graph: ContextGraph): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node.filePath, 0);
    adj.set(node.filePath, []);
  }

  for (const edge of graph.edges) {
    const targets = adj.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    }
    const prev = inDegree.get(edge.target);
    if (prev !== undefined) {
      inDegree.set(edge.target, prev + 1);
    }
  }

  // Collect nodes with in-degree 0
  const queue: string[] = [];
  for (const [filePath, degree] of inDegree) {
    if (degree === 0) {
      queue.push(filePath);
    }
  }
  // Sort for deterministic output
  queue.sort();

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    result.push(current);

    const targets = adj.get(current);
    if (targets) {
      for (const target of targets) {
        const prev = inDegree.get(target);
        if (prev !== undefined) {
          const newDegree = prev - 1;
          inDegree.set(target, newDegree);
          if (newDegree === 0) {
            // Insert in sorted position for deterministic output
            const idx = queue.findIndex((q) => q.localeCompare(target) > 0);
            if (idx === -1) {
              queue.push(target);
            } else {
              queue.splice(idx, 0, target);
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Get connected components of the graph (undirected).
 *
 * Uses BFS on the undirected version of the graph. Returns groups of
 * connected file paths, each group sorted alphabetically, and groups
 * sorted by their first element.
 */
export function getComponents(graph: ContextGraph): string[][] {
  // Build undirected adjacency list
  const adj = new Map<string, Set<string>>();

  for (const node of graph.nodes) {
    adj.set(node.filePath, new Set());
  }

  for (const edge of graph.edges) {
    const sourceNeighbors = adj.get(edge.source);
    if (sourceNeighbors) {
      sourceNeighbors.add(edge.target);
    }
    const targetNeighbors = adj.get(edge.target);
    if (targetNeighbors) {
      targetNeighbors.add(edge.source);
    }
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of graph.nodes) {
    if (visited.has(node.filePath)) continue;

    const component: string[] = [];
    const queue: string[] = [node.filePath];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) break;
      if (visited.has(current)) continue;
      visited.add(current);
      component.push(current);

      const neighbors = adj.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    component.sort();
    components.push(component);
  }

  // Sort components by their first element
  components.sort((a, b) => {
    const aFirst = a[0];
    const bFirst = b[0];
    if (aFirst === undefined || bFirst === undefined) return 0;
    return aFirst.localeCompare(bFirst);
  });

  return components;
}

/**
 * Format a human-readable summary of the context graph.
 *
 * Shows entry points (no incoming refs) and most connected nodes
 * (by incoming ref count). Used by the MCP context-graph tool.
 */
export function formatContextGraphSummary(graph: ContextGraph): string {
  const { nodes, edges } = graph;
  const lines: string[] = [];

  lines.push(`Document Graph: ${String(nodes.length)} files, ${String(edges.length)} edges`);

  // Entry points: nodes with no incoming refs
  const entryPoints = nodes.filter((n) => n.inDegree === 0);
  if (entryPoints.length > 0) {
    lines.push("");
    lines.push("Entry points (no incoming refs):");
    for (const node of entryPoints) {
      lines.push(`  - ${node.filePath}`);
    }
  }

  // Most connected by incoming refs
  const connected = nodes
    .filter((n) => n.inDegree > 0)
    .sort((a, b) => b.inDegree - a.inDegree);
  if (connected.length > 0) {
    lines.push("");
    lines.push("Most connected (by incoming refs):");
    const top = connected.slice(0, 5);
    for (const node of top) {
      lines.push(
        `  - ${node.filePath} (${String(node.inDegree)} in, ${String(node.outDegree)} out)`,
      );
    }
  }

  return lines.join("\n");
}
export function classifyImpact(
  graph: ContextGraph,
  filePath: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
} {
  // Build reverse adjacency list
  const reverseAdj = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const sources = reverseAdj.get(edge.target);
    if (sources) {
      if (!sources.includes(edge.source)) {
        sources.push(edge.source);
      }
    } else {
      reverseAdj.set(edge.target, [edge.source]);
    }
  }

  // Count direct reverse edges per source for reference count
  const reverseEdgeCounts = new Map<string, Map<string, number>>();
  for (const edge of graph.edges) {
    let sourceCounts = reverseEdgeCounts.get(edge.target);
    if (!sourceCounts) {
      sourceCounts = new Map<string, number>();
      reverseEdgeCounts.set(edge.target, sourceCounts);
    }
    sourceCounts.set(edge.source, (sourceCounts.get(edge.source) ?? 0) + 1);
  }

  // BFS with depth tracking
  const visited = new Set<string>();
  visited.add(filePath);

  const directlyAffected: { file: string; references: number }[] = [];
  const transitivelyAffected: { file: string; via: string }[] = [];

  // Track which file led to discovering each node (for "via" path)
  const parent = new Map<string, string>();

  // Depth-layered BFS
  let currentLayer = [filePath];

  let depth = 0;
  while (currentLayer.length > 0) {
    const nextLayer: string[] = [];
    depth++;

    for (const current of currentLayer) {
      const sources = reverseAdj.get(current);
      if (!sources) continue;

      for (const source of sources) {
        if (visited.has(source)) continue;
        visited.add(source);
        nextLayer.push(source);
        parent.set(source, current);

        if (depth === 1) {
          // Direct references to the changed file
          const edgeCounts = reverseEdgeCounts.get(filePath);
          const refCount = edgeCounts?.get(source) ?? 0;
          directlyAffected.push({ file: source, references: refCount });
        } else {
          // Transitive: find the directly-affected ancestor as "via"
          let via = source;
          let ancestor = parent.get(via);
          while (ancestor && ancestor !== filePath) {
            via = ancestor;
            ancestor = parent.get(via);
          }
          transitivelyAffected.push({ file: source, via });
        }
      }
    }

    currentLayer = nextLayer;
  }

  directlyAffected.sort((a, b) => a.file.localeCompare(b.file));
  transitivelyAffected.sort((a, b) => a.file.localeCompare(b.file));

  return { directlyAffected, transitivelyAffected };
}

/**
 * Format impact analysis results as a human-readable summary line.
 */
export function formatImpactSummary(
  directCount: number,
  transitiveCount: number,
): string {
  return `1 file changed → ${String(directCount)} directly affected → ${String(transitiveCount)} transitively affected`;
}

/**
 * Convert absolute paths to cwd-relative paths in impact results.
 */
export function relativizeImpact(
  impact: {
    directlyAffected: { file: string; references: number }[];
    transitivelyAffected: { file: string; via: string }[];
  },
  cwd: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
} {
  return {
    directlyAffected: impact.directlyAffected.map((d) => ({
      file: relative(cwd, d.file).replace(/\\/g, "/"),
      references: d.references,
    })),
    transitivelyAffected: impact.transitivelyAffected.map((t) => ({
      file: relative(cwd, t.file).replace(/\\/g, "/"),
      via: relative(cwd, t.via).replace(/\\/g, "/"),
    })),
  };
}
