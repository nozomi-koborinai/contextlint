import { findConfig, loadConfig } from "@contextlint/core";
import type { ContextlintConfig } from "@contextlint/core";

export interface LoadedConfig {
  config: ContextlintConfig;
  path: string;
}

export function tryLoadConfig(cwd: string): LoadedConfig | null {
  const path = findConfig(cwd);
  if (!path) return null;
  try {
    const config = loadConfig(path);
    return { config, path };
  } catch {
    return null;
  }
}
