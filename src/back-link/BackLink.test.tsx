// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BackLink } from "./BackLink";

afterEach(cleanup);

describe("BackLink", () => {
  it("defaults to the lvuCodes home page", () => {
    render(<BackLink />);
    const link = screen.getByRole("link", { name: "← Home" });
    expect(link.getAttribute("href")).toBe("https://lvucodes.github.io");
  });

  it("honours a custom href and label", () => {
    render(<BackLink href="/elsewhere" label="← Back" />);
    const link = screen.getByRole("link", { name: "← Back" });
    expect(link.getAttribute("href")).toBe("/elsewhere");
  });
});
