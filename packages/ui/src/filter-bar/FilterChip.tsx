// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import type { ComponentProps } from "react";
import "./filter-bar.css";

export interface FilterChipProps extends Omit<ComponentProps<"button">, "aria-pressed" | "type"> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

export function FilterChip({
  pressed,
  onPressedChange,
  onClick,
  className,
  ...props
}: FilterChipProps) {
  return (
    <button
      {...props}
      type="button"
      className={className ? `filter-chip ${className}` : "filter-chip"}
      aria-pressed={pressed}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange(!pressed);
      }}
    />
  );
}
