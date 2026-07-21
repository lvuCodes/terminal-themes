// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./footer-credits.css";

// Footer credits bar. Names the author and links the hosting repo's own
// licence, so each consuming site passes the URL of its own LICENSE file.
export const DEFAULT_OWNER = "lvuCodes";
export const DEFAULT_OWNER_HREF = "https://github.com/lvuCodes";
export const DEFAULT_LICENSE_LABEL = "GNU GPL v3";

export function FooterCredits({
  licenseHref,
  licenseLabel = DEFAULT_LICENSE_LABEL,
  owner = DEFAULT_OWNER,
  ownerHref = DEFAULT_OWNER_HREF,
  year = new Date().getFullYear(),
}: {
  licenseHref: string;
  licenseLabel?: string;
  owner?: string;
  ownerHref?: string;
  year?: number;
}) {
  return (
    <footer className="credits">
      <p className="credits-copyright">
        © {year}{" "}
        <a href={ownerHref} target="_blank" rel="noreferrer noopener">
          {owner}
        </a>
        . Free software under the{" "}
        <a href={licenseHref} target="_blank" rel="noreferrer noopener">
          {licenseLabel}
        </a>
        .
      </p>
    </footer>
  );
}
