// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LICENSE_LABEL,
  DEFAULT_OWNER,
  DEFAULT_OWNER_HREF,
  FooterCredits,
} from "./FooterCredits";

afterEach(cleanup);

describe("FooterCredits", () => {
  it("credits the default owner and links the given licence", () => {
    const { container } = render(<FooterCredits licenseHref="/LICENSE" year={2026} />);
    const footer = container.querySelector("footer.credits")!;
    expect(footer.textContent).toContain(`© 2026 ${DEFAULT_OWNER}`);
    expect(footer.textContent).toContain(DEFAULT_LICENSE_LABEL);

    const links = [...footer.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([DEFAULT_OWNER_HREF, "/LICENSE"]);
    for (const a of links) {
      expect(a.getAttribute("rel")).toBe("noreferrer noopener");
      expect(a.getAttribute("target")).toBe("_blank");
    }
  });

  it("defaults the year to the current one", () => {
    const { container } = render(<FooterCredits licenseHref="/LICENSE" />);
    expect(container.textContent).toContain(`© ${new Date().getFullYear()}`);
  });

  it("honours a custom owner and licence label", () => {
    const { container } = render(
      <FooterCredits licenseHref="/L" licenseLabel="MIT" owner="someone" ownerHref="/o" />,
    );
    expect(container.textContent).toContain("someone");
    expect(container.textContent).toContain("MIT");
    expect(container.querySelector(`a[href="/o"]`)).toBeTruthy();
  });
});
