// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSingleWhere, ruleBody, selectorsOf } from "../test-support/css-rules";
import { SAVE_STATUS_DEFAULT_LABELS } from "./labels";
import { SaveStatus } from "./SaveStatus";

const css = readFileSync(resolve(__dirname, "save-status.css"), "utf8");

afterEach(cleanup);

describe("SaveStatus", () => {
  it("imports its own skin, since a barrel side-effect import gets tree-shaken", () => {
    const source = readFileSync(resolve(__dirname, "SaveStatus.tsx"), "utf8");
    expect(source).toContain('import "./save-status.css"');
  });

  it("renders an empty polite live region while idle, so later text is announced", () => {
    render(<SaveStatus state="idle" />);
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("P");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.textContent).toBe("");
    expect(status.dataset.state).toBe("idle");
    expect(status.className).toBe("save-status");
  });

  it("shows the default text for each state", () => {
    const { rerender } = render(<SaveStatus state="saving" />);
    expect(screen.getByRole("status").textContent).toBe("Saving…");
    rerender(<SaveStatus state="saved" />);
    expect(screen.getByRole("status").textContent).toBe("Saved");
    expect(screen.getByRole("status").dataset.state).toBe("saved");
    rerender(<SaveStatus state="error" />);
    expect(screen.getByRole("status").textContent).toBe("Not saved");
    expect(SAVE_STATUS_DEFAULT_LABELS).toEqual({
      saving: "Saving…",
      saved: "Saved",
      error: "Not saved",
    });
  });

  it("keeps the same region node across state changes", () => {
    const { rerender } = render(<SaveStatus state="idle" />);
    const first = screen.getByRole("status");
    rerender(<SaveStatus state="saved" />);
    expect(screen.getByRole("status")).toBe(first);
  });

  it("uses a caller's labels and falls back to defaults for the rest", () => {
    const { rerender } = render(<SaveStatus state="saved" labels={{ saved: "Settings saved" }} />);
    expect(screen.getByRole("status").textContent).toBe("Settings saved");
    rerender(<SaveStatus state="error" labels={{ saved: "Settings saved" }} />);
    expect(screen.getByRole("status").textContent).toBe("Not saved");
    rerender(<SaveStatus state="error" labels={{ error: "" }} />);
    expect(screen.getByRole("status").textContent).toBe("Not saved");
  });

  it("keeps a caller's class and forwards other props, but not role or live settings", () => {
    render(
      <SaveStatus
        state="saved"
        className="wide"
        id="s"
        {...({ role: "alert", "aria-live": "off" } as object)}
      />,
    );
    const status = document.getElementById("s")!;
    expect(status.className).toBe("save-status wide");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });
});

describe("save-status.css", () => {
  it("keeps every selector at zero specificity so caller classes win", () => {
    const selectors = selectorsOf(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(isSingleWhere(s), s).toBe(true);
  });

  it("holds the line height while idle so the layout does not jump", () => {
    expect(ruleBody(css, ":where(.save-status)")).toContain("min-height: 1.5em");
    expect(ruleBody(css, ':where(.save-status[data-state="idle"])::before')).toContain(
      "display: none",
    );
  });

  it("gives each state its own marker shape in the text colour", () => {
    const marker = ruleBody(css, ":where(.save-status)::before");
    expect(marker).toContain('content: ""');
    expect(marker).toContain("flex: none");
    for (const state of ["saving", "saved", "error"]) {
      const body = ruleBody(css, `:where(.save-status[data-state="${state}"])::before`);
      expect(body, state).toMatch(/width: 0\.\d+rem/);
      expect(body, state).toContain("height: 0.75rem");
    }
    const saving = ruleBody(css, ':where(.save-status[data-state="saving"])::before');
    expect(saving).toContain("border-radius: 50%");
    expect(saving).toContain("border-top-color: transparent");
    const saved = ruleBody(css, ':where(.save-status[data-state="saved"])::before');
    expect(saved).toContain("border-bottom: 2px solid currentcolor");
    expect(saved).toContain("transform: rotate(45deg)");
    const error = ruleBody(css, ':where(.save-status[data-state="error"])::before');
    expect(error).toContain("background: currentcolor");
    expect(error).toContain("clip-path: polygon(50% 0, 100% 100%, 0 100%)");
  });

  it("keeps the marker visible in forced-colors mode", () => {
    const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
    const marker = ruleBody(forced, ":where(.save-status)::before");
    expect(marker).toContain("forced-color-adjust: none");
    expect(marker).toContain("color: CanvasText");
  });

  it("stops the saving spin for reduced motion", () => {
    expect(ruleBody(css, ':where(.save-status[data-state="saving"])::before')).toContain(
      "animation: save-status-spin",
    );
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(ruleBody(reduced, ':where(.save-status[data-state="saving"])::before')).toContain(
      "animation: none",
    );
  });
});
