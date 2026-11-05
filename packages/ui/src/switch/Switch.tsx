// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import "./switch.css";

// className goes on the wrapping label; every other prop (checked, onChange,
// name, aria-*, style) goes on the visually hidden checkbox.
export interface SwitchProps extends Omit<ComponentProps<"input">, "type" | "role" | "children"> {
  // Visible label text, also the switch's accessible name.
  label: ReactNode;
  // Keep the label for screen readers only, for a bare inline switch.
  labelHidden?: boolean;
  // Half state for a partial select-all. ARIA switches have no mixed state,
  // so while indeterminate the control is announced as a mixed checkbox.
  indeterminate?: boolean;
}

export function Switch({
  label,
  labelHidden = false,
  indeterminate = false,
  className,
  onChange,
  ref,
  ...props
}: SwitchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);

  // indeterminate is a DOM property with no HTML attribute. A click clears it,
  // so the change handler reapplies the prop even when the parent's update
  // renders nothing new.
  useLayoutEffect(() => {
    inputRef.current!.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={className ? `switch ${className}` : "switch"}>
      <span className={labelHidden ? "switch-label switch-label-hidden" : "switch-label"}>
        {label}
      </span>
      <input
        {...props}
        ref={inputRef}
        type="checkbox"
        role={indeterminate ? undefined : "switch"}
        onChange={(event) => {
          onChange?.(event);
          event.currentTarget.indeterminate = indeterminate;
        }}
        className="switch-input"
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
