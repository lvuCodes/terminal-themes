// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { Switch } from "./Switch";

const css = readFileSync(resolve(__dirname, "switch.css"), "utf8");

afterEach(cleanup);

describe("Switch", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "Switch.tsx"), "utf8");
    expect(source).toContain('import "./switch.css"');
  });

  it("renders a checkbox announced as a switch, named by its label", () => {
    const { container } = render(<Switch label="Extension enabled" />);
    const control = screen.getByRole("switch", { name: "Extension enabled", checked: false });
    expect(control.getAttribute("type")).toBe("checkbox");
    expect(control.className).toBe("switch-input");
    const label = container.querySelector("label")!;
    expect(label.className).toBe("switch");
    expect(label.querySelector(".switch-label")!.textContent).toBe("Extension enabled");
    const track = label.querySelector(".switch-track")!;
    expect(track.getAttribute("aria-hidden")).toBe("true");
    expect(control.nextElementSibling).toBe(track);
  });

  it("toggles uncontrolled from a click on its label text", async () => {
    render(<Switch label="Notify" />);
    await userEvent.click(screen.getByText("Notify"));
    expect(screen.getByRole("switch", { name: "Notify", checked: true })).toBeTruthy();
  });

  it("follows checked when controlled and reports changes", async () => {
    const onChange = vi.fn();
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <Switch
          label="Live"
          checked={on}
          onChange={(e) => {
            onChange(e.target.checked);
            setOn(e.target.checked);
          }}
        />
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
  });

  it("toggles with the space key", async () => {
    render(<Switch label="K" />);
    screen.getByRole("switch").focus();
    await userEvent.keyboard(" ");
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
  });

  it("is a mixed checkbox while indeterminate, then a switch again", () => {
    const { rerender } = render(<Switch label="All pages" indeterminate />);
    const box = screen.getByRole("checkbox", { name: "All pages" }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box.hasAttribute("role")).toBe(false);
    rerender(<Switch label="All pages" />);
    expect((screen.getByRole("switch") as HTMLInputElement).indeterminate).toBe(false);
  });

  it("stays indeterminate after a click the parent refuses", async () => {
    render(<Switch label="All" checked={false} indeterminate onChange={() => {}} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(box);
    expect(box.indeterminate).toBe(true);
    expect(box.hasAttribute("role")).toBe(false);
  });

  it("stays indeterminate when the parent changes checked but keeps it partial", async () => {
    const onChange = vi.fn();
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <Switch
          label="All"
          checked={on}
          indeterminate
          onChange={(e) => {
            onChange();
            setOn(e.target.checked);
          }}
        />
      );
    }
    render(<Harness />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(box.checked).toBe(true);
    expect(box.indeterminate).toBe(true);
  });

  it("works uncontrolled without an onChange while indeterminate", async () => {
    render(<Switch label="All" indeterminate />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    expect(box.indeterminate).toBe(true);
  });

  it("keeps the label for screen readers only when labelHidden", () => {
    const { container } = render(<Switch label="Alert" labelHidden />);
    expect(screen.getByRole("switch", { name: "Alert" })).toBeTruthy();
    expect(container.querySelector(".switch-label")!.className).toBe(
      "switch-label switch-label-hidden",
    );
  });

  it("forwards its ref, attributes, and the caller's class", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Switch ref={ref} label="R" id="s1" name="enabled" className="master" disabled />,
    );
    expect(ref.current).toBe(screen.getByRole("switch"));
    expect(ref.current!.id).toBe("s1");
    expect(ref.current!.name).toBe("enabled");
    expect(ref.current!.disabled).toBe(true);
    expect(container.querySelector("label")!.className).toBe("switch master");
  });

  it("keeps its fixed type, role, and class over conflicting caller attributes", () => {
    const loose = { type: "text", role: "button", className: undefined } as object;
    render(<Switch label="F" {...loose} />);
    const control = screen.getByRole("switch", { name: "F" });
    expect(control.getAttribute("type")).toBe("checkbox");
    expect(control.className).toBe("switch-input");
  });
});

describe("switch.css", () => {
  const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
  const coarse = css.slice(css.indexOf("@media (pointer: coarse)"));
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  const rem = (body: string, prop: string) =>
    Number(new RegExp(`${prop}: (-?[\\d.]+)rem`).exec(body)![1]) * 16;

  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("hides the native checkbox and a hidden label without removing them", () => {
    for (const selector of [":where(.switch-input)", ":where(.switch-label-hidden)"]) {
      const body = ruleBody(css, selector);
      expect(body, selector).toContain("position: absolute");
      expect(body, selector).toContain("clip-path: inset(50%)");
      expect(body, selector).not.toContain("display: none");
    }
    expect(ruleBody(css, ":where(.switch-input)")).toContain("opacity: 0");
  });

  it("centres the knob with equal gaps off, indeterminate, and on", () => {
    const track = ruleBody(css, ":where(.switch-track)");
    const knob = ruleBody(css, ":where(.switch-track)::before");
    expect(track).toContain("box-sizing: border-box");
    expect(track).toMatch(/border: 1px solid/);
    const inside = rem(track, "width") - 2;
    const insideHeight = rem(track, "height") - 2;
    const size = rem(knob, "width");
    const inset = rem(knob, "left");
    expect(rem(knob, "height")).toBe(size);
    expect(rem(knob, "top")).toBe(inset);
    expect(insideHeight - size - inset).toBe(inset);
    const shift = (selector: string) =>
      Number(/translateX\(([\d.]+)rem\)/.exec(ruleBody(css, selector))![1]) * 16;
    const on = shift(":where(.switch-input:checked + .switch-track)::before");
    const half = shift(":where(.switch-input:indeterminate + .switch-track)::before");
    expect(inside - size - inset - on).toBe(inset);
    expect(half * 2).toBe(on);
  });

  it("fills on and indeterminate tracks with the accent and draws the knob in its contrast colour", () => {
    expect(
      ruleBody(
        css,
        ":where(.switch-input:checked + .switch-track),\n:where(.switch-input:indeterminate + .switch-track)",
      ),
    ).toContain("background: var(--accent)");
    for (const state of ["checked", "indeterminate"]) {
      expect(ruleBody(css, `:where(.switch-input:${state} + .switch-track)::before`)).toContain(
        "background: var(--on-accent)",
      );
    }
  });

  it("draws the off track as a --text-h outline and knob on the surface", () => {
    const track = ruleBody(css, ":where(.switch-track)");
    expect(track).toContain("border: 1px solid var(--text-h)");
    expect(track).toContain("background: transparent");
    expect(ruleBody(css, ":where(.switch-track)::before")).toContain("background: var(--text-h)");
    expect(css).not.toMatch(/border-color: var\(--accent\)/);
  });

  it("shows focus with --text-h and dims a disabled track without :has()", () => {
    expect(ruleBody(css, ":where(.switch-input:focus-visible + .switch-track)")).toContain(
      "outline: 2px solid var(--text-h)",
    );
    expect(ruleBody(css, ":where(.switch-input:disabled + .switch-track)")).toContain(
      "opacity: 0.5",
    );
    expect(ruleBody(css, ":where(.switch:has(.switch-input:disabled))")).toContain(
      "cursor: not-allowed",
    );
  });

  it("draws with system colours in forced-colors mode", () => {
    const track = ruleBody(forced, ":where(.switch-track)");
    expect(track).toContain("forced-color-adjust: none");
    expect(track).toContain("border-color: CanvasText");
    expect(ruleBody(forced, ":where(.switch-track)::before")).toContain("background: CanvasText");
    expect(
      ruleBody(
        forced,
        ":where(.switch-input:checked + .switch-track),\n  :where(.switch-input:indeterminate + .switch-track)",
      ),
    ).toContain("background: Highlight");
    expect(
      ruleBody(
        forced,
        ":where(.switch-input:checked + .switch-track)::before,\n  :where(.switch-input:indeterminate + .switch-track)::before",
      ),
    ).toContain("background: HighlightText");
    expect(ruleBody(forced, ":where(.switch-input:disabled + .switch-track)")).toContain(
      "border-color: GrayText",
    );
    expect(ruleBody(forced, ":where(.switch-input:disabled + .switch-track)::before")).toContain(
      "background: GrayText",
    );
  });

  it("meets the 24px target everywhere and 44px on coarse pointers", () => {
    expect(ruleBody(css, ":where(.switch)")).toContain("min-height: 1.5rem");
    const touch = ruleBody(coarse, ":where(.switch)");
    expect(touch).toContain("min-height: 2.75rem");
    expect(touch).toContain("min-width: 2.75rem");
  });

  it("drops the track and knob animations for reduced motion", () => {
    expect(ruleBody(reduced, ":where(.switch-track),\n  :where(.switch-track)::before")).toContain(
      "transition: none",
    );
  });
});
