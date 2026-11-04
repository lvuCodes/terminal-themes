// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useImperativeHandle, useRef, type ComponentProps, type ReactNode } from "react";
import "./filter-bar.css";

export interface FilterBarProps extends Omit<ComponentProps<"div">, "role"> {
  // Accessible name of the group, e.g. "Font filters".
  label: string;
  // Number of filters currently applied. With onClear, a clear button shows
  // while it is above zero.
  activeCount?: number;
  onClear?: () => void;
  clearLabel?: string;
  // Result summary such as "12 / 80 families". Pass null until the first value
  // is ready, so the live region exists before its first announcement.
  status?: ReactNode;
  // Announce status changes politely. Turn off when the status changes on every
  // keystroke of a search field in the same bar.
  announceStatus?: boolean;
}

// One wrapping row. For a vertical panel, give it a class that sets
// flex-direction: column; the skin has zero specificity, so that class wins.
export function FilterBar({
  label,
  activeCount = 0,
  onClear,
  clearLabel = "Clear filters",
  status,
  announceStatus = true,
  className,
  children,
  ref,
  ...props
}: FilterBarProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => groupRef.current!, []);

  function handleClear() {
    // The clear button unmounts once nothing is active, so move focus to the
    // group first rather than letting it fall back to the page body.
    groupRef.current!.focus();
    onClear!();
  }

  return (
    <div
      {...props}
      ref={groupRef}
      role="group"
      aria-label={label}
      tabIndex={-1}
      className={className ? `filter-bar ${className}` : "filter-bar"}
    >
      {children}
      {onClear && activeCount > 0 && (
        <button type="button" className="filter-chip filter-bar-clear" onClick={handleClear}>
          {clearLabel} ({activeCount})
        </button>
      )}
      {status !== undefined && (
        <span className="filter-bar-status" role={announceStatus ? "status" : undefined}>
          {status}
        </span>
      )}
    </div>
  );
}
