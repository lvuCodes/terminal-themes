import { describe, expect, it } from "vitest";
import mainSource from "./main.tsx?raw";
import pkg from "../package.json";
import indexHtml from "../index.html?raw";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Regression guard for a bug that shipped a completely unstyled production site.
//
// package.json declares a `sideEffects` allowlist so the dev-only folder tree-
// shakes out of the production bundle. Rollup does not honour those globs for
// first-party source, so the theme barrel's `import "./themes.css"` was dropped
// and the build carried zero palette tokens (--bg, --accent, --item-N). Dev mode
// never showed it, because Vite does not tree-shake there.
//
// The two settings are coupled: the allowlist must stay (it strips src/dev/) AND
// the palette must be imported from the entry module, which is never shaken.
describe("theme stylesheet bundling", () => {
  it("imports the palette from the entry module, not only the barrel", () => {
    expect(mainSource).toMatch(/import\s+["']@lvucodes\/ui\/theme\.css["']/);
  });

  it("keeps the sideEffects allowlist that strips the dev folder", () => {
    expect(pkg.sideEffects).toContain("**/*.css");
  });
});

describe("favicon", () => {
  it.each(["favicon-32.png", "favicon-16.png", "apple-touch-icon.png"])(
    "links %s from the head and ships it in public/",
    (file) => {
      expect(indexHtml).toMatch(new RegExp(`<link rel="(icon|apple-touch-icon)"[^>]*href="/${file}"`));
      expect(existsSync(resolve(__dirname, "../public", file))).toBe(true);
    },
  );
});
