// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useState, type ReactNode, type SyntheticEvent } from "react";
import "./collapsible.css";

export interface CollapsibleProps {
  summary: ReactNode;
  children: ReactNode;
  // Controlled open state. Omit it to let the section manage its own state.
  // Pick one mode per mount; switching between them is not supported.
  open?: boolean;
  defaultOpen?: boolean;
  // localStorage key that remembers the open state across visits. Read once per
  // mount, and ignored when `open` is controlled.
  storageKey?: string;
  onToggle?: (open: boolean) => void;
  className?: string;
}

function readStored(key: string | undefined) {
  if (!key) return undefined;
  try {
    const value = localStorage.getItem(key);
    return value === null ? undefined : value === "1";
  } catch {
    return undefined;
  }
}

function writeStored(key: string | undefined, open: boolean) {
  if (!key) return;
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // Storage can be blocked (private mode, disabled site data); the section still works.
  }
}

// Native <details>/<summary>, so it is keyboard-operable, announced as
// expandable, and still works if hydration fails.
export function Collapsible({
  summary,
  children,
  open,
  defaultOpen = false,
  storageKey,
  onToggle,
  className,
}: CollapsibleProps) {
  const [ownOpen, setOwnOpen] = useState(() => readStored(storageKey) ?? defaultOpen);
  const isOpen = open ?? ownOpen;

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const next = event.currentTarget.open;
    if (next === isOpen) return;
    if (open === undefined) {
      setOwnOpen(next);
      writeStored(storageKey, next);
    } else {
      // The browser already flipped the element. Hold the prop's value so a
      // parent that keeps its state unchanged keeps the DOM unchanged too.
      event.currentTarget.open = open;
    }
    onToggle?.(next);
  }

  return (
    <details
      className={className ? `collapsible ${className}` : "collapsible"}
      open={isOpen}
      onToggle={handleToggle}
    >
      <summary className="collapsible-summary">
        <span>{summary}</span>
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}
