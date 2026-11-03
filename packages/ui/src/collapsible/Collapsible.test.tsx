// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { Collapsible } from "./Collapsible";

const css = readFileSync(resolve(__dirname, "collapsible.css"), "utf8");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function details() {
  return document.querySelector("details")!;
}

// jsdom does not toggle <details> on a summary click, so a user toggle is the
// DOM state change followed by the toggle event the browser fires.
function userToggle(open: boolean) {
  details().open = open;
  fireEvent(details(), new Event("toggle"));
}

describe("Collapsible", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "Collapsible.tsx"), "utf8");
    expect(source).toContain('import "./collapsible.css"');
  });

  it("renders a native details with the summary and body", () => {
    render(<Collapsible summary="Filters">Body text</Collapsible>);
    expect(details().className).toBe("collapsible");
    expect(screen.getByText("Filters").tagName).toBe("SUMMARY");
    expect(screen.getByText("Body text").className).toBe("collapsible-body");
    expect(details().open).toBe(false);
  });

  it("keeps a caller's own class beside the shared one", () => {
    render(
      <Collapsible summary="S" className="wide">
        B
      </Collapsible>,
    );
    expect(details().className).toBe("collapsible wide");
  });

  it("starts open with defaultOpen and reports user toggles", () => {
    const onToggle = vi.fn();
    render(
      <Collapsible summary="S" defaultOpen onToggle={onToggle}>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(true);
    userToggle(false);
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(details().open).toBe(false);
  });

  it("ignores the toggle event React's own open update fires", () => {
    const onToggle = vi.fn();
    render(
      <Collapsible summary="S" open onToggle={onToggle}>
        B
      </Collapsible>,
    );
    fireEvent(details(), new Event("toggle"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("follows the open prop when controlled and does not persist", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <Collapsible summary="S" open={false} storageKey="k" onToggle={onToggle}>
        B
      </Collapsible>,
    );
    userToggle(true);
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(localStorage.getItem("k")).toBeNull();
    rerender(
      <Collapsible summary="S" open storageKey="k" onToggle={onToggle}>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(true);
    rerender(
      <Collapsible summary="S" open={false} storageKey="k" onToggle={onToggle}>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(false);
  });

  it("opens from the open prop alone, without defaultOpen", () => {
    render(
      <Collapsible summary="S" open>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(true);
  });

  it("remembers the open state under storageKey", () => {
    const first = render(
      <Collapsible summary="S" storageKey="filters-open">
        B
      </Collapsible>,
    );
    userToggle(true);
    expect(localStorage.getItem("filters-open")).toBe("1");
    first.unmount();
    render(
      <Collapsible summary="S" storageKey="filters-open">
        B
      </Collapsible>,
    );
    expect(details().open).toBe(true);
  });

  it("restores a stored closed state over defaultOpen", () => {
    localStorage.setItem("k", "0");
    render(
      <Collapsible summary="S" storageKey="k" defaultOpen>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(false);
  });

  it("still works when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    render(
      <Collapsible summary="S" storageKey="k" defaultOpen>
        B
      </Collapsible>,
    );
    expect(details().open).toBe(true);
    userToggle(false);
    expect(details().open).toBe(false);
  });
});

describe("collapsible.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("hides the native marker and draws a chevron in the text colour", () => {
    expect(ruleBody(css, ":where(.collapsible-summary)")).toContain("list-style: none");
    expect(ruleBody(css, ":where(.collapsible-summary)::-webkit-details-marker")).toContain(
      "display: none",
    );
    const chevron = ruleBody(css, ":where(.collapsible-summary)::before");
    expect(chevron).toContain("border-right: 2px solid currentcolor");
    expect(chevron).toContain("border-bottom: 2px solid currentcolor");
    expect(chevron).toContain("transform: rotate(-45deg)");
  });

  it("turns the chevron down when open", () => {
    expect(ruleBody(css, ":where(.collapsible[open] > .collapsible-summary)::before")).toContain(
      "transform: rotate(45deg)",
    );
  });

  it("shows keyboard focus on the summary", () => {
    expect(ruleBody(css, ":where(.collapsible-summary:focus-visible)")).toContain(
      "outline: 2px solid var(--accent)",
    );
  });

  it("drops the chevron animation for reduced motion", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("transition: none");
  });
});
