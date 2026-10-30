// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./AnsiModeToggle.css";
import type { AnsiMode } from "@lvucodes/ui";

// Switches which half of the ANSI palette the panel draws from: Dark uses the
// bright slots (8–15), Light the normal slots (0–7). Each segment renders three
// live swatches from its own half on the background that half is meant to sit
// on, so the dark/light choice is shown rather than asserted by the label alone.

interface Option {
  mode: AnsiMode;
  label: string;
  hint: string;
  slots: string;
  swatches: readonly number[];
  surface: number;
}

const OPTIONS = [
  {
    mode: "dark",
    label: "Dark",
    hint: "bright 8–15",
    slots: "8–15",
    swatches: [9, 10, 12],
    surface: 0,
  },
  {
    mode: "light",
    label: "Light",
    hint: "normal 0–7",
    slots: "0–7",
    swatches: [1, 2, 4],
    surface: 15,
  },
] as const satisfies readonly Option[];

function Preview({ swatches, surface }: Pick<Option, "swatches" | "surface">) {
  return (
    <span
      className="ansi-toggle-preview"
      style={{ background: `var(--ansi-${surface})` }}
      aria-hidden="true"
    >
      {swatches.map((slot) => (
        <span
          key={slot}
          className="ansi-toggle-dot"
          style={{ background: `var(--ansi-${slot})` }}
        />
      ))}
    </span>
  );
}

interface AnsiModeToggleProps {
  mode: AnsiMode;
  onChange: (mode: AnsiMode) => void;
}

export function AnsiModeToggle({ mode, onChange }: AnsiModeToggleProps) {
  return (
    <div className="ansi-toggle" role="group" aria-label="Dark / light ANSI palette">
      {OPTIONS.map(({ mode: m, label, hint, slots, swatches, surface }) => (
        <button
          key={m}
          type="button"
          className={"ansi-toggle-btn" + (mode === m ? " active" : "")}
          aria-pressed={mode === m}
          title={`${label} ANSI — slots ${slots}, for ${label.toLowerCase()} themes`}
          onClick={() => onChange(m)}
        >
          <Preview swatches={swatches} surface={surface} />
          <span className="ansi-toggle-text">
            <span className="ansi-toggle-label">{label}</span>
            <span className="ansi-toggle-hint">{hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
