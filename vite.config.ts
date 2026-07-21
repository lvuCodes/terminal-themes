import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built site also runs from file:// or a subpath.
  base: "./",
  plugins: [react()],
  // Writing a coverage report otherwise storms the dev server with reloads.
  server: { watch: { ignored: ["**/coverage/**", "**/dist/**"] } },
  test: {
    // Site tests only — the package runs its own suite via its workspace, and
    // e2e/ belongs to Playwright.
    include: ["src/**/*.test.{ts,tsx}"],
    // Provide an in-memory localStorage for every test (see the setup file).
    // Test files opt into jsdom per-file via `// @vitest-environment jsdom`.
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/main.tsx"],
      reporter: ["text", "html"],
      thresholds: { statements: 98, branches: 100, functions: 100, lines: 98 },
    },
  },
});
