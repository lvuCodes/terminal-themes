import "./AnsiModeToggle.css";
import type { AnsiMode } from "../theme";

// Switches which half of the ANSI palette the panel draws from. Deliberately a
// two-segment control with both a preview and the word visible at rest rather
// than a single icon-button that flips: at a glance it has to read as which half
// is in use, and which one is currently on has to be obvious without hovering.
//
// The segment preview is the whole point of the control. A moon/sun pair is
// ambiguous here — "dark" names the theme the half is *for*, not the colours,
// and the colours run the other way (dark-ansi is the brighter half). Each
// segment therefore renders three live swatches from its own half on the
// background that half is meant to sit on, so the inversion is visible rather
// than something the label has to argue for.

interface Option {
  mode: AnsiMode;
  label: string;
  hint: string;
  slots: string;
  swatches: readonly number[];
  surface: number;
}

const OPTIONS = [
  { mode: "dark", label: "Bright", hint: "for dark themes", slots: "8–15", swatches: [9, 10, 12], surface: 0 },
  { mode: "light", label: "Normal", hint: "for light themes", slots: "0–7", swatches: [1, 2, 4], surface: 15 },
] as const satisfies readonly Option[];

function Preview({ swatches, surface }: Pick<Option, "swatches" | "surface">) {
  return (
    <span
      className="ansi-toggle-preview"
      style={{ background: `var(--ansi-${surface})` }}
      aria-hidden="true"
    >
      {swatches.map((slot) => (
        <span key={slot} className="ansi-toggle-dot" style={{ background: `var(--ansi-${slot})` }} />
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
    <div className="ansi-toggle" role="group" aria-label="ANSI palette half">
      {OPTIONS.map(({ mode: m, label, hint, slots, swatches, surface }) => (
        <button
          key={m}
          type="button"
          className={"ansi-toggle-btn" + (mode === m ? " active" : "")}
          aria-pressed={mode === m}
          title={`${label} ANSI — slots ${slots}, ${hint}`}
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
