import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Read the stylesheet off disk rather than importing it: vitest stubs CSS
// imports to an empty string, and `?raw` does not escape that stubbing.
const themesCss = readFileSync(fileURLToPath(new URL("./themes.css", import.meta.url)), "utf8");

const THEME_BLOCKS = [
  "homebrew",
  "pro",
  "ocean",
  "red-sands",
  "man-page",
  "novel",
  "silver-aerogel",
  "basic",
  "lvucodes",
];

const LIGHT_THEMES = ["man-page", "novel", "silver-aerogel", "basic", "lvucodes"];

// Split the stylesheet into { selectorList, body } rules. Needed because several
// ids appear in both their own block and a grouped override, so matching on the
// selector alone picks up whichever comes first — or, for the id that happens to
// sit last in a group, the group itself.
function rules(css: string): { selector: string; body: string }[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
    selector: m[1].trim().replace(/\s+/g, " "),
    body: m[2],
  }));
}

function ownBlock(css: string, id: string): string | undefined {
  return rules(css).find((r) => r.selector === `[data-theme="${id}"]`)?.body;
}

// Consumers resolve every colour through these tokens, and a var() that resolves
// to nothing fails silently — the element just inherits, with no error anywhere.
// So the token contract gets pinned here rather than trusted.
describe("themes.css", () => {
  it("declares a block for every theme past the :root default", () => {
    for (const id of THEME_BLOCKS) {
      expect(themesCss).toContain(`[data-theme="${id}"]`);
    }
  });

  it("declares all sixteen numbered ANSI slots", () => {
    for (let slot = 0; slot < 16; slot++) {
      expect(themesCss, `--ansi-${slot}`).toMatch(
        new RegExp(`--ansi-${slot}:\\s*#[0-9a-f]{6}`, "i"),
      );
    }
  });

  it("maps every ui token in all four places — two profile defaults, two overrides", () => {
    const roles = ["red", "green", "yellow", "blue", "magenta", "cyan", "text", "dim", "inverse"];
    for (const role of roles) {
      const hits = themesCss.match(new RegExp(`--ansi-ui-${role}:`, "g")) ?? [];
      expect(hits.length, `--ansi-ui-${role}`).toBe(4);
    }
  });

  it("points the dark default at the bright half and light profiles at the normal half", () => {
    expect(themesCss).toMatch(/--ansi-ui-red:\s*var\(--ansi-9\)/);
    expect(themesCss).toMatch(/--ansi-ui-text:\s*var\(--ansi-15\)/);
    expect(themesCss).toMatch(/--ansi-ui-red:\s*var\(--ansi-1\)/);
    expect(themesCss).toMatch(/--ansi-ui-text:\s*var\(--ansi-0\)/);
  });

  it("declares both explicit ansi-mode overrides", () => {
    expect(themesCss).toContain(':root[data-ansi-mode="dark"]');
    expect(themesCss).toContain(':root[data-ansi-mode="light"]');
  });

  it("qualifies the overrides with :root so they outrank the profile defaults", () => {
    // A bare [data-ansi-mode] block ties with the grouped light-profile selector
    // and loses on source order, so forcing the dark half onto a light profile
    // would silently do nothing.
    for (const mode of ["dark", "light"]) {
      const rule = rules(themesCss).find((r) => r.selector.includes(`data-ansi-mode="${mode}"`));
      expect(rule?.selector, mode).toBe(`:root[data-ansi-mode="${mode}"]`);
    }
  });

  it("has each override remap every ui token, so no role leaks the other half", () => {
    const roles = ["red", "green", "yellow", "blue", "magenta", "cyan", "text", "dim", "inverse"];
    for (const mode of ["dark", "light"]) {
      const body =
        rules(themesCss).find((r) => r.selector === `:root[data-ansi-mode="${mode}"]`)?.body ?? "";
      for (const role of roles) {
        expect(body, `${mode}/${role}`).toContain(`--ansi-ui-${role}:`);
      }
    }
  });

  it("gives every light profile color-scheme: light so native controls match", () => {
    for (const id of LIGHT_THEMES) {
      expect(ownBlock(themesCss, id), id).toContain("color-scheme: light");
    }
  });
});
