// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import type { SelectHTMLAttributes } from "react";
import "./select.css";

// Native <select> with the shared skin. Every prop is forwarded, so it stays a
// drop-in replacement for a bare <select> and keeps native keyboard behaviour.
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={className ? `select ${className}` : "select"} {...props} />;
}
