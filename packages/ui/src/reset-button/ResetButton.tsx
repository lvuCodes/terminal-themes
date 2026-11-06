// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useEffect, useRef, useState, type ComponentProps } from "react";
import "./reset-button.css";

// className goes on the wrapping span; every other prop (disabled, id, name,
// aria-*, onBlur, onKeyDown) goes on the button. The status line sits under
// the button, wraps to its width, and keeps one line reserved, so a short
// message moves neither the button nor its neighbours. In an end-aligned or
// centred layout the caller's class sets justify-content to match. The
// wrapper is two rows tall, so a centred flex row aligns it with
// align-items: start. A shorter label needs a matching shorter hint and
// doneMessage to keep the status on one line.
export interface ResetButtonProps extends Omit<
  ComponentProps<"button">,
  "type" | "children" | "onClick" | "dangerouslySetInnerHTML"
> {
  // Called once the second press confirms the reset.
  onReset: () => void;
  label?: string;
  // Button text while the reset waits for the confirming press.
  confirmLabel?: string;
  // Status text shown and announced while the reset waits for confirmation.
  hint?: string;
  // Status text shown and announced after the reset ran.
  doneMessage?: string;
}

type Phase = "idle" | "armed" | "done";

// The first press arms the button and the second, separate press resets, so
// neither a double-click nor a held Enter key confirms. Blur, Escape, or a
// press anywhere outside disarms it, so a stray click is safe. Blur keeps the
// done message, since Chrome blurs a button that its parent then disables.
// The outside-press listener also covers Safari and Firefox on macOS, where a
// clicked button never takes focus, so it never blurs and Escape never
// reaches it. Both labels
// share one grid cell, so the button keeps its width when armed.
export function ResetButton({
  onReset,
  label = "Reset defaults",
  confirmLabel = "Confirm reset",
  hint = "Press again.",
  doneMessage = "Reset done.",
  className,
  disabled,
  onBlur,
  onKeyDown,
  ...props
}: ResetButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const wrapper = useRef<HTMLSpanElement>(null);
  if (disabled && phase === "armed") setPhase("idle");
  const armed = phase === "armed";

  useEffect(() => {
    if (phase === "idle") return;
    const dismiss = (event: PointerEvent) => {
      if (!wrapper.current!.contains(event.target as Node)) setPhase("idle");
    };
    document.addEventListener("pointerdown", dismiss, { capture: true });
    return () => document.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [phase]);

  return (
    <span ref={wrapper} className={className ? `reset-button ${className}` : "reset-button"}>
      <button
        {...props}
        type="button"
        disabled={disabled}
        className={armed ? "reset-button-control reset-button-armed" : "reset-button-control"}
        onClick={(event) => {
          if (armed) {
            if (event.detail > 1) return;
            onReset();
            setPhase("done");
          } else {
            setPhase("armed");
          }
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setPhase((current) => (current === "armed" ? "idle" : current));
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Enter" && event.repeat) event.preventDefault();
          if (event.key === "Escape" && armed) {
            event.preventDefault();
            event.stopPropagation();
            setPhase("idle");
          }
        }}
      >
        <span className="reset-button-label" aria-hidden={armed || undefined}>
          {label}
        </span>
        <span className="reset-button-label" aria-hidden={!armed || undefined}>
          {confirmLabel}
        </span>
      </button>
      <span
        role="status"
        className="reset-button-status"
        onMouseDown={(event) => event.preventDefault()}
      >
        {armed ? hint : phase === "done" ? doneMessage : ""}
      </span>
    </span>
  );
}
