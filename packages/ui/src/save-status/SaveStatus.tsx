// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import type { ComponentProps } from "react";
import "./save-status.css";
import { SAVE_STATUS_DEFAULT_LABELS, type SaveState } from "./labels";

export interface SaveStatusProps extends Omit<
  ComponentProps<"p">,
  "role" | "children" | "dangerouslySetInnerHTML" | "aria-live" | "aria-atomic"
> {
  state: SaveState;
  labels?: Partial<Record<Exclude<SaveState, "idle">, string>>;
}

// The live region renders in every state, idle included, because screen
// readers only announce changes to a region that was already in the page.
// A repeat save is announced only when the text changes between saves, so a
// caller passes "saving" before each new "saved".
// An empty label falls back to the default, since the words carry the state.
// A failure is announced politely, so a caller that must interrupt pairs it
// with its own role="alert" message.
export function SaveStatus({ state, labels, className, ...props }: SaveStatusProps) {
  const text = state === "idle" ? "" : labels?.[state] || SAVE_STATUS_DEFAULT_LABELS[state];
  return (
    <p
      {...props}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={className ? `save-status ${className}` : "save-status"}
      data-state={state}
    >
      {text}
    </p>
  );
}
