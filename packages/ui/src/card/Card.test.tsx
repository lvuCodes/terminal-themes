// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { Card } from "./Card";

const css = readFileSync(resolve(__dirname, "card.css"), "utf8");

afterEach(cleanup);

describe("Card", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "Card.tsx"), "utf8");
    expect(source).toContain('import "./card.css"');
  });

  it("renders a section named by its heading", () => {
    render(<Card heading="Swatches">Body</Card>);
    const region = screen.getByRole("region", { name: "Swatches" });
    expect(region.tagName).toBe("SECTION");
    expect(region.className).toBe("card");
    const heading = screen.getByRole("heading", { name: "Swatches", level: 2 });
    expect(heading.className).toBe("card-heading");
    expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(region.firstElementChild).toBe(heading);
    expect(region.textContent).toBe("SwatchesBody");
  });

  it("gives each card its own heading id", () => {
    render(
      <>
        <Card heading="A">1</Card>
        <Card heading="B">2</Card>
      </>,
    );
    const [a, b] = screen.getAllByRole("heading");
    expect(a.id).not.toBe(b.id);
  });

  it("uses the requested heading level", () => {
    render(
      <Card heading="Nested" headingLevel={4}>
        Body
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Nested", level: 4 }).tagName).toBe("H4");
  });

  it("renders no heading or label when none is given", () => {
    const { container } = render(<Card>Body only</Card>);
    const section = container.querySelector("section")!;
    expect(section.hasAttribute("aria-labelledby")).toBe(false);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(section.textContent).toBe("Body only");
  });

  it("treats null and false headings as absent", () => {
    const { container } = render(
      <>
        <Card heading={null}>x</Card>
        <Card heading={false}>y</Card>
      </>,
    );
    expect(screen.queryByRole("heading")).toBeNull();
    for (const s of container.querySelectorAll("section")) {
      expect(s.hasAttribute("aria-labelledby")).toBe(false);
    }
  });

  it("renders a 0 heading, since it is real content", () => {
    render(<Card heading={0}>x</Card>);
    expect(screen.getByRole("heading", { name: "0" })).toBeTruthy();
  });

  it("keeps a caller's class, attributes, and ref", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card ref={ref} className="wide" id="c1" data-kind="demo">
        x
      </Card>,
    );
    expect(ref.current!.className).toBe("card wide");
    expect(ref.current!.id).toBe("c1");
    expect(ref.current!.dataset.kind).toBe("demo");
  });

  it("lets a caller's aria-labelledby win over the heading", () => {
    const { container } = render(
      <>
        <span id="ext">External</span>
        <Card heading="Inner" aria-labelledby="ext">
          x
        </Card>
      </>,
    );
    expect(container.querySelector("section")!.getAttribute("aria-labelledby")).toBe("ext");
    expect(screen.getByRole("region", { name: "External" })).toBeTruthy();
  });
});

describe("card.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("draws a bordered panel-coloured surface", () => {
    const card = ruleBody(css, ":where(.card)");
    expect(card).toContain("border: 1px solid var(--border)");
    expect(card).toContain("border-radius: 8px");
    expect(card).toContain("background: var(--panel)");
    expect(card).toContain("padding: 1rem");
    expect(card).toContain("box-sizing: border-box");
    expect(card).toContain("max-width: 100%");
    expect(card).toContain("overflow-wrap: anywhere");
    expect(card).not.toContain("margin");
  });

  it("colours the heading with the heading token and drops its top margin", () => {
    const heading = ruleBody(css, ":where(.card-heading)");
    expect(heading).toContain("color: var(--text-h)");
    expect(heading).toContain("margin-top: 0");
  });

  it("keeps the border visible in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(ruleBody(forced, ":where(.card)")).toContain("border-color: CanvasText");
  });
});
