// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { FilterBar } from "./FilterBar";
import { FilterChip } from "./FilterChip";

const css = readFileSync(resolve(__dirname, "filter-bar.css"), "utf8");

afterEach(cleanup);

describe("FilterBar", () => {
  it("imports its own skin in both components", () => {
    for (const file of ["FilterBar.tsx", "FilterChip.tsx"]) {
      const source = readFileSync(resolve(__dirname, file), "utf8");
      expect(source, file).toContain('import "./filter-bar.css"');
    }
  });

  it("groups its controls under the given name", () => {
    render(
      <FilterBar label="Font filters">
        <input aria-label="Search" />
      </FilterBar>,
    );
    const group = screen.getByRole("group", { name: "Font filters" });
    expect(group.className).toBe("filter-bar");
    expect(group.contains(screen.getByRole("textbox", { name: "Search" }))).toBe(true);
  });

  it("keeps a caller's class, attributes, and ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<FilterBar ref={ref} label="F" className="wide" id="fb" />);
    expect(ref.current!.className).toBe("filter-bar wide");
    expect(ref.current!.id).toBe("fb");
    expect(ref.current!.getAttribute("role")).toBe("group");
  });

  it("shows a clear button with the count only while filters are active", async () => {
    const onClear = vi.fn();
    const { rerender } = render(<FilterBar label="F" activeCount={0} onClear={onClear} />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<FilterBar label="F" activeCount={3} onClear={onClear} />);
    const clear = screen.getByRole("button", { name: "Clear filters (3)" });
    expect(clear.getAttribute("type")).toBe("button");
    expect(clear.className).toBe("filter-chip filter-bar-clear");
    await userEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("uses a custom clear label", () => {
    render(<FilterBar label="F" activeCount={1} onClear={() => {}} clearLabel="Reset" />);
    expect(screen.getByRole("button", { name: "Reset (1)" })).toBeTruthy();
  });

  it("shows no clear button without onClear", () => {
    render(<FilterBar label="F" activeCount={2} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces the result status, including a 0 count", () => {
    const { rerender } = render(<FilterBar label="F" />);
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<FilterBar label="F" status={0} />);
    expect(screen.getByRole("status").textContent).toBe("0");
    rerender(<FilterBar label="F" status="12 / 80 families" />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("12 / 80 families");
    expect(status.className).toBe("filter-bar-status");
  });
});

describe("FilterChip", () => {
  it("is a toggle button that reports the next pressed state", async () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <FilterChip pressed={false} onPressedChange={onPressedChange}>
        Serif
      </FilterChip>,
    );
    const chip = screen.getByRole("button", { name: "Serif", pressed: false });
    expect(chip.getAttribute("type")).toBe("button");
    expect(chip.className).toBe("filter-chip");
    await userEvent.click(chip);
    expect(onPressedChange).toHaveBeenLastCalledWith(true);
    rerender(
      <FilterChip pressed onPressedChange={onPressedChange}>
        Serif
      </FilterChip>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Serif", pressed: true }));
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("runs a caller's onClick first and honours preventDefault", async () => {
    const onPressedChange = vi.fn();
    const onClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <FilterChip pressed={false} onPressedChange={onPressedChange} onClick={onClick}>
        X
      </FilterChip>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("keeps a caller's class and does not toggle when disabled", async () => {
    const onPressedChange = vi.fn();
    render(
      <FilterChip pressed={false} onPressedChange={onPressedChange} className="mine" disabled>
        X
      </FilterChip>,
    );
    const chip = screen.getByRole("button");
    expect(chip.className).toBe("filter-chip mine");
    await userEvent.click(chip);
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});

describe("filter-bar.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("lays the bar out as one wrapping row", () => {
    const bar = ruleBody(css, ":where(.filter-bar)");
    expect(bar).toContain("display: flex");
    expect(bar).toContain("flex-wrap: wrap");
    expect(bar).toContain("align-items: center");
    expect(ruleBody(css, ":where(.filter-bar-status)")).toContain("margin-left: auto");
  });

  it("fills a pressed chip with the accent and its contrast colour", () => {
    const pressed = ruleBody(css, ':where(.filter-chip[aria-pressed="true"])');
    expect(pressed).toContain("background: var(--accent)");
    expect(pressed).toContain("color: var(--on-accent)");
  });

  it("draws a check mark on a pressed chip so state is not colour alone", () => {
    const check = ruleBody(css, ':where(.filter-chip[aria-pressed="true"])::before');
    expect(check).toContain('content: ""');
    expect(check).toContain("border-right: 2px solid currentcolor");
    expect(check).toContain("border-bottom: 2px solid currentcolor");
    expect(check).toContain("transform: rotate(45deg)");
  });

  it("shows focus, hover, and disabled states", () => {
    expect(ruleBody(css, ":where(.filter-chip:focus-visible)")).toContain(
      "outline: 2px solid var(--accent)",
    );
    expect(ruleBody(css, ":where(.filter-chip:hover)")).toContain("filter: brightness(1.12)");
    const disabled = ruleBody(css, ":where(.filter-chip:disabled)");
    expect(disabled).toContain("opacity: 0.5");
    expect(disabled).toContain("cursor: not-allowed");
  });

  it("marks the pressed chip in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(ruleBody(forced, ':where(.filter-chip[aria-pressed="true"])')).toContain(
      "border-color: Highlight",
    );
  });

  it("gives chips a 44px touch target on coarse pointers", () => {
    const coarse = css.slice(css.indexOf("@media (pointer: coarse)"));
    expect(ruleBody(coarse, ":where(.filter-chip)")).toContain("min-height: 2.75rem");
  });
});
