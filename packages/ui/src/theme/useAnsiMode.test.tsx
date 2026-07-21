// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { LIGHT_THEMES, THEMES, applyAnsiMode, naturalAnsiMode, type ThemeId } from "./theme";
import { useAnsiMode } from "./useAnsiMode";

afterEach(cleanup);

describe("naturalAnsiMode", () => {
  it("puts the pale profiles on the light half and everything else on the dark half", () => {
    for (const { id } of THEMES) {
      expect(naturalAnsiMode(id), id).toBe(LIGHT_THEMES.includes(id) ? "light" : "dark");
    }
  });
});

describe("applyAnsiMode", () => {
  it("writes the mode to <html data-ansi-mode>", () => {
    applyAnsiMode("light");
    expect(document.documentElement.dataset.ansiMode).toBe("light");
    applyAnsiMode("dark");
    expect(document.documentElement.dataset.ansiMode).toBe("dark");
  });
});

// Drives the hook through a host component, since the reset-on-theme-change is
// the whole behaviour and only shows up across a prop change.
function Host({ initial }: { initial: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initial);
  const [mode, setMode] = useAnsiMode(theme);
  return (
    <>
      <output>{mode}</output>
      <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>flip</button>
      <button onClick={() => setTheme("novel")}>to novel</button>
      <button onClick={() => setTheme("pro")}>to pro</button>
    </>
  );
}

describe("useAnsiMode", () => {
  it("starts on the active profile's natural half", () => {
    render(<Host initial="novel" />);
    expect(screen.getByRole("status").textContent).toBe("light");
  });

  it("applies the override to the document", async () => {
    render(<Host initial="pro" />);
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(screen.getByRole("status").textContent).toBe("light");
    expect(document.documentElement.dataset.ansiMode).toBe("light");
  });

  it("resets to the new profile's natural half when the theme changes", async () => {
    // Otherwise an override made on one profile would silently misrepresent the
    // next one picked — a light profile would keep rendering the bright slots.
    render(<Host initial="pro" />);
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(screen.getByRole("status").textContent).toBe("light");

    await userEvent.click(screen.getByRole("button", { name: "to novel" }));
    expect(screen.getByRole("status").textContent).toBe("light");

    await userEvent.click(screen.getByRole("button", { name: "to pro" }));
    expect(screen.getByRole("status").textContent).toBe("dark");
    expect(document.documentElement.dataset.ansiMode).toBe("dark");
  });
});
