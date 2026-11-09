// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useId, useState, type CSSProperties, type ComponentProps } from "react";
import "./number-stepper.css";

// Every prop not listed here (id, className, style, aria-*) goes on the group.
// The caller keeps min <= max, a positive step, and a finite value.
export interface NumberStepperProps extends Omit<
  ComponentProps<"div">,
  "role" | "children" | "onChange" | "dangerouslySetInnerHTML"
> {
  value: number;
  // Called with the next value, clamped to min and max and rounded to the
  // most decimal places among step, min, and max.
  onChange: (value: number) => void;
  // Names the group and, unless overridden, both buttons.
  label: string;
  min?: number;
  max?: number;
  step?: number;
  // Characters the count reserves, so an unbounded max does not shift the
  // plus button until the value outgrows them.
  digits?: number;
  disabled?: boolean;
  decrementLabel?: string;
  incrementLabel?: string;
}

// Decimal places of a number, reading exponent notation such as 1e-7, capped
// at the 100 that toFixed accepts.
function decimals(n: number) {
  const [mantissa, exponent = "0"] = String(n).split("e");
  const fraction = (mantissa.split(".")[1] ?? "").length;
  return Math.min(100, Math.max(0, fraction - Number(exponent)));
}

// A button at its bound, or in a disabled stepper, stays focusable with
// aria-disabled, since a natively disabled button drops focus to the page and a
// keyboard user loses their place.
// Each button is described by the count, so focus reads the current value, and
// only the stepper's own presses are announced, as "label value", once the
// caller applies them (now or later) and until the value moves elsewhere. The count
// reserves the width of its longest value, so the plus button stays put.
export function NumberStepper({
  value,
  onChange,
  label,
  min = 0,
  max = Infinity,
  step = 1,
  digits = 2,
  disabled = false,
  decrementLabel = `Decrease ${label}`,
  incrementLabel = `Increase ${label}`,
  className,
  ...props
}: NumberStepperProps) {
  const countId = useId();
  const [pressed, setPressed] = useState<number | null>(null);
  const [seen, setSeen] = useState(value);
  if (!Object.is(value, seen)) {
    setSeen(value);
    if (!Object.is(value, pressed)) setPressed(null);
  }
  const places = Math.max(...[step, min, max].map(decimals));
  const show = (n: number) => (Number.isFinite(n) ? n.toFixed(places) : "");
  const change = (delta: number) => {
    const next = Math.min(max, Math.max(min, Number((value + delta).toFixed(places))));
    setPressed(next);
    onChange(next);
  };
  const shown = Number(value.toFixed(places));
  const atMin = shown <= min;
  const atMax = shown >= max;
  const width = {
    "--number-stepper-chars": Math.max(digits, ...[min, max, value].map((n) => show(n).length)),
  };
  return (
    <div
      aria-label={label}
      {...props}
      aria-disabled={disabled || undefined}
      role="group"
      className={className ? `number-stepper ${className}` : "number-stepper"}
    >
      <button
        type="button"
        className="number-stepper-button"
        aria-label={decrementLabel}
        aria-describedby={countId}
        aria-disabled={disabled || atMin || undefined}
        onClick={() => {
          if (!disabled && !atMin) change(-step);
        }}
      >
        −
      </button>
      <span id={countId} className="number-stepper-value" style={width as CSSProperties}>
        {show(value)}
      </span>
      <button
        type="button"
        className="number-stepper-button"
        aria-label={incrementLabel}
        aria-describedby={countId}
        aria-disabled={disabled || atMax || undefined}
        onClick={() => {
          if (!disabled && !atMax) change(step);
        }}
      >
        +
      </button>
      <span role="status" className="number-stepper-live">
        {pressed === value ? `${label} ${show(value)}` : ""}
      </span>
    </div>
  );
}
