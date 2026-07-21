import { describe, expect, it } from "vitest";
import * as api from "./index";

// The exports map is the package's public contract — a rename or a dropped
// re-export here breaks every consuming site at once, so the surface is pinned.
describe("@lvucodes/ui public API", () => {
  it("exposes the components, hooks, and theme core", () => {
    const expected = [
      "BackLink",
      "BACK_LINK_DEFAULT_HREF",
      "BACK_LINK_DEFAULT_LABEL",
      "FooterCredits",
      "DEFAULT_OWNER",
      "DEFAULT_OWNER_HREF",
      "DEFAULT_LICENSE_LABEL",
      "ThemeSwitcher",
      "useTheme",
      "useAnsiMode",
      "THEMES",
      "DEFAULT_THEME",
      "THEME_STORAGE_KEY",
      "LIGHT_THEMES",
      "applyTheme",
      "applyAnsiMode",
      "naturalAnsiMode",
      "loadTheme",
      "saveTheme",
      "isThemeId",
    ];
    for (const name of expected) {
      expect(api, name).toHaveProperty(name);
    }
  });
});
