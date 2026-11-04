// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
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
  // "vertical" stacks the controls full width, for a side panel of groups.
  orientation?: "horizontal" | "vertical";
}

export function FilterBar({
  label,
  activeCount = 0,
  onClear,
  clearLabel = "Clear filters",
  status,
  announceStatus = true,
  orientation = "horizontal",
  className,
  children,
  ref,
  ...props
}: FilterBarProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const clearPressed = useRef(false);
  useImperativeHandle(ref, () => groupRef.current!, []);
  const showClear = onClear !== undefined && activeCount > 0;

  // When clearing unmounts the focused clear button, focus falls to the page
  // body; return it to the group instead. A clear that leaves filters active
  // keeps the button, and focus stays on it.
  useLayoutEffect(() => {
    if (!clearPressed.current) return;
    clearPressed.current = false;
    if (!showClear && document.activeElement === document.body) {
      groupRef.current!.focus({ preventScroll: true });
    }
  });

  function handleClear() {
    clearPressed.current = true;
    onClear!();
  }

  const classes = ["filter-bar"];
  if (orientation === "vertical") classes.push("filter-bar-vertical");
  if (className) classes.push(className);

  return (
    <div
      {...props}
      ref={groupRef}
      role="group"
      aria-label={label}
      tabIndex={-1}
      className={classes.join(" ")}
    >
      {children}
      {showClear && (
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
