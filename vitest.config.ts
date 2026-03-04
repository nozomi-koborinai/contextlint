import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "packages/presets/*/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
