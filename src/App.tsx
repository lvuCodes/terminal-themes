// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./App.css";
import { BackLink, Card, FooterCredits, ThemeSwitcher, useAnsiMode, useTheme } from "@lvucodes/ui";
import { Terminal } from "./terminal";

const SURFACE_TOKENS = [
  { token: "--bg", label: "Page" },
  { token: "--panel", label: "Panel" },
  { token: "--code-bg", label: "Code" },
  { token: "--border", label: "Border" },
  { token: "--text", label: "Text" },
  { token: "--text-h", label: "Heading" },
  { token: "--accent", label: "Accent" },
  { token: "--on-accent", label: "On accent" },
];

const RAMP_TOKENS = [
  ...Array.from({ length: 11 }, (_, i) => ({
    token: `--item-${i}`,
    label: String(i),
  })),
  { token: "--item-forced", label: "forced" },
];

function App() {
  const [theme, setTheme] = useTheme();
  const [ansiMode, setAnsiMode] = useAnsiMode(theme);

  return (
    <main className="page">
      <BackLink />

      <h1>Terminal Themes</h1>
      <p className="tagline">
        Ten macOS-Terminal-inspired palettes as plain CSS custom properties, applied via{" "}
        <code>&lt;html data-theme&gt;</code>.
      </p>

      <ThemeSwitcher theme={theme} onChange={setTheme} />

      <Terminal ansiMode={ansiMode} onAnsiModeChange={setAnsiMode} />

      <Card heading="Surfaces & text" className="panel">
        <div className="swatches">
          {SURFACE_TOKENS.map((t) => (
            <div key={t.token} className="swatch">
              <div className="chip" style={{ background: `var(${t.token})` }} />
              <b>{t.label}</b>
              <code>{t.token}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card heading="Categorical ramp" className="panel">
        <div className="ramp">
          {RAMP_TOKENS.map((t) => (
            <div
              key={t.token}
              className={`ramp-cell${t.label === "forced" ? " ramp-cell-forced" : ""}`}
              style={{ background: `var(${t.token})` }}
            >
              {t.label}
            </div>
          ))}
        </div>
      </Card>

      <FooterCredits
        licenseHref="https://github.com/lvuCodes/terminal-themes/blob/main/LICENSE"
        year={2026}
      />
    </main>
  );
}

export default App;

// dark -
