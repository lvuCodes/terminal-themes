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

  it("renders no repository link when repoHref is omitted", () => {
    const { container } = render(<FooterCredits licenseHref="/LICENSE" />);
    expect(container.querySelectorAll("footer.credits a")).toHaveLength(2);
  });

  it("links the repository inside the copyright line after the licence", () => {
    const { container } = render(
      <FooterCredits licenseHref="/LICENSE" repoHref="/repo" repoLabel="repo-name on GitHub" />,
    );
    const line = container.querySelector(".credits-copyright")!;
    const links = [...line.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      DEFAULT_OWNER_HREF,
      "/LICENSE",
      "/repo",
    ]);
    const repo = links[2];
    expect(repo.textContent).toBe("repo-name on GitHub");
    expect(repo.getAttribute("rel")).toBe("noreferrer noopener");
    expect(repo.getAttribute("target")).toBe("_blank");
  });
});
