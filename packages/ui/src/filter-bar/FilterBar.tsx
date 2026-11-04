// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import type { ComponentProps, ReactNode } from "react";
import "./filter-bar.css";

export interface FilterBarProps extends Omit<ComponentProps<"div">, "role"> {
  // Accessible name of the group, e.g. "Font filters".
  label: string;
  // Number of filters currently applied. With onClear, a clear button shows
  // while it is above zero.
  activeCount?: number;
  onClear?: () => void;
  clearLabel?: string;
  // Result summary such as "12 / 80 families", announced politely on change.
  status?: ReactNode;
}

export function FilterBar({
  label,
  activeCount = 0,
  onClear,
  clearLabel = "Clear filters",
  status,
  className,
  children,
  ...props
}: FilterBarProps) {
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={className ? `filter-bar ${className}` : "filter-bar"}
    >
      {children}
      {onClear && activeCount > 0 && (
        <button type="button" className="filter-chip filter-bar-clear" onClick={onClear}>
          {clearLabel} ({activeCount})
        </button>
      )}
      {status !== undefined && (
        <span className="filter-bar-status" role="status">
          {status}
        </span>
      )}
    </div>
  );
}
