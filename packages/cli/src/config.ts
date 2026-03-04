import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface RuleEntry {
  rule: string;
  options?: Record<string, unknown>;
}

export interface ContextlintConfig {
  rules: RuleEntry[];
}

export function loadConfig(
  configPath: string,
  cwd: string,
): ContextlintConfig {
  const fullPath = resolve(cwd, configPath);

  let raw: string;
  try {
    raw = readFileSync(fullPath, "utf-8");
  } catch {
    throw new Error(`Cannot read config file: ${fullPath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in config file: ${fullPath}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).rules)
  ) {
    throw new Error(
      `Config must have a "rules" array: ${fullPath}`,
    );
  }

  return parsed as ContextlintConfig;
}
