// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { Tabs, type TabsProps } from "./Tabs";

const css = readFileSync(resolve(__dirname, "tabs.css"), "utf8");

const TABS = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
  { id: "three", label: "Three" },
] as const;

type Id = (typeof TABS)[number]["id"];

afterEach(cleanup);

function tabs() {
  return screen.getAllByRole("tab");
}

function panel() {
  return screen.getByRole("tabpanel");
}

function Controlled(props: Partial<TabsProps<Id>> & { start?: Id }) {
  const { start = "one", ...rest } = props;
  const [value, setValue] = useState<Id>(start);
  return (
    <Tabs tabs={TABS} label="Sections" {...rest} value={value} onChange={setValue}>
      Content {value}
    </Tabs>
  );
}

function key(el: Element, k: string) {
  return fireEvent.keyDown(el, { key: k });
}

describe("Tabs", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "Tabs.tsx"), "utf8");
    expect(source).toContain('import "./tabs.css"');
  });

  it("renders a labelled tab list and a panel labelled by the selected tab", () => {
    render(<Controlled start="two" />);
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list.className).toBe("tabs-list");
    expect(list.parentElement!.className).toBe("tabs");
    expect(tabs().map((t) => t.textContent)).toEqual(["One", "Two", "Three"]);
    for (const t of tabs()) {
      expect(t.tagName).toBe("BUTTON");
      expect(t.getAttribute("type")).toBe("button");
      expect(t.className).toBe("tabs-tab");
    }
    expect(tabs().map((t) => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    expect(tabs()[1].getAttribute("aria-controls")).toBe(panel().id);
    expect(tabs()[0].hasAttribute("aria-controls")).toBe(false);
    expect(tabs()[2].hasAttribute("aria-controls")).toBe(false);
    expect(panel().getAttribute("aria-labelledby")).toBe(tabs()[1].id);
    expect(screen.getByRole("tabpanel", { name: "Two" })).toBe(panel());
    expect(panel().tabIndex).toBe(0);
    expect(panel().className).toBe("tabs-panel");
    expect(panel().textContent).toBe("Content two");
    expect(new Set(tabs().map((t) => t.id)).size).toBe(3);
    expect(tabs()[0].id).not.toBe("");
    expect(panel().id).not.toBe("");
  });

  it("gives two tab sets distinct ids", () => {
    render(
      <>
        <Controlled />
        <Controlled />
      </>,
    );
    const ids = screen.getAllByRole("tab").map((t) => t.id);
    expect(new Set(ids).size).toBe(6);
    const panels = screen.getAllByRole("tabpanel").map((el) => el.id);
    expect(new Set(panels).size).toBe(2);
  });

  it("selects a tab on click", () => {
    render(<Controlled />);
    fireEvent.click(tabs()[2]);
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
    expect(panel().textContent).toBe("Content three");
  });

  it("moves and selects with the arrow keys, wrapping at the ends", () => {
    render(<Controlled />);
    tabs()[0].focus();
    key(tabs()[0], "ArrowRight");
    expect(document.activeElement).toBe(tabs()[1]);
    expect(panel().textContent).toBe("Content two");
    key(tabs()[1], "ArrowLeft");
    expect(document.activeElement).toBe(tabs()[0]);
    key(tabs()[0], "ArrowLeft");
    expect(document.activeElement).toBe(tabs()[2]);
    expect(panel().textContent).toBe("Content three");
    key(tabs()[2], "ArrowRight");
    expect(document.activeElement).toBe(tabs()[0]);
    expect(panel().textContent).toBe("Content one");
  });

  it("jumps to the ends with Home and End", () => {
    render(<Controlled start="two" />);
    key(tabs()[1], "End");
    expect(document.activeElement).toBe(tabs()[2]);
    expect(panel().textContent).toBe("Content three");
    key(tabs()[2], "Home");
    expect(document.activeElement).toBe(tabs()[0]);
    expect(panel().textContent).toBe("Content one");
  });

  it("prevents the default only for the keys it handles", () => {
    render(<Controlled />);
    for (const k of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
      expect(key(tabs()[0], k), k).toBe(false);
    }
    const onChange = vi.fn();
    cleanup();
    render(<Tabs tabs={TABS} label="Sections" value="one" onChange={onChange} />);
    for (const k of ["ArrowDown", "ArrowUp", "Enter", "a", "Tab"]) {
      expect(key(tabs()[0], k), k).toBe(true);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("mirrors the arrow keys in right-to-left text", () => {
    render(
      <div dir="rtl">
        <Controlled />
      </div>,
    );
    key(tabs()[0], "ArrowLeft");
    expect(panel().textContent).toBe("Content two");
    key(tabs()[1], "ArrowRight");
    expect(panel().textContent).toBe("Content one");
  });

  it("keeps the first tab reachable when no tab matches the value", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} label="Sections" value={"none" as Id} onChange={onChange} />);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    expect(tabs().every((t) => t.getAttribute("aria-selected") === "false")).toBe(true);
    expect(panel().hasAttribute("aria-labelledby")).toBe(false);
    key(tabs()[0], "ArrowRight");
    expect(onChange).toHaveBeenCalledWith("two");
  });

  it("reports the id of the tab reached", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} label="Sections" value="one" onChange={onChange} />);
    fireEvent.click(tabs()[1]);
    expect(onChange).toHaveBeenLastCalledWith("two");
    key(tabs()[0], "End");
    expect(onChange).toHaveBeenLastCalledWith("three");
  });

  it("does not report the tab that is already selected", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} label="Sections" value="one" onChange={onChange} />);
    fireEvent.click(tabs()[0]);
    key(tabs()[0], "Home");
    expect(document.activeElement).toBe(tabs()[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("leaves modified arrow keys to the browser", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} label="Sections" value="one" onChange={onChange} />);
    for (const mod of ["altKey", "ctrlKey", "metaKey"]) {
      expect(fireEvent.keyDown(tabs()[0], { key: "ArrowRight", [mod]: true }), mod).toBe(true);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes other props to the wrapper and appends a caller's class", () => {
    render(<Controlled id="sections" className="wide" data-testid="wrap" />);
    const wrap = screen.getByTestId("wrap");
    expect(wrap.id).toBe("sections");
    expect(wrap.className).toBe("tabs wide");
  });
});

describe("tabs.css", () => {
  const selectedRule = ':where(.tabs-tab[aria-selected="true"])';

  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("wraps the tab list with a gap", () => {
    const body = ruleBody(css, ":where(.tabs-list)");
    expect(body).toContain("display: flex");
    expect(body).toContain("flex-wrap: wrap");
    expect(body).toContain("gap: 0.5rem");
  });

  it("gives each tab a 24px target and 44px on coarse pointers", () => {
    expect(ruleBody(css, ":where(.tabs-tab)")).toContain("min-height: 1.5rem");
    const coarse = ruleBody(
      css.slice(css.indexOf("@media (pointer: coarse)")),
      ":where(.tabs-tab)",
    );
    expect(coarse).toContain("min-height: 2.75rem");
  });

  it("outlines each tab in the heading colour and drops the double-tap delay", () => {
    const body = ruleBody(css, ":where(.tabs-tab)");
    expect(body).toContain("border: 1px solid var(--text-h)");
    expect(body).toContain("cursor: pointer");
    expect(body).toContain("touch-action: manipulation");
  });

  it("brightens a tab on hover", () => {
    expect(ruleBody(css, ":where(.tabs-tab:hover)")).toContain("filter: brightness(1.12)");
  });

  it("shows keyboard focus on tabs and the panel", () => {
    const body = ruleBody(css, ":where(.tabs-tab:focus-visible, .tabs-panel:focus-visible)");
    expect(body).toContain("outline: 2px solid var(--text-h)");
    expect(body).toContain("outline-offset: 2px");
  });

  it("marks the selected tab with a thicker bottom border at the same size", () => {
    const body = ruleBody(css, selectedRule);
    expect(body).toContain("border-bottom-width: 4px");
    expect(body).toContain("padding-bottom: calc(0.25rem - 3px)");
    expect(body).toContain("background: var(--panel)");
    expect(ruleBody(css, ":where(.tabs-tab)")).toContain("padding: 0.25rem 0.75rem");
  });

  it("uses the system highlight for the selected tab in forced-colors mode", () => {
    const forced = ruleBody(css.slice(css.indexOf("@media (forced-colors: active)")), selectedRule);
    expect(forced).toContain("border-color: Highlight");
  });

  it("spaces the panel from the tab list", () => {
    expect(ruleBody(css, ":where(.tabs-panel)")).toContain("margin-top: 1rem");
  });
});
