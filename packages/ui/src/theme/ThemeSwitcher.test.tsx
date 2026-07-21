// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { THEMES } from "./theme";

afterEach(cleanup);

describe("ThemeSwitcher", () => {
  it("renders one button per catalog theme and marks the active one", () => {
    render(<ThemeSwitcher theme="ocean" onChange={() => {}} />);
    for (const t of THEMES) {
      expect(screen.getByRole("button", { name: t.label })).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Ocean" }).classList.contains("active")).toBe(true);
    expect(screen.getByRole("button", { name: "Grass" }).classList.contains("active")).toBe(false);
  });

  it("reports the picked theme to the caller", async () => {
    const onChange = vi.fn();
    render(<ThemeSwitcher theme="grass" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "lvuCodes" }));
    expect(onChange).toHaveBeenCalledWith("lvucodes");
  });

  it("shows the default caption, and drops it when passed an empty label", () => {
    render(<ThemeSwitcher theme="grass" onChange={() => {}} />);
    expect(screen.getByText("Theme:")).toBeTruthy();
    cleanup();
    render(<ThemeSwitcher theme="grass" onChange={() => {}} label="" />);
    expect(screen.queryByText("Theme:")).toBeNull();
  });
});
