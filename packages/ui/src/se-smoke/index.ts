// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.
//
// Shared iPhone SE smoke spec. Every site's dev → main merge is gated on this
// suite via the reusable site-ci workflow: import `defineSeSmoke` from a
// Playwright spec file and call it, extending with per-site assertions as
// needed. Requires @playwright/test in the consuming repo.
import { expect, test } from "@playwright/test";

export const SE_VIEWPORT = { width: 375, height: 667 };

export const BACK_LINK_OFFSET = 20;

export interface SeSmokeOptions {
  // Path to open before each assertion, relative to the configured baseURL.
  path?: string;
  // Selector for the primary interactive controls that must sit unclipped
  // inside the viewport width.
  controls?: string;
  // Set false for pages that render no BackLink (e.g. the home page itself).
  expectBackLink?: boolean;
}

export function defineSeSmoke({
  path = "/",
  controls = "a.pill, button",
  expectBackLink = true,
}: SeSmokeOptions = {}) {
  test.describe("iPhone SE smoke", () => {
    test.use({ viewport: SE_VIEWPORT });

    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("no horizontal overflow", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });

    if (expectBackLink) {
      test(`back link overlays the top-left corner at ${BACK_LINK_OFFSET}/${BACK_LINK_OFFSET}`, async ({
        page,
      }) => {
        const box = await page.locator(".back-nav").boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBe(BACK_LINK_OFFSET);
        expect(box!.y).toBe(BACK_LINK_OFFSET);
      });
    }

    test("primary controls are visible and unclipped", async ({ page }) => {
      const els = page.locator(controls);
      const count = await els.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const el = els.nth(i);
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        expect(box, `${controls} #${i}`).not.toBeNull();
        expect(box!.x, `${controls} #${i} left edge`).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `${controls} #${i} right edge`).toBeLessThanOrEqual(
          SE_VIEWPORT.width,
        );
      }
    });
  });
}
