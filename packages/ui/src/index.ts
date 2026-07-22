// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.
//
// @lvucodes/ui — shared UI for the lvucodes.github.io sites. Every stylesheet
// is imported by the component that wears it, never by this barrel: a barrel
// side-effect import gets tree-shaken in workspace builds even with the
// sideEffects globs (Rollup skips them for symlinked source), which is how the
// showcase once shipped a skinless back-link pill. The iPhone SE smoke spec
// lives behind the ./se-smoke subpath so Playwright stays out of app bundles.

export { BackLink, BACK_LINK_DEFAULT_HREF, BACK_LINK_DEFAULT_LABEL } from "./back-link";
export {
  FooterCredits,
  DEFAULT_OWNER,
  DEFAULT_OWNER_HREF,
  DEFAULT_LICENSE_LABEL,
} from "./footer-credits";
export {
  ThemeSwitcher,
  useTheme,
  useAnsiMode,
  THEMES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  LIGHT_THEMES,
  applyTheme,
  applyAnsiMode,
  naturalAnsiMode,
  loadTheme,
  saveTheme,
  isThemeId,
  type AnsiMode,
  type ThemeId,
  type ThemeOption,
} from "./theme";
