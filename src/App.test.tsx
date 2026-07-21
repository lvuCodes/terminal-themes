// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from "./theme";

// RTL's automatic cleanup only runs under vitest `globals: true`; unmount
// explicitly so renders don't stack across tests.
afterEach(cleanup);

describe("App", () => {
  it("renders one button per theme and marks the default active", () => {
    render(<App />);
    for (const t of THEMES) {
      expect(screen.getByRole("button", { name: t.label })).toBeTruthy();
    }
    const active = THEMES.find((t) => t.id === DEFAULT_THEME)!;
    expect(
      screen.getByRole("button", { name: active.label }).classList.contains("active"),
    ).toBe(true);
  });

  it("applies and persists the theme picked from the switcher", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Ocean" }));

    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ocean");
    expect(screen.getByRole("button", { name: "Ocean" }).classList.contains("active")).toBe(
      true,
    );
  });

  it("restores the persisted theme on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "novel");
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe("novel");
  });

  it("renders the surface swatches and the full categorical ramp", () => {
    const { container } = render(<App />);
    expect(screen.getByText("--accent")).toBeTruthy();
    expect(screen.getByText("forced")).toBeTruthy();
    expect(container.querySelectorAll(".ramp-cell")).toHaveLength(11);
    expect(container.querySelectorAll(".swatch")).toHaveLength(8);
  });

  it("credits the author and links this repo's own licence, in a footer with no switcher", () => {
    const { container } = render(<App />);
    const footer = container.querySelector("footer.credits")!;
    expect(footer.querySelector(".theme-bar")).toBeNull();
    expect(container.querySelectorAll(".theme-bar")).toHaveLength(1);

    const links = [...footer.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://github.com/lvuCodes",
      "https://github.com/lvuCodes/terminal-themes/blob/main/LICENSE",
    ]);
    for (const a of links) {
      expect(a.getAttribute("rel")).toBe("noreferrer noopener");
      expect(a.getAttribute("target")).toBe("_blank");
    }
    expect(footer.textContent).toContain("GNU GPL v3");
  });
});
