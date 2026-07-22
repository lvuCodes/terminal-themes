// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./back-link.css";
import "../pill/pill.css";

// Back link to the author's home page. Overlays the page's top-left corner so
// it never displaces the content below it.
export const BACK_LINK_DEFAULT_HREF = "https://lvucodes.github.io";
export const BACK_LINK_DEFAULT_LABEL = "← lvuCodes";

export function BackLink({
  href = BACK_LINK_DEFAULT_HREF,
  label = BACK_LINK_DEFAULT_LABEL,
}: {
  href?: string;
  label?: string;
}) {
  return (
    <nav className="back-nav">
      <a className="pill" href={href}>
        {label}
      </a>
    </nav>
  );
}
