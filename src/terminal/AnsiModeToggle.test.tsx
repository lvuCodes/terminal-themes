// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnsiModeToggle } from "./AnsiModeToggle";
import { Terminal } from "./Terminal";

afterEach(cleanup);

describe("<AnsiModeToggle>", () => {
  it("labels both halves in words, not just icons", () => {
    render(<AnsiModeToggle mode="dark" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^Dark/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Light/ })).toBeTruthy();
  });

  it("marks only the active half as pressed", () => {
    render(<AnsiModeToggle mode="light" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^Light/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: /^Dark/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("reads as a dark / light toggle", () => {
    render(<AnsiModeToggle mode="dark" onChange={() => {}} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toBe("Dark / light ANSI palette");
    expect(screen.getByRole("button", { name: /^Dark/ }).textContent).toContain("bright 8–15");
    expect(screen.getByRole("button", { name: /^Light/ }).textContent).toContain("normal 0–7");
  });

  it("names the slot range each half uses", () => {
    render(<AnsiModeToggle mode="dark" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^Dark/ }).getAttribute("title")).toContain("8–15");
    expect(screen.getByRole("button", { name: /^Light/ }).getAttribute("title")).toContain("0–7");
  });

  it("previews each half with its own swatches on the surface it suits", () => {
    const { container } = render(<AnsiModeToggle mode="dark" onChange={() => {}} />);
    const [bright, normal] = [...container.querySelectorAll(".ansi-toggle-preview")];
    expect(bright.getAttribute("style")).toContain("var(--ansi-0)");
    expect([...bright.children].map((d) => d.getAttribute("style"))).toEqual([
      "background: var(--ansi-9);",
      "background: var(--ansi-10);",
      "background: var(--ansi-12);",
    ]);
    expect(normal.getAttribute("style")).toContain("var(--ansi-15)");
    expect([...normal.children].map((d) => d.getAttribute("style"))).toEqual([
      "background: var(--ansi-1);",
      "background: var(--ansi-2);",
      "background: var(--ansi-4);",
    ]);
  });

  it("names the theme each half is meant for", () => {
    render(<AnsiModeToggle mode="dark" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^Dark/ }).getAttribute("title")).toContain(
      "for dark themes",
    );
    expect(screen.getByRole("button", { name: /^Light/ }).getAttribute("title")).toContain(
      "for light themes",
    );
  });

  it("reports the half that was clicked", async () => {
    const onChange = vi.fn();
    render(<AnsiModeToggle mode="dark" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /^Light/ }));
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("still reports a click on the half already active", async () => {
    // The control is two buttons rather than a flip-flop, so re-picking the
    // active half must stay a no-op rather than toggling to the other one.
    const onChange = vi.fn();
    render(<AnsiModeToggle mode="dark" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /^Dark/ }));
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});

describe("toggle placement", () => {
  it("sits inside the palette row, right after slot 15", () => {
    const { container } = render(<Terminal ansiMode="dark" onAnsiModeChange={() => {}} />);
    const row = container.querySelector(".term-palette")!;
    const last = row.children[row.children.length - 1];
    expect(last.previousElementSibling!.textContent).toBe("15");
    expect(last.querySelector(".ansi-toggle")).toBeTruthy();
    expect(row.querySelectorAll(".term-slot")).toHaveLength(16);
  });
});
