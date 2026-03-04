#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseDocument, runRules, resolveRule } from "@contextlint/core";
import { glob } from "glob";
import * as z from "zod/v4";
import { loadPreset } from "./preset.js";
import {
  formatContentResults,
  formatFileResults,
  type FileLintResult,
} from "./format.js";

const server = new McpServer({
  name: "contextlint",
  version: "0.0.0",
});

// Tool 1: lint — lint markdown content directly
server.tool(
  "lint",
  "Lint markdown content with specified rules",
  {
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
  async ({ content, rules: ruleEntries }) => {
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
server.tool(
  "lint-files",
  "Lint markdown files matching glob patterns using a config file or preset",
  {
    patterns: z
      .array(z.string())
      .optional()
      .describe('Glob patterns (default: ["**/*.md"])'),
    configPath: z
      .string()
      .optional()
      .describe('Config file path (default: "contextlint.config.json")'),
    preset: z
      .string()
      .optional()
      .describe('Use a built-in preset (e.g. "dna")'),
    cwd: z
      .string()
      .optional()
      .describe('Working directory (default: ".")'),
  },
  async ({ patterns, configPath, preset, cwd }) => {
    const resolvedCwd = resolve(cwd ?? ".");
    const resolvedPatterns = patterns ?? ["**/*.md"];

    if (configPath && preset) {
      return {
        content: [
          {
            type: "text",
            text: "Error: configPath and preset cannot be used together",
          },
        ],
        isError: true,
      };
    }

    try {
      let config: { rules: { rule: string; options?: Record<string, unknown> }[] };

      if (preset) {
        config = loadPreset(preset, resolvedCwd);
      } else {
        // Load config from file
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

        try {
          config = JSON.parse(raw);
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
      }

      const rules = config.rules.map((entry) =>
        resolveRule(entry.rule, entry.options),
      );

      const docRules = rules.filter(
        (r) => (r.scope ?? "document") === "document",
      );
      const projectRules = rules.filter((r) => r.scope === "project");

      // Find and lint files
      const files = await glob(resolvedPatterns, {
        cwd: resolvedCwd,
        absolute: true,
      });
      files.sort();

      const projectFiles = files.map((f) => relative(resolvedCwd, f));

      const results: FileLintResult[] = [];

      // Run project-scoped rules once
      if (projectRules.length > 0) {
        const emptyDoc = parseDocument("");
        const messages = runRules(projectRules, emptyDoc, "<project>", {
          projectFiles,
        });
        if (messages.length > 0) {
          results.push({ filePath: "<project>", messages });
        }
      }

      // Run document-scoped rules per file
      for (const filePath of files) {
        const fileContent = readFileSync(filePath, "utf-8");
        const document = parseDocument(fileContent);
        const messages = runRules(docRules, document, filePath);
        results.push({ filePath, messages });
      }

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

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
