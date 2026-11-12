import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/core/**/*.ts",
        "src/services/**/*.ts",
        "src/config.ts",
      ],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
