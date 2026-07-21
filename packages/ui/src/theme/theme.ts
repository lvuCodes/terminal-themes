// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.
//
// Terminal-inspired theme system — framework-agnostic core. The palettes
// themselves live in themes.css as [data-theme] blocks; this module owns the
// theme catalog, persistence, and the imperative apply. The React binding lives
// in useTheme.ts and the switcher UI in ThemeSwitcher.tsx, both thin layers on
// top of these functions, so this core is reusable outside React.

export type ThemeId =
  | "grass"
  | "homebrew"
  | "pro"
  | "ocean"
  | "red-sands"
  | "man-page"
  | "novel"
  | "silver-aerogel"
  | "basic"
  | "lvucodes";

export interface ThemeOption {
  id: ThemeId;
  label: string;
}

// Catalog + display order for the switcher. "grass" is the default; its palette
// is the bare :root in themes.css (the other ids each get a [data-theme] block).
export const THEMES: readonly ThemeOption[] = [
  { id: "grass", label: "Grass" },
  { id: "homebrew", label: "Homebrew" },
  { id: "pro", label: "Pro" },
  { id: "ocean", label: "Ocean" },
  { id: "red-sands", label: "Red Sands" },
  { id: "man-page", label: "Man Page" },
  { id: "novel", label: "Novel" },
  { id: "silver-aerogel", label: "Silver" },
  { id: "basic", label: "Basic" },
  { id: "lvucodes", label: "lvuCodes" },
];

export const DEFAULT_THEME: ThemeId = "grass";

// localStorage key. Namespaced so it can coexist with a host app's own keys.
export const THEME_STORAGE_KEY = "mogo-theme";

const VALID_IDS = new Set<string>(THEMES.map((t) => t.id));

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value != null && VALID_IDS.has(value);
}

// Read the persisted theme, falling back to the default. A stored value that is
// no longer a known theme is treated as absent. localStorage can throw on
// file:// origins or when storage is disabled — any failure yields the default.
export function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Persist the theme; swallows storage failures (file:// / disabled storage), in
// which case the choice simply won't survive a reload.
export function saveTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage may be blocked — nothing to do */
  }
}

// Apply a theme to the document by setting <html data-theme>, which the
// [data-theme] blocks in themes.css key off, then persist the choice.
export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
  saveTheme(theme);
}

// --- ANSI half-palette selection ---------------------------------------------
// Which half of the 16 ANSI slots the UI draws from: "dark" uses the bright
// slots (8–15), "light" the normal ones (0–7). Every profile has a natural
// answer, but either can be forced onto any profile for comparison.

export type AnsiMode = "dark" | "light";

// The profiles with a pale background. Kept in sync with the light [data-theme]
// blocks in themes.css, which set color-scheme: light and the normal-slot map.
export const LIGHT_THEMES: readonly ThemeId[] = [
  "man-page",
  "novel",
  "silver-aerogel",
  "basic",
  "lvucodes",
];

// The half a profile uses when nothing is forced — the default the CSS already
// applies, mirrored here so the UI can show the toggle in the matching position.
export function naturalAnsiMode(theme: ThemeId): AnsiMode {
  return LIGHT_THEMES.includes(theme) ? "light" : "dark";
}

// Force a half onto the document via <html data-ansi-mode>, which the
// :root[data-ansi-mode] blocks in themes.css key off. Not persisted: the mode
// follows the profile unless deliberately overridden, and a stored override
// would silently contradict the next profile picked.
export function applyAnsiMode(mode: AnsiMode): void {
  document.documentElement.dataset.ansiMode = mode;
}
