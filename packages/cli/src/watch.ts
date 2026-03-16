import { watch } from "node:fs";
import { resolve } from "node:path";
import { lintFiles, formatFileResults } from "@contextlint/core";
import type { ContextlintConfig } from "@contextlint/core";

export function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };
}

function timestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function runLint(
  patterns: string[],
  config: ContextlintConfig,
  cwd: string,
): void {
  try {
    const results = lintFiles(patterns, config, cwd);
    const output = formatFileResults(results, cwd);
    console.log(output);
    console.log("");
  } catch (err: unknown) {
    console.error(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function startWatch(
  patterns: string[],
  config: ContextlintConfig,
  cwd: string,
): void {
  // Initial lint run
  console.clear();
  console.log(`[${timestamp()}] Watching for changes...\n`);
  runLint(patterns, config, cwd);

  const watchDir = resolve(cwd);

  let lastChangedFile: string | null = null;

  const onChangeDetected = (): void => {
    console.clear();
    if (lastChangedFile) {
      console.log(`[${timestamp()}] File changed: ${lastChangedFile}\n`);
    } else {
      console.log(`[${timestamp()}] Change detected\n`);
    }
    runLint(patterns, config, cwd);
    lastChangedFile = null;
  };

  const debouncedLint = debounce(onChangeDetected, 300);

  try {
    watch(watchDir, { recursive: true }, (_eventType, filename) => {
      if (typeof filename === "string" && filename.endsWith(".md")) {
        lastChangedFile = filename;
        debouncedLint();
      }
    });
  } catch {
    console.error("Error: Unable to watch directory: " + watchDir);
    process.exit(2);
  }

  // Keep the process alive
  process.on("SIGINT", () => {
    console.log("\nWatch mode stopped.");
    process.exit(0);
  });
}
