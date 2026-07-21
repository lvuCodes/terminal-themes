// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useTheme } from "./useTheme";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "./theme";

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("useTheme", () => {
  it("starts on the default theme and applies it to <html>", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe(DEFAULT_THEME);
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });

  it("reads the persisted theme on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "novel");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("novel");
    expect(document.documentElement.dataset.theme).toBe("novel");
  });

  it("applies and persists a newly picked theme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]("ocean"));
    expect(result.current[0]).toBe("ocean");
    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ocean");
  });
});
