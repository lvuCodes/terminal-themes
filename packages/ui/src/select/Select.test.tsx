// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ChangeEvent } from "react";
import { Select } from "./Select";

const css = readFileSync(resolve(__dirname, "select.css"), "utf8");

afterEach(cleanup);

describe("Select", () => {
  it("renders a native select wearing the shared class", () => {
    render(
      <Select aria-label="Sort">
        <option value="name">Name</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Sort" }).className).toBe("select");
  });

  it("keeps a caller's own class beside the shared one", () => {
    render(<Select aria-label="Sort" className="wide" />);
    expect(screen.getByRole("combobox").className).toBe("select wide");
  });

  it("forwards value and change events like a bare select", async () => {
    const onChange = vi.fn((e: ChangeEvent<HTMLSelectElement>) => e.target.value);
    render(
      <Select aria-label="Language" value="all" onChange={onChange}>
        <option value="all">All languages</option>
        <option value="en">English</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "en");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toBe("en");
  });
});

describe("select.css", () => {
  const rule = css.slice(css.indexOf(".select:not("), css.indexOf("}"));

  it("skins only single-selects, leaving listboxes native", () => {
    expect(rule).toContain('.select:not([multiple], [size]:not([size="1"]))');
  });

  it("gives the chevron room clear of the right border", () => {
    expect(rule).toContain("appearance: none");
    expect(rule).toMatch(/background-position:\s*right 1rem center,\s*right 0\.5rem center/);
    expect(rule).toContain("background-size: 0.5rem 0.5rem");
    expect(rule).toContain("padding: 0.25rem 2rem 0.25rem 0.5rem");
  });

  it("draws the chevron in the theme's text colour", () => {
    expect(rule.match(/currentcolor/g)).toHaveLength(2);
  });
});
