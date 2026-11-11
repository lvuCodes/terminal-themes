// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { type ComponentProps, type ReactNode } from "react";
import "./about-panel.css";

export interface AboutSection {
  // Stable key for a list that is reordered or filtered while a section holds
  // stateful content. Defaults to the position.
  id?: string;
  // Heading text, which may carry markup such as <span lang="zh">.
  title: ReactNode;
  content: ReactNode;
}

// className and every other prop not listed here go on the region.
export interface AboutPanelProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  sections: readonly AboutSection[];
  // Accessible name of the region. Pass null inside a shell that is already a
  // named landmark (a sidebar or dialog), so the panel adds no second one.
  label?: string | null;
  // Level of each subsection heading, to fit the page's outline.
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

// The panel is one named region. Its subsections are plain groups under real
// headings rather than nested regions, so a screen reader's landmark list
// shows a single About entry and its heading list shows each subsection.
export function AboutPanel({
  sections,
  label = "About",
  headingLevel = 2,
  className,
  ...props
}: AboutPanelProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      aria-label={label ?? undefined}
      {...props}
      className={className ? `about-panel ${className}` : "about-panel"}
    >
      {sections.map((s, i) => (
        <div key={s.id ?? i} className="about-panel-section">
          <Heading className="about-panel-heading">{s.title}</Heading>
          <div className="about-panel-body">{s.content}</div>
        </div>
      ))}
    </section>
  );
}

export interface AboutListItem {
  // One term, or an array of terms (such as a Chinese name and its English
  // gloss) rendered as one <dt> each.
  term: ReactNode | readonly ReactNode[];
  description: ReactNode;
}

export interface AboutListProps extends Omit<ComponentProps<"dl">, "children"> {
  items: readonly AboutListItem[];
}

// A glossary as a description list, each term and its description wrapped
// together so they stay paired when the list wraps.
export function AboutList({ items, className, ...props }: AboutListProps) {
  return (
    <dl {...props} className={className ? `about-list ${className}` : "about-list"}>
      {items.map((item, i) => (
        <div key={i} className="about-list-item">
          {(Array.isArray(item.term) ? item.term : [item.term]).map((term, j) => (
            <dt key={j} className="about-list-term">
              {term}
            </dt>
          ))}
          <dd className="about-list-description">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
