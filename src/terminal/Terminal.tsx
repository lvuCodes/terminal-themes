// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import "./Terminal.css";
import { ANSI_SLOTS, slotTag, type Role } from "./ansi";
import { AnsiModeToggle } from "./AnsiModeToggle";
import type { AnsiMode } from "@lvucodes/ui";

// A mock terminal window that renders the Claude Code UI elements the reference
// catalogs, each drawn in the ANSI slot it actually uses. Everything is styled
// from the active theme's tokens, so switching profiles restyles the window the
// way changing a Terminal profile would.

function Tag({ role }: { role: Role }) {
  return <span className="term-tag">{slotTag(role)}</span>;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="term-section">
      <div className="term-section-label">{label}</div>
      {children}
    </section>
  );
}

interface TerminalProps {
  ansiMode: AnsiMode;
  onAnsiModeChange: (mode: AnsiMode) => void;
  title?: string;
}

export function Terminal({
  ansiMode,
  onAnsiModeChange,
  title = "claude — terminal-themes",
}: TerminalProps) {
  return (
    <div className="term">
      <div className="term-chrome">
        <span className="term-dot term-dot-close" />
        <span className="term-dot term-dot-min" />
        <span className="term-dot term-dot-max" />
        <span className="term-chrome-title">{title}</span>
      </div>

      <div className="term-body">
        <Section label="PALETTE">
          <div className="term-palette">
            <div className="term-palette-toggle">
              <AnsiModeToggle mode={ansiMode} onChange={onAnsiModeChange} />
            </div>
            {ANSI_SLOTS.map((s) => (
              <div
                key={s.slot}
                className="term-slot"
                style={{ background: `var(--ansi-${s.slot})` }}
                title={`${s.slot} — ${s.name}`}
              >
                {String(s.slot).padStart(2, "0")}
              </div>
            ))}
          </div>
        </Section>

        <Section label="BRANDING + STATUS">
          <div className="term-status">
            <span className="r-claude">Claude</span>
            <Tag role="claude" />
            <span className="term-sep">│</span>
            <span className="r-fast">fast</span>
            <Tag role="fast" />
            <span className="term-sep">│</span>
            <span className="r-success">● ok</span>
            <Tag role="success" />
            <span className="term-sep">│</span>
            <span className="r-error">✗ err</span>
            <Tag role="error" />
            <span className="term-sep">│</span>
            <span className="r-warning">⚠ warn</span>
            <Tag role="warning" />
            <span className="term-sep">│</span>
            <span className="r-plan">◆ plan</span>
            <Tag role="plan" />
            <span className="term-sep">│</span>
            <span className="r-auto-accept">auto-accept</span>
            <Tag role="autoAccept" />
          </div>
        </Section>

        <Section label="PERMISSION">
          <div className="term-permission">
            <div className="r-permission">
              ? Allow Bash command
              <Tag role="permission" />
            </div>
            <div className="r-suggestion">
              ❯ 1. Yes 2. Yes, and don&apos;t ask again 3. No
              <Tag role="suggestion" />
            </div>
          </div>
        </Section>

        <Section label="TOOL CALL">
          <div className="term-tool">
            <div className="r-bash-border">
              Bash(npm run build)
              <Tag role="bashBorder" />
            </div>
            <div className="r-text">tsc -b &amp;&amp; vite build</div>
            <div className="r-success">
              ✓ built in 533ms
              <Tag role="success" />
            </div>
          </div>
        </Section>

        <Section label="DIFF">
          <div className="term-diff-removed r-diff-removed">
            - return <b className="r-diff-removed-word">legacy</b>
            <Tag role="diffRemovedWord" /> Result;
          </div>
          <div className="term-diff-added r-diff-added">
            + return <b className="r-diff-added-word">updated</b>
            <Tag role="diffAddedWord" /> Result;
          </div>
        </Section>

        <Section label="PROSE">
          <p className="r-text">
            All nine profiles share one ANSI palette — only the background moves.
            <Tag role="text" />
          </p>
          <p className="r-dim">
            Dim and secondary text lives one slot down.
            <Tag role="dim" />
          </p>
        </Section>

        <Section label="USER MESSAGE">
          <div className="term-user">
            <div className="r-permission term-user-label">You</div>
            <div className="r-text">make the terminal use the theme</div>
          </div>
        </Section>
      </div>
    </div>
  );
}
