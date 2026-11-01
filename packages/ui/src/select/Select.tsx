// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import type { ComponentProps } from "react";
import "./select.css";

// Native <select> with the shared skin. Every prop, ref included, is forwarded,
// so it stays a drop-in replacement for a bare <select> and keeps native
// keyboard behaviour.
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={className ? `select ${className}` : "select"} {...props} />;
}
