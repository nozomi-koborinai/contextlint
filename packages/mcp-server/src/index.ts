#!/usr/bin/env node

import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  parseDocument,
  runRules,
  resolveRule,
  lintFiles,
  findConfig,
  loadConfig,
  formatContentResults,
  formatFileResults,
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("contextlint MCP server running on stdio");
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
