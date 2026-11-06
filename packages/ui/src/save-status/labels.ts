// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

export type SaveState = "idle" | "saving" | "saved" | "error";

export const SAVE_STATUS_DEFAULT_LABELS = {
  saving: "Saving…",
  saved: "Saved",
  error: "Not saved",
} as const satisfies Record<Exclude<SaveState, "idle">, string>;
