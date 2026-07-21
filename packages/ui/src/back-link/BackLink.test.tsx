// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BackLink, BACK_LINK_DEFAULT_HREF, BACK_LINK_DEFAULT_LABEL } from "./BackLink";

afterEach(cleanup);

describe("BackLink", () => {
  it("points at the author's home page by default", () => {
    render(<BackLink />);
    const link = screen.getByRole("link", { name: BACK_LINK_DEFAULT_LABEL });
    expect(link.getAttribute("href")).toBe(BACK_LINK_DEFAULT_HREF);
  });

  it("wears the shared pill skin rather than its own", () => {
    render(<BackLink />);
    expect(screen.getByRole("link", { name: BACK_LINK_DEFAULT_LABEL }).className).toBe("pill");
  });

  it("honours a custom target and label", () => {
    render(<BackLink href="/elsewhere" label="← Back" />);
    expect(screen.getByRole("link", { name: "← Back" }).getAttribute("href")).toBe("/elsewhere");
  });
});
