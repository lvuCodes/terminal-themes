// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import "./tabs.css";

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
}

// className and every other prop not listed here go on the wrapper.
export interface TabsProps<T extends string = string> extends Omit<
  ComponentProps<"div">,
  "onChange" | "children"
> {
  tabs: readonly TabItem<T>[];
  // The selected tab's id.
  value: T;
  // Called with a tab's id when another tab is clicked or reached by the
  // keyboard.
  onChange: (id: T) => void;
  // Accessible name of the tab list.
  label: string;
  // The selected tab's content, rendered inside the tab panel.
  children?: ReactNode;
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

// Follows the WAI-ARIA tabs pattern with automatic activation: only the
// selected tab is in the tab order, the arrow keys move and select with
// wrap-around (mirrored in right-to-left text), and Home and End jump to the
// ends. Arrows with Alt, Ctrl, or Meta are left to the browser. The selected tab carries a thicker bottom border, so selection never
// relies on colour alone.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  children,
  className,
  ...props
}: TabsProps<T>) {
  const base = useId();
  const tabId = (i: number) => `${base}-tab-${i}`;
  const panelId = `${base}-panel`;
  const selected = tabs.findIndex((t) => t.id === value);
  const focusable = Math.max(selected, 0);

  const select = (i: number) => {
    if (tabs[i].id !== value) onChange(tabs[i].id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const last = tabs.length - 1;
    const rtl = event.currentTarget.closest("[dir]")?.getAttribute("dir") === "rtl";
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key in STEPS)
      next = (i + STEPS[event.key] * (rtl ? -1 : 1) + tabs.length) % tabs.length;
    else return;
    event.preventDefault();
    (event.currentTarget.parentElement!.children[next] as HTMLElement).focus();
    select(next);
  };

  return (
    <div {...props} className={className ? `tabs ${className}` : "tabs"}>
      <div role="tablist" aria-label={label} className="tabs-list">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={tabId(i)}
            type="button"
            role="tab"
            className="tabs-tab"
            aria-selected={i === selected}
            aria-controls={i === selected ? panelId : undefined}
            tabIndex={i === focusable ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={selected >= 0 ? tabId(selected) : undefined}
        tabIndex={0}
        className="tabs-panel"
      >
        {children}
      </div>
    </div>
  );
}
