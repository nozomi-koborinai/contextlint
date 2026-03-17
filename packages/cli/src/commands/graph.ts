import type { Command } from "commander";
import {
  getComponents,
  topologicalSort,
  formatGraphResult,
  formatGraphResultJson,
} from "@contextlint/core";
import { loadContext, validateFormat } from "./shared.js";

export function registerGraphCommand(program: Command): void {
  program
    .command("graph")
    .description("Build and display the document dependency graph")
    .option("--config <path>", "Path to config file")
    .option("--format <format>", "Output format: human or json", "human")
    .option("--cwd <path>", "Working directory", process.cwd())
    .action(
      (opts: { config?: string; format: string; cwd: string }) => {
        validateFormat(opts.format);

        const ctx = loadContext(opts);

        try {
          const components = getComponents(ctx.graph);
          const readingOrder = topologicalSort(ctx.graph);

          const output =
            opts.format === "json"
              ? formatGraphResultJson(
                  ctx.graph,
                  components,
                  readingOrder,
                  ctx.cwd,
                )
              : formatGraphResult(
                  ctx.graph,
                  components,
                  readingOrder,
                  ctx.cwd,
                );

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
