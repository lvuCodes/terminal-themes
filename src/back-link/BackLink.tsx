// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./back-link.css";

// Back link to the author's home page. Overlays the page's top-left corner so
// it never displaces the content below it.
export function BackLink({
  href = "https://lvucodes.github.io",
  label = "← lvuCodes",
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
