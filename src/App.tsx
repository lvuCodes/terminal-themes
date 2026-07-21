// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./App.css";
import { ThemeSwitcher, useAnsiMode, useTheme } from "./theme";
import { BackLink } from "./back-link";
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
  ...Array.from({ length: 10 }, (_, i) => ({
    token: `--item-${i + 1}`,
    label: String(i + 1),
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
        Nine macOS-Terminal-inspired palettes as plain CSS custom properties, applied via{" "}
        <code>&lt;html data-theme&gt;</code>.
      </p>

      <ThemeSwitcher theme={theme} onChange={setTheme} />

      <Terminal ansiMode={ansiMode} onAnsiModeChange={setAnsiMode} />

      <section className="panel">
        <h2>Surfaces &amp; text</h2>
        <div className="swatches">
          {SURFACE_TOKENS.map((t) => (
            <div key={t.token} className="swatch">
              <div className="chip" style={{ background: `var(${t.token})` }} />
              <b>{t.label}</b>
              <code>{t.token}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Categorical ramp</h2>
        <div className="ramp">
          {RAMP_TOKENS.map((t) => (
            <div key={t.token} className="ramp-cell" style={{ background: `var(${t.token})` }}>
              {t.label}
            </div>
          ))}
        </div>
      </section>

      <footer className="credits">
        <p className="credits-copyright">
          © 2026{" "}
          <a href="https://github.com/lvuCodes" target="_blank" rel="noreferrer noopener">
            lvuCodes
          </a>
          . Free software under the{" "}
          <a
            href="https://github.com/lvuCodes/terminal-themes/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer noopener"
          >
            GNU GPL v3
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

export default App;
