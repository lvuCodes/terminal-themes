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
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("hides the native checkbox without removing it", () => {
    const input = ruleBody(css, ":where(.switch-input)");
    expect(input).toContain("opacity: 0");
    expect(input).toContain("clip-path: inset(50%)");
    expect(input).not.toContain("display: none");
  });

  it("moves the knob right when on and to the centre when indeterminate", () => {
    expect(ruleBody(css, ":where(.switch-input:checked + .switch-track)::before")).toContain(
      "transform: translateX(1rem)",
    );
    expect(ruleBody(css, ":where(.switch-input:indeterminate + .switch-track)::before")).toContain(
      "transform: translateX(0.5rem)",
    );
  });

  it("fills the on track with the accent and its contrast colour", () => {
    expect(ruleBody(css, ":where(.switch-input:checked + .switch-track)")).toContain(
      "background: var(--accent)",
    );
    expect(ruleBody(css, ":where(.switch-input:checked + .switch-track)::before")).toContain(
      "background: var(--on-accent)",
    );
  });

  it("outlines the off track so it shows against the panel", () => {
    expect(ruleBody(css, ":where(.switch-track)")).toContain("border: 1px solid var(--text)");
  });

  it("shows focus and disabled states", () => {
    expect(ruleBody(css, ":where(.switch-input:focus-visible + .switch-track)")).toContain(
      "outline: 2px solid var(--accent)",
    );
    const disabled = ruleBody(css, ":where(.switch:has(.switch-input:disabled))");
    expect(disabled).toContain("opacity: 0.5");
    expect(disabled).toContain("cursor: not-allowed");
  });

  it("draws with system colours in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    const track = ruleBody(forced, ":where(.switch-track)");
    expect(track).toContain("forced-color-adjust: none");
    expect(track).toContain("border-color: CanvasText");
    expect(ruleBody(forced, ":where(.switch-track)::before")).toContain("background: CanvasText");
  });

  it("gives the switch a 44px touch target on coarse pointers", () => {
    const coarse = css.slice(css.indexOf("@media (pointer: coarse)"));
    expect(ruleBody(coarse, ":where(.switch)")).toContain("min-height: 2.75rem");
  });

  it("drops the knob animation for reduced motion", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("transition: none");
  });
});
