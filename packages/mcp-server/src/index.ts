#!/usr/bin/env node

import { resolve, relative as relPath } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  parseDocument,
  runRules,
  resolveRule,
  lintFiles,
  loadDocuments,
  findConfig,
  loadConfig,
  formatContentResults,
  formatFileResults,
  buildContextGraph,
  formatContextGraphSummary,
  getContextSlice,
  classifyImpact,
  formatImpactSummary,
  relativizeImpact,
  compileContext,
} from "@contextlint/core";
import * as z from "zod/v4";

const server = new McpServer({
  name: "contextlint",
  version: "0.0.0",
});

server.registerTool(
  "lint",
  {
    description: "Lint markdown content with specified rules",
    inputSchema: {
      content: z.string().describe("Markdown text to lint"),
      rules: z
        .array(
          z.object({
            rule: z.string().describe("Rule name (e.g. tbl001)"),
            options: z
              .record(z.string(), z.unknown())
              .optional()
              .describe("Rule options"),
          }),
        )
        .describe("Rules to apply"),
    },
  },
  ({ content, rules: ruleEntries }) => {
    try {
      const rules = ruleEntries.map((entry) =>
        resolveRule(entry.rule, entry.options),
      );
      const document = parseDocument(content);
      const messages = runRules(rules, document, "<input>");
      const text = formatContentResults(messages);
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "lint-files",
  {
    description:
      "Lint markdown files matching glob patterns using a config file or preset",
    inputSchema: {
      patterns: z
        .array(z.string())
        .optional()
        .describe('Glob patterns (default: ["**/*.md"])'),
      configPath: z
        .string()
        .optional()
        .describe('Config file path (default: "contextlint.config.json")'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory (default: ".")'),
    },
  },
  ({ patterns, configPath, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");

    try {
      let resolvedConfigPath: string;
      if (configPath) {
        resolvedConfigPath = resolve(resolvedCwd, configPath);
      } else {
        const found = findConfig(resolvedCwd);
        if (!found) {
          return {
            content: [
              {
                type: "text",
                text: "Error: No contextlint.config.json found. Provide a configPath or create a config file.",
              },
            ],
            isError: true,
          };
        }
        resolvedConfigPath = found;
      }

      const config = loadConfig(resolvedConfigPath);
      const resolvedPatterns =
        patterns && patterns.length > 0
          ? patterns
          : config.include ?? ["**/*.md"];

      const results = lintFiles(resolvedPatterns, config, resolvedCwd);
      const text = formatFileResults(results, resolvedCwd);
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "context-graph",
  {
    description:
      "Build and return the document dependency graph for the project",
    inputSchema: {
      configPath: z
        .string()
        .optional()
        .describe("Path to contextlint.config.json"),
      cwd: z
        .string()
        .optional()
        .describe("Working directory"),
      format: z
        .enum(["json", "summary"])
        .optional()
        .describe("Output format (default: summary)"),
    },
  },
  ({ configPath, cwd, format }) => {
    const resolvedCwd = resolve(cwd ?? ".");

    try {
      let resolvedConfigPath: string;
      if (configPath) {
        resolvedConfigPath = resolve(resolvedCwd, configPath);
      } else {
        const found = findConfig(resolvedCwd);
        if (!found) {
          return {
            content: [
              {
                type: "text",
                text: "Error: No contextlint.config.json found. Provide a configPath or create a config file.",
              },
            ],
            isError: true,
          };
        }
        resolvedConfigPath = found;
      }

      const config = loadConfig(resolvedConfigPath);
      const patterns = config.include ?? ["**/*.md"];
      const documents = loadDocuments(patterns, resolvedCwd);

      const graph = buildContextGraph(documents);

      const outputFormat = format ?? "summary";
      let text: string;
      if (outputFormat === "json") {
        text = JSON.stringify(graph, null, 2);
      } else {
        text = formatContextGraphSummary(graph);
      }

      return { content: [{ type: "text", text }] };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "context-slice",
  {
    description:
      "Extract the minimal set of documents relevant to a given query (ID, keyword, or file path)",
    inputSchema: {
      query: z.string().describe("ID, keyword, or file path to search for"),
      depth: z
        .number()
        .optional()
        .describe("Max traversal depth (default: 2)"),
      configPath: z
        .string()
        .optional()
        .describe("Path to contextlint.config.json"),
      cwd: z
        .string()
        .optional()
        .describe("Working directory"),
    },
  },
  ({ query, depth, configPath, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");

    try {
      let resolvedConfigPath: string;
      if (configPath) {
        resolvedConfigPath = resolve(resolvedCwd, configPath);
      } else {
        const found = findConfig(resolvedCwd);
        if (!found) {
          return {
            content: [
              {
                type: "text",
                text: "Error: No contextlint.config.json found. Provide a configPath or create a config file.",
              },
            ],
            isError: true,
          };
        }
        resolvedConfigPath = found;
      }

      const config = loadConfig(resolvedConfigPath);
      const patterns = config.include ?? ["**/*.md"];
      const documents = loadDocuments(patterns, resolvedCwd);

      const graph = buildContextGraph(documents);
      const sliceFiles = getContextSlice(graph, documents, query, depth);

      const matchFiles = sliceFiles.filter((f) => {
        const doc = documents.get(f);
        if (!doc) return false;
        return doc.content.includes(query);
      });

      const result = {
        query,
        matchType: matchFiles.length > 0 ? "content" : "graph",
        files: sliceFiles.map((f) => ({
          file: f,
          role: matchFiles.includes(f) ? "match" : "linked",
        })),
        totalFiles: sliceFiles.length,
        summary: `Found '${query}' — ${String(sliceFiles.length)} related file(s) (depth: ${String(depth ?? 2)})`,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "impact-analysis",
  {
    description:
      "Analyze which documents are affected by changes to a given file",
    inputSchema: {
      file: z
        .string()
        .describe("Path to the changed file (relative to cwd)"),
      configPath: z
        .string()
        .optional()
        .describe("Path to contextlint.config.json"),
      cwd: z
        .string()
        .optional()
        .describe("Working directory"),
    },
  },
  ({ file, configPath, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");

    try {
      let resolvedConfigPath: string;
      if (configPath) {
        resolvedConfigPath = resolve(resolvedCwd, configPath);
      } else {
        const found = findConfig(resolvedCwd);
        if (!found) {
          return {
            content: [
              {
                type: "text",
                text: "Error: No contextlint.config.json found. Provide a configPath or create a config file.",
              },
            ],
            isError: true,
          };
        }
        resolvedConfigPath = found;
      }

      const config = loadConfig(resolvedConfigPath);
      const patterns = config.include ?? ["**/*.md"];
      const documents = loadDocuments(patterns, resolvedCwd);

      const resolvedFile = resolve(resolvedCwd, file).replace(/\\/g, "/");

      if (!documents.has(resolvedFile)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: File "${file}" is not in the matched file set. Check your include patterns.`,
            },
          ],
          isError: true,
        };
      }

      const graph = buildContextGraph(documents);
      const impact = classifyImpact(graph, resolvedFile);
      const relImpact = relativizeImpact(impact, resolvedCwd);
      const summary = formatImpactSummary(
        relImpact.directlyAffected.length,
        relImpact.transitivelyAffected.length,
      );

      const changedFileRel = relPath(resolvedCwd, resolvedFile).replace(
        /\\/g,
        "/",
      );

      const result = {
        changedFile: changedFileRel,
        directlyAffected: relImpact.directlyAffected,
        transitivelyAffected: relImpact.transitivelyAffected,
        summary,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "compile-context",
  {
    description:
      "Compile document structure into LLM-readable context text (e.g. SKILL.md). Deterministic: same config + same documents = same output.",
    inputSchema: {
      configPath: z
        .string()
        .optional()
        .describe("Path to contextlint.config.json"),
      cwd: z
        .string()
        .optional()
        .describe("Working directory"),
    },
  },
  ({ configPath, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");

    try {
      let resolvedConfigPath: string;
      if (configPath) {
        resolvedConfigPath = resolve(resolvedCwd, configPath);
      } else {
        const found = findConfig(resolvedCwd);
        if (!found) {
          return {
            content: [
              {
                type: "text",
                text: "Error: No contextlint.config.json found. Provide a configPath or create a config file.",
              },
            ],
            isError: true,
          };
        }
        resolvedConfigPath = found;
      }

      const config = loadConfig(resolvedConfigPath);

      if (!config.compile) {
        return {
          content: [
            {
              type: "text",
              text: "Error: No 'compile' section found in config",
            },
          ],
          isError: true,
        };
      }

      const patterns = config.include ?? ["**/*.md"];
      const result = compileContext(patterns, config, resolvedCwd);

      const metadata = [
        `Documents: ${String(result.metadata.documentCount)}`,
        `Rules: ${String(result.metadata.ruleCount)}`,
        `Components: ${String(result.metadata.componentCount)}`,
      ].join(", ");

      return {
        content: [
          { type: "text", text: result.skillContent },
          { type: "text", text: `\n---\nMetadata: ${metadata}` },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("contextlint MCP server running on stdio");
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
