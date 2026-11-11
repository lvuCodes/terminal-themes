// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { AboutList, AboutPanel } from "./AboutPanel";

const css = readFileSync(resolve(__dirname, "about-panel.css"), "utf8");

const SECTIONS = [
  { title: "Purpose", content: <p>Find good days.</p> },
  { title: "Privacy", content: "Nothing leaves the browser." },
];

afterEach(cleanup);

describe("AboutPanel", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "AboutPanel.tsx"), "utf8");
    expect(source).toContain('import "./about-panel.css"');
  });

  it("renders one About region with a heading and body per section", () => {
    render(<AboutPanel sections={SECTIONS} />);
    const region = screen.getByRole("region", { name: "About" });
    expect(region.tagName).toBe("SECTION");
    expect(region.className).toBe("about-panel");
    expect(screen.getAllByRole("region")).toHaveLength(1);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Purpose", "Privacy"]);
    for (const h of headings) {
      expect(h.className).toBe("about-panel-heading");
      expect(h.hasAttribute("id")).toBe(false);
    }
    const parts = [...region.children];
    expect(parts.map((el) => el.tagName)).toEqual(["DIV", "DIV"]);
    for (const part of parts) {
      expect(part.className).toBe("about-panel-section");
      expect(part.hasAttribute("role")).toBe(false);
      expect([...part.children].map((el) => el.className)).toEqual([
        "about-panel-heading",
        "about-panel-body",
      ]);
    }
    expect(parts[0].querySelector(".about-panel-body")!.innerHTML).toBe("<p>Find good days.</p>");
    expect(parts[1].querySelector(".about-panel-body")!.textContent).toBe(
      "Nothing leaves the browser.",
    );
  });

  it("takes a caller's label and heading level", () => {
    render(<AboutPanel sections={SECTIONS} label="About Tong Shu" headingLevel={3} />);
    expect(screen.getByRole("region", { name: "About Tong Shu" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });

  it("supports heading levels 4 to 6", () => {
    for (const level of [4, 5, 6] as const) {
      render(<AboutPanel sections={SECTIONS} headingLevel={level} />);
      expect(screen.getAllByRole("heading", { level })).toHaveLength(2);
      cleanup();
    }
  });

  it("drops the landmark when the label is null", () => {
    const { container } = render(<AboutPanel sections={SECTIONS} label={null} />);
    expect(screen.queryByRole("region")).toBeNull();
    const panel = container.querySelector(".about-panel")!;
    expect(panel.tagName).toBe("SECTION");
    expect(panel.hasAttribute("aria-label")).toBe(false);
  });

  it("renders markup in a title", () => {
    render(<AboutPanel sections={[{ title: <span lang="zh">通书</span>, content: "Almanac." }]} />);
    expect(screen.getByRole("heading").innerHTML).toBe('<span lang="zh">通书</span>');
  });

  it("keeps a section's state with its id when sections are reordered", () => {
    const a = { id: "a", title: "A", content: <input aria-label="field a" /> };
    const b = { id: "b", title: "B", content: "B body" };
    const { rerender } = render(<AboutPanel sections={[a, b]} />);
    const field = screen.getByRole("textbox") as HTMLInputElement;
    field.value = "typed";
    rerender(<AboutPanel sections={[b, a]} />);
    expect(screen.getByRole("textbox")).toBe(field);
    expect(field.value).toBe("typed");
  });

  it("keeps sections with the same title", () => {
    render(<AboutPanel sections={[SECTIONS[0], SECTIONS[0]]} />);
    expect(screen.getAllByRole("heading", { name: "Purpose" })).toHaveLength(2);
  });

  it("passes other props to the region and appends a caller's class", () => {
    render(<AboutPanel sections={SECTIONS} id="about" className="wide" />);
    const region = screen.getByRole("region");
    expect(region.id).toBe("about");
    expect(region.className).toBe("about-panel wide");
  });

  it("lets a caller's aria-label rename the region", () => {
    render(<AboutPanel sections={SECTIONS} aria-label="Help" />);
    expect(screen.getByRole("region", { name: "Help" })).toBeTruthy();
  });
});

describe("AboutList", () => {
  const items = [
    { term: "Pillar", description: "One stem and branch pair." },
    { term: <b>Leap month</b>, description: <span>An extra month.</span> },
  ];

  it("renders each term and description as a pair", () => {
    const { container } = render(<AboutList items={items} />);
    const list = container.querySelector("dl")!;
    expect(list.className).toBe("about-list");
    const pairs = [...list.children];
    expect(pairs.map((el) => el.tagName)).toEqual(["DIV", "DIV"]);
    for (const pair of pairs) {
      expect(pair.className).toBe("about-list-item");
      expect([...pair.children].map((el) => `${el.tagName}.${el.className}`)).toEqual([
        "DT.about-list-term",
        "DD.about-list-description",
      ]);
    }
    expect(pairs[0].textContent).toBe("PillarOne stem and branch pair.");
    expect(pairs[1].querySelector("dt")!.innerHTML).toBe("<b>Leap month</b>");
    expect(pairs[1].querySelector("dd")!.innerHTML).toBe("<span>An extra month.</span>");
  });

  it("renders an array of terms as one dt each", () => {
    const { container } = render(
      <AboutList items={[{ term: ["通书", "Tong Shu"], description: "The almanac." }]} />,
    );
    const pair = container.querySelector(".about-list-item")!;
    expect([...pair.children].map((el) => `${el.tagName}:${el.textContent}`)).toEqual([
      "DT:通书",
      "DT:Tong Shu",
      "DD:The almanac.",
    ]);
    for (const dt of pair.querySelectorAll("dt")) expect(dt.className).toBe("about-list-term");
  });

  it("passes other props to the list and appends a caller's class", () => {
    const { container } = render(<AboutList items={items} id="terms" className="tight" />);
    const list = container.querySelector("dl")!;
    expect(list.id).toBe("terms");
    expect(list.className).toBe("about-list tight");
  });
});

describe("about-panel.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("spaces sections and sets readable body text", () => {
    const body = ruleBody(css, ":where(.about-panel)");
    expect(body).toContain("display: grid");
    expect(body).toContain("gap: 1rem");
    expect(body).toContain("color: var(--text)");
    expect(body).toContain("line-height: 1.6");
  });

  it("styles headings in the heading colour without a top margin", () => {
    const body = ruleBody(css, ":where(.about-panel-heading)");
    expect(body).toContain("margin-block: 0 0.375rem");
    expect(body).toMatch(/margin-inline: 0;/);
    expect(body).toContain("color: var(--text-h)");
    expect(body).toContain("font-size: 1.125rem");
  });

  it("drops the outer margins of the body's first and final children", () => {
    expect(ruleBody(css, ":where(.about-panel-body > :first-child)")).toMatch(
      /margin-block-start: 0;/,
    );
    expect(ruleBody(css, ":where(.about-panel-body > :last-child)")).toMatch(
      /margin-block-end: 0;/,
    );
  });

  it("indents body lists", () => {
    expect(ruleBody(css, ":where(.about-panel-body ul, .about-panel-body ol)")).toContain(
      "padding-inline-start: 1.25rem",
    );
  });

  it("spaces glossary pairs and bolds terms in the heading colour", () => {
    const list = ruleBody(css, ":where(.about-list)");
    expect(list).toContain("gap: 0.5rem");
    expect(list).toMatch(/margin: 0;/);
    const term = ruleBody(css, ":where(.about-list-term)");
    expect(term).toContain("color: var(--text-h)");
    expect(term).toContain("font-weight: 700");
    expect(ruleBody(css, ":where(.about-list-description)")).toMatch(/margin: 0;/);
  });
});
