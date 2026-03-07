#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseDocument, runRules, resolveRule, lintFiles } from "@contextlint/core";
import * as z from "zod/v4";
import { formatContentResults, formatFileResults } from "./format.js";

const server = new McpServer({
  name: "contextlint",
  version: "0.0.0",
});

// Tool 1: lint — lint markdown content directly
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

// Tool 2: lint-files — lint files matching glob patterns
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
  async ({ patterns, configPath, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");
    const resolvedPatterns = patterns ?? ["**/*.md"];

    try {
      const resolvedConfigPath = configPath ?? "contextlint.config.json";
      const fullConfigPath = resolve(resolvedCwd, resolvedConfigPath);
      let raw: string;
      try {
        raw = readFileSync(fullConfigPath, "utf-8");
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Error: Cannot read config file: ${fullConfigPath}`,
            },
          ],
          isError: true,
        };
      }

      let config: {
        rules?: { rule: string; options?: Record<string, unknown> }[];
      };
      try {
        config = JSON.parse(raw) as typeof config;
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Error: Invalid JSON in config file: ${fullConfigPath}`,
            },
          ],
          isError: true,
        };
      }

      if (!config.rules || !Array.isArray(config.rules)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Config must have a "rules" array: ${fullConfigPath}`,
            },
          ],
          isError: true,
        };
      }

      const results = await lintFiles(resolvedPatterns, { rules: config.rules }, resolvedCwd);
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
