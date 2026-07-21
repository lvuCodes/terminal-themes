// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.
//
// @lvucodes/ui — shared UI for the lvucodes.github.io sites. Importing this
// barrel loads the palette stylesheet and the shared .pill primitive as side
// effects; the theme system, BackLink and FooterCredits come with it. The
// iPhone SE smoke spec lives behind the ./se-smoke subpath so Playwright stays
// out of app bundles.
import "./pill/pill.css";

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
