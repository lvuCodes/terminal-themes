import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/se-smoke/**"],
      reporter: ["text", "html"],
      thresholds: { statements: 98, branches: 100, functions: 100, lines: 98 },
    },
  },
});
