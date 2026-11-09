// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { NumberStepper, type NumberStepperProps } from "./NumberStepper";

const css = readFileSync(resolve(__dirname, "number-stepper.css"), "utf8");

afterEach(cleanup);

function minus() {
  return screen.getAllByRole("button")[0];
}

function plus() {
  return screen.getAllByRole("button")[1];
}

function count() {
  return document.querySelector<HTMLElement>(".number-stepper-value")!;
}

function live() {
  return screen.getByRole("status");
}

// jumps renders, after the stepper, one "Set n" button per value, so a test can
// change the value from outside without remounting the stepper.
function Controlled(
  props: Omit<NumberStepperProps, "value" | "onChange"> & { start?: number; jumps?: number[] },
) {
  const { start = 0, jumps = [], ...rest } = props;
  const [value, setValue] = useState(start);
  return (
    <>
      <NumberStepper {...rest} value={value} onChange={setValue} />
      {jumps.map((n) => (
        <button key={n} type="button" onClick={() => setValue(n)}>
          Set {n}
        </button>
      ))}
    </>
  );
}

function jump(n: number) {
  fireEvent.click(screen.getByRole("button", { name: `Set ${n}` }));
}

describe("NumberStepper", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "NumberStepper.tsx"), "utf8");
    expect(source).toContain('import "./number-stepper.css"');
  });

  it("renders a labelled group of minus, count, and plus", () => {
    render(<NumberStepper label="Boxes" value={2} onChange={() => {}} />);
    const group = screen.getByRole("group", { name: "Boxes" });
    expect(group.className).toBe("number-stepper");
    expect([...group.children].map((el) => el.tagName)).toEqual([
      "BUTTON",
      "SPAN",
      "BUTTON",
      "SPAN",
    ]);
    expect(group.hasAttribute("aria-disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Decrease Boxes" })).toBe(minus());
    expect(screen.getByRole("button", { name: "Increase Boxes" })).toBe(plus());
    expect(minus().textContent).toBe("−");
    expect(plus().textContent).toBe("+");
    for (const b of [minus(), plus()]) {
      expect(b.getAttribute("type")).toBe("button");
      expect(b.className).toBe("number-stepper-button");
      expect(b.hasAttribute("aria-disabled")).toBe(false);
      expect((b as HTMLButtonElement).disabled).toBe(false);
      expect(b.getAttribute("aria-describedby")).toBe(count().id);
    }
    expect(count().id).not.toBe("");
    expect(
      screen.getByRole("button", { name: "Increase Boxes" }).getAttribute("aria-describedby"),
    ).toBe(count().id);
    expect(count().textContent).toBe("2");
    expect(count().className).toBe("number-stepper-value");
    expect(count().getAttribute("role")).toBeNull();
    expect(live().className).toBe("number-stepper-live");
    expect(live().textContent).toBe("");
  });

  it("steps by one in each direction", () => {
    render(<Controlled label="Boxes" start={1} />);
    fireEvent.click(plus());
    fireEvent.click(plus());
    expect(count().textContent).toBe("3");
    fireEvent.click(minus());
    expect(count().textContent).toBe("2");
  });

  it("stops at min and max, keeping the bound button focusable", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NumberStepper label="Boxes" value={0} min={0} max={3} onChange={onChange} />,
    );
    expect(minus().getAttribute("aria-disabled")).toBe("true");
    expect((minus() as HTMLButtonElement).disabled).toBe(false);
    expect(plus().hasAttribute("aria-disabled")).toBe(false);
    fireEvent.click(minus());
    expect(onChange).not.toHaveBeenCalled();
    rerender(<NumberStepper label="Boxes" value={3} min={0} max={3} onChange={onChange} />);
    expect(plus().getAttribute("aria-disabled")).toBe("true");
    expect(minus().hasAttribute("aria-disabled")).toBe(false);
    fireEvent.click(plus());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps focus on a button that reaches its bound", () => {
    render(<Controlled label="Boxes" start={1} />);
    minus().focus();
    fireEvent.click(minus());
    expect(count().textContent).toBe("0");
    expect((minus() as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(minus());
  });

  it("clamps a step that would pass a bound", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NumberStepper label="Boxes" value={8} max={10} step={5} onChange={onChange} />,
    );
    fireEvent.click(plus());
    expect(onChange).toHaveBeenLastCalledWith(10);
    rerender(<NumberStepper label="Boxes" value={3} min={1} step={5} onChange={onChange} />);
    fireEvent.click(minus());
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("pulls a value above max back to max from the minus button", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Boxes" value={20} max={10} step={1} onChange={onChange} />);
    expect(plus().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(minus());
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("lifts a value below min back to min from the plus button", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Boxes" value={-4} min={0} onChange={onChange} />);
    expect(minus().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(plus());
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("allows negative values when min is lowered", () => {
    render(<Controlled label="Offset" min={-2} />);
    fireEvent.click(minus());
    fireEvent.click(minus());
    expect(count().textContent).toBe("-2");
    expect(minus().getAttribute("aria-disabled")).toBe("true");
  });

  it("rounds fractional steps to the step's precision", () => {
    render(<Controlled label="Scale" step={0.1} />);
    fireEvent.click(plus());
    fireEvent.click(plus());
    fireEvent.click(plus());
    expect(count().textContent).toBe("0.3");
  });

  it("snaps a finer value to the step's precision", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Scale" value={0.3000000004} step={0.1} onChange={onChange} />);
    expect(count().textContent).toBe("0.3");
    fireEvent.click(plus());
    expect(onChange).toHaveBeenCalledWith(0.4);
  });

  it("reads exponent notation in a tiny step", () => {
    render(<Controlled label="Tiny" step={1e-7} />);
    fireEvent.click(plus());
    expect(count().textContent).toBe("0.0000001");
  });

  it("treats a huge whole-number step as having no decimal places", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Huge" value={0} step={1e21} onChange={onChange} />);
    expect(count().textContent).toBe("0");
    fireEvent.click(plus());
    expect(onChange).toHaveBeenCalledWith(1e21);
    cleanup();
    render(
      <NumberStepper
        label="Huge"
        value={0}
        min={-1e22}
        max={1e22}
        step={1e21}
        onChange={() => {}}
      />,
    );
    expect(count().textContent).toBe("0");
  });

  it("announces only its own presses, with the label", () => {
    render(<Controlled label="Boxes" start={1} jumps={[5, 1]} />);
    fireEvent.click(plus());
    expect(live().textContent).toBe("Boxes 2");
    fireEvent.click(minus());
    expect(live().textContent).toBe("Boxes 1");
    jump(5);
    expect(count().textContent).toBe("5");
    expect(live().textContent).toBe("");
    jump(1);
    expect(count().textContent).toBe("1");
    expect(live().textContent).toBe("");
  });

  it("announces the clamped value after a press past a bound", () => {
    render(<Controlled label="Boxes" start={8} max={10} step={5} />);
    fireEvent.click(plus());
    expect(live().textContent).toBe("Boxes 10");
  });

  it("announces fractional values at the step's precision", () => {
    render(<Controlled label="Scale" step={0.1} />);
    fireEvent.click(plus());
    fireEvent.click(plus());
    fireEvent.click(plus());
    expect(live().textContent).toBe("Scale 0.3");
  });

  it("announces a press that the caller applies later", () => {
    vi.useFakeTimers();
    function Later() {
      const [value, setValue] = useState(1);
      return (
        <NumberStepper
          label="Boxes"
          value={value}
          onChange={(n) => setTimeout(() => setValue(n), 10)}
        />
      );
    }
    try {
      render(<Later />);
      fireEvent.click(plus());
      expect(live().textContent).toBe("");
      act(() => vi.runAllTimers());
      expect(count().textContent).toBe("2");
      expect(live().textContent).toBe("Boxes 2");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays silent when the caller rejects a press", () => {
    render(<NumberStepper label="Boxes" value={1} onChange={() => {}} />);
    fireEvent.click(plus());
    expect(live().textContent).toBe("");
  });

  it("stays silent when the value changes from outside", () => {
    const { rerender } = render(<NumberStepper label="Boxes" value={1} onChange={() => {}} />);
    rerender(<NumberStepper label="Boxes" value={0} onChange={() => {}} />);
    expect(live().textContent).toBe("");
  });

  it("keeps both buttons focusable but inert when disabled", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Boxes" value={2} disabled onChange={onChange} />);
    for (const b of [minus(), plus()]) {
      expect((b as HTMLButtonElement).disabled).toBe(false);
      expect(b.getAttribute("aria-disabled")).toBe("true");
    }
    plus().focus();
    fireEvent.click(plus());
    fireEvent.click(minus());
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(plus());
    expect(screen.getByRole("group").getAttribute("aria-disabled")).toBe("true");
  });

  it("uses a caller's button names", () => {
    render(
      <NumberStepper
        label="Boxes"
        decrementLabel="One fewer box"
        incrementLabel="One more box"
        value={1}
        onChange={() => {}}
      />,
    );
    expect(minus().getAttribute("aria-label")).toBe("One fewer box");
    expect(plus().getAttribute("aria-label")).toBe("One more box");
  });

  it("passes other props to the group and appends a caller's class", () => {
    render(
      <>
        <span id="boxes-label">Box count</span>
        <NumberStepper
          label="Boxes"
          id="boxes"
          className="wide"
          aria-labelledby="boxes-label"
          value={1}
          onChange={() => {}}
        />
      </>,
    );
    const group = screen.getByRole("group", { name: "Box count" });
    expect(group.id).toBe("boxes");
    expect(group.className).toBe("number-stepper wide");
  });

  it("lets a caller's aria-label rename the group", () => {
    render(<NumberStepper label="Boxes" aria-label="Box count" value={1} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Box count" })).toBeTruthy();
    expect(plus().getAttribute("aria-label")).toBe("Increase Boxes");
  });

  it("treats a value that rounds onto a bound as at that bound", () => {
    render(
      <NumberStepper label="Scale" value={0.2999999} max={0.3} step={0.1} onChange={() => {}} />,
    );
    expect(count().textContent).toBe("0.3");
    expect(plus().getAttribute("aria-disabled")).toBe("true");
    cleanup();
    render(<NumberStepper label="Scale" value={0.0000001} step={0.1} onChange={() => {}} />);
    expect(minus().getAttribute("aria-disabled")).toBe("true");
  });

  it("shows a bound with more decimals than the step", () => {
    render(<Controlled label="Boxes" start={10} max={10.5} />);
    expect(count().textContent).toBe("10.0");
    fireEvent.click(plus());
    expect(count().textContent).toBe("10.5");
    expect(live().textContent).toBe("Boxes 10.5");
    cleanup();
    render(<Controlled label="Boxes" start={1} min={0.5} />);
    fireEvent.click(minus());
    expect(count().textContent).toBe("0.5");
  });

  it("renders a NaN value as a blank count without crashing", () => {
    render(<NumberStepper label="Boxes" value={NaN} onChange={() => {}} />);
    expect(count().textContent).toBe("");
  });

  it("caps decimal places at 100 for a step finer than toFixed allows", () => {
    render(<NumberStepper label="Tiny" value={0} step={1e-101} onChange={() => {}} />);
    expect(count().textContent).toBe((0).toFixed(100));
  });

  it("keeps the group's disabled state over a caller's aria-disabled", () => {
    const props = { "aria-disabled": false } as NumberStepperProps;
    render(<NumberStepper {...props} label="Boxes" value={1} disabled onChange={() => {}} />);
    expect(screen.getByRole("group").getAttribute("aria-disabled")).toBe("true");
  });

  it("defaults min to 0", () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Boxes" value={0} onChange={onChange} />);
    expect(minus().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(minus());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the group role even when a caller passes another", () => {
    const props = { role: "toolbar" } as unknown as NumberStepperProps;
    render(<NumberStepper {...props} label="Boxes" value={1} onChange={() => {}} />);
    expect(screen.getByRole("group")).toBeTruthy();
  });

  it("reserves the width of the longest of min, max, and value", () => {
    const chars = () => count().style.getPropertyValue("--number-stepper-chars");
    const { rerender } = render(
      <NumberStepper label="Boxes" value={5} max={100} onChange={() => {}} />,
    );
    expect(chars()).toBe("3");
    rerender(<NumberStepper label="Boxes" value={5} min={-1000} max={9} onChange={() => {}} />);
    expect(chars()).toBe("5");
    rerender(<NumberStepper label="Boxes" value={12345} onChange={() => {}} />);
    expect(chars()).toBe("5");
    rerender(<NumberStepper label="Boxes" value={0} max={1} step={0.1} onChange={() => {}} />);
    expect(chars()).toBe("3");
  });

  it("reserves two characters by default, or a caller's digits, when max is unbounded", () => {
    const chars = () => count().style.getPropertyValue("--number-stepper-chars");
    const { rerender } = render(<NumberStepper label="Boxes" value={7} onChange={() => {}} />);
    expect(chars()).toBe("2");
    rerender(
      <NumberStepper label="Boxes" value={7} digits={4} min={-Infinity} onChange={() => {}} />,
    );
    expect(chars()).toBe("4");
  });
});

describe("number-stepper.css", () => {
  const off = ':where(.number-stepper-button[aria-disabled="true"])';

  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("gives each button at least a 24px target and 44px on coarse pointers", () => {
    const body = ruleBody(css, ":where(.number-stepper-button)");
    expect(body).toContain("min-width: 1.5rem");
    expect(body).toContain("min-height: 1.5rem");
    const coarse = ruleBody(
      css.slice(css.indexOf("@media (pointer: coarse)")),
      ":where(.number-stepper-button)",
    );
    expect(coarse).toContain("min-width: 2.75rem");
    expect(coarse).toContain("min-height: 2.75rem");
  });

  it("brightens on hover, but not when dimmed", () => {
    expect(ruleBody(css, ":where(.number-stepper-button:hover)")).toContain(
      "filter: brightness(1.12)",
    );
    expect(ruleBody(css, off)).toContain("filter: none");
  });

  it("drops the double-tap zoom delay on the buttons", () => {
    expect(ruleBody(css, ":where(.number-stepper-button)")).toContain("touch-action: manipulation");
  });

  it("spaces the parts and shows a pointer cursor", () => {
    expect(ruleBody(css, ":where(.number-stepper)")).toContain("gap: 0.5rem");
    expect(ruleBody(css, ":where(.number-stepper-button)")).toContain("cursor: pointer");
    expect(ruleBody(css, ":where(.number-stepper-button:focus-visible)")).toContain(
      "outline-offset: 2px",
    );
  });

  it("dims the count of a disabled stepper", () => {
    const sel = ':where(.number-stepper[aria-disabled="true"] .number-stepper-value)';
    expect(ruleBody(css, sel)).toContain("opacity: 0.5");
    const forced = ruleBody(css.slice(css.indexOf("@media (forced-colors: active)")), sel);
    expect(forced).toContain("color: GrayText");
    expect(forced).toContain("opacity: 1");
  });

  it("hides the live line visually but keeps it in the accessibility tree", () => {
    const body = ruleBody(css, ":where(.number-stepper-live)");
    expect(body).toContain("position: absolute");
    expect(body).toContain("clip-path: inset(50%)");
    expect(body).toContain("overflow: hidden");
    expect(body).not.toContain("display: none");
  });

  it("outlines each button in the heading colour for 3:1 contrast", () => {
    expect(ruleBody(css, ":where(.number-stepper-button)")).toContain(
      "border: 1px solid var(--text-h)",
    );
  });

  it("shows keyboard focus in the heading colour", () => {
    expect(ruleBody(css, ":where(.number-stepper-button:focus-visible)")).toContain(
      "outline: 2px solid var(--text-h)",
    );
  });

  it("dims a button at its bound or disabled, with a not-allowed cursor", () => {
    const body = ruleBody(css, off);
    expect(body).toContain("opacity: 0.5");
    expect(body).toContain("cursor: not-allowed");
  });

  it("uses system colours in forced-colors mode", () => {
    const body = ruleBody(css.slice(css.indexOf("@media (forced-colors: active)")), off);
    expect(body).toContain("color: GrayText");
    expect(body).toContain("border-color: GrayText");
    expect(body).toContain("opacity: 1");
  });

  it("reserves the count's width with tabular digits", () => {
    const body = ruleBody(css, ":where(.number-stepper-value)");
    expect(body).toContain("min-width: calc(var(--number-stepper-chars, 2) * 1ch)");
    expect(body).toContain("font-variant-numeric: tabular-nums");
    expect(body).toContain("text-align: center");
    expect(ruleBody(css, ":where(.number-stepper)")).toContain("display: inline-flex");
  });
});
