import { resolve } from "node:path";
import type { Command } from "commander";
import {
  getContextSlice,
  formatSliceResult,
  formatSliceResultJson,
} from "@contextlint/core";
import { loadContext, validateFormat } from "./shared.js";

export function registerSliceCommand(program: Command): void {
  program
    .command("slice")
    .description("Extract the minimal set of documents relevant to a query")
    .argument("<query>", "File path or ID to find related documents for")
    .option("--depth <depth>", "Maximum traversal depth", "2")
    .option("--config <path>", "Path to config file")
    .option("--format <format>", "Output format: human or json", "human")
    .option("--cwd <path>", "Working directory", process.cwd())
    .action(
      (
        query: string,
        opts: {
          depth: string;
          config?: string;
          format: string;
          cwd: string;
        },
      ) => {
        validateFormat(opts.format);

        const ctx = loadContext(opts);

        // Resolve query to absolute path if it looks like a file path
        const resolvedQuery = query.includes("/") || query.endsWith(".md")
          ? resolve(ctx.cwd, query)
          : query;

        const depth = parseInt(opts.depth, 10);
        if (Number.isNaN(depth) || depth < 0) {
          console.error("Error: --depth must be a non-negative integer.");
          process.exit(2);
        }

        try {
          const files = getContextSlice(
            ctx.graph,
            ctx.documents,
            resolvedQuery,
            depth,
          );

          const output =
            opts.format === "json"
              ? formatSliceResultJson(resolvedQuery, files, ctx.cwd)
              : formatSliceResult(resolvedQuery, files, ctx.cwd);

          console.log(output);
        } catch (err) {
          console.error(
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          );
          process.exit(2);
        }
      },
    );
}
