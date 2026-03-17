import { resolve } from "node:path";
import {
  findConfig,
  loadConfig,
  loadDocuments,
  buildContextGraph,
} from "@contextlint/core";
import type {
  ContextlintConfig,
  ContextGraph,
  ParsedDocument,
} from "@contextlint/core";

export interface ResolvedContext {
  cwd: string;
  config: ContextlintConfig;
  documents: Map<string, ParsedDocument>;
  graph: ContextGraph;
}

/**
 * Validate the --format option. Exits with code 2 if invalid.
 */
export function validateFormat(format: string): asserts format is "human" | "json" {
  if (format !== "human" && format !== "json") {
    console.error(
      `Error: Invalid format "${format}". Use "human" or "json".`,
    );
    process.exit(2);
  }
}

/**
 * Resolve config path from CLI options.
 * Returns the absolute path to the config file.
 * Exits with code 2 if config cannot be found or loaded.
 */
export function resolveConfig(
  cwd: string,
  configOpt?: string,
): { configPath: string; config: ContextlintConfig } {
  let configPath: string;
  if (configOpt) {
    configPath = resolve(cwd, configOpt);
  } else {
    const found = findConfig(cwd);
    if (!found) {
      console.error(
        "Error: No contextlint.config.json found. Create a config file or use --config.",
      );
      process.exit(2);
    }
    configPath = found;
  }

  try {
    const config = loadConfig(configPath);
    return { configPath, config };
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(2);
  }
}

/**
 * Load documents and build the context graph from config.
 * Combines config loading, document loading, and graph building.
 */
export function loadContext(
  opts: { config?: string; cwd: string },
): ResolvedContext {
  const cwd = resolve(opts.cwd);
  const { config } = resolveConfig(cwd, opts.config);
  const patterns = config.include ?? ["**/*.md"];

  try {
    const documents = loadDocuments(patterns, cwd);
    const graph = buildContextGraph(documents);
    return { cwd, config, documents, graph };
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(2);
  }
}
