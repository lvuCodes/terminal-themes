// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef, type ChangeEvent } from "react";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { Select } from "./Select";

const css = readFileSync(resolve(__dirname, "select.css"), "utf8");

afterEach(cleanup);

describe("Select", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "Select.tsx"), "utf8");
    expect(source).toContain('import "./select.css"');
  });

  it("renders a native select wearing the shared class", () => {
    render(
      <Select aria-label="Sort">
        <option value="name">Name</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Sort" }).className).toBe("select");
  });

  it("keeps a caller's own class beside the shared one", () => {
    render(<Select aria-label="Sort" className="wide" />);
    expect(screen.getByRole("combobox").className).toBe("select wide");
  });

  it("forwards value and change events like a bare select", async () => {
    const onChange = vi.fn((e: ChangeEvent<HTMLSelectElement>) => e.target.value);
    render(
      <Select aria-label="Language" value="all" onChange={onChange}>
        <option value="all">All languages</option>
        <option value="en">English</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "en");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toBe("en");
  });
});

describe("Select ref", () => {
  it("forwards a ref to the rendered select", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select aria-label="Sort" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("combobox"));
  });
});

const SKIN = '.select:not([multiple], [size]:not([size="0"], [size="1"]))';

function ruleFor(state = "") {
  return ruleBody(css, `:where(${SKIN}${state})`);
}

describe("select.css", () => {
  const rule = ruleFor();

  it.each([
    ["no size", {}, true],
    ['size="0"', { size: "0" }, true],
    ['size="1"', { size: "1" }, true],
    ['size="4"', { size: "4" }, false],
    ["multiple", { multiple: "" }, false],
    ['multiple size="1"', { multiple: "", size: "1" }, false],
  ])("skin selector with %s matches: %s", (_label, attrs, skinned) => {
    const el = document.createElement("select");
    el.className = "select";
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    expect(el.matches(SKIN)).toBe(skinned);
  });

  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("catches a selector list that adds specificity", () => {
    expect(selectorsOf(".select,\n:where(.a) {}")).toEqual([".select", ":where(.a)"]);
    expect(isSingleWhere(":where(a), :is(b)")).toBe(false);
    expect(isSingleWhere(":where(a):hover")).toBe(false);
  });

  it("uses a 16px font on touch screens so iOS does not zoom on focus", () => {
    const touch = css.slice(css.indexOf("@media (pointer: coarse)"));
    expect(touch).toMatch(/:where\(\.select\) \{\s*font-size: 1rem;/);
  });

  it("shows hover and keyboard focus", () => {
    expect(ruleFor(":hover")).toContain("filter: brightness(1.12)");
    expect(ruleFor(":focus-visible")).toContain("outline: 2px solid var(--accent)");
  });

  it("draws a downward chevron from two triangles", () => {
    expect(rule).toContain("linear-gradient(45deg, transparent 50%, currentcolor 50%)");
    expect(rule).toContain("linear-gradient(135deg, currentcolor 50%, transparent 50%)");
  });

  it("marks a disabled select as unavailable", () => {
    const disabled = ruleFor(":disabled");
    expect(disabled).toContain("opacity: 0.5");
    expect(disabled).toContain("filter: none");
    expect(disabled).toContain("cursor: not-allowed");
  });

  it("restores the native arrow in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(forced).toContain("appearance: auto");
    expect(forced).toContain("background-image: none");
  });

  it("gives the chevron room clear of the right border", () => {
    expect(rule).toContain("appearance: none");
    expect(rule).toMatch(/background-position:\s*right 1rem center,\s*right 0\.5rem center/);
    expect(rule).toContain("background-size: 0.5rem 0.5rem");
    expect(rule).toContain("padding: 0.25rem 2rem 0.25rem 0.5rem");
  });

  it("draws the chevron in the theme's text colour", () => {
    expect(rule.match(/currentcolor/g)).toHaveLength(2);
    expect(rule).toContain("color: var(--text-h)");
  });
});
