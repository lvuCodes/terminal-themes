// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useId, type ComponentProps, type ReactNode } from "react";
import "./card.css";

export interface CardProps extends Omit<ComponentProps<"section">, "title"> {
  // Rendered as the card's heading and used as the section's accessible name,
  // so a headed card is a landmark region. A caller's aria-labelledby or
  // aria-label names it instead; pass role="none" in a grid of many cards to
  // keep them out of landmark navigation.
  heading?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export function Card({
  heading,
  headingLevel = 2,
  className,
  children,
  "aria-labelledby": labelledBy,
  "aria-label": label,
  ...props
}: CardProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  const hasHeading = heading != null && typeof heading !== "boolean" && heading !== "";
  return (
    <section
      className={className ? `card ${className}` : "card"}
      aria-label={label}
      aria-labelledby={labelledBy ?? (hasHeading && !label ? headingId : undefined)}
      {...props}
    >
      {hasHeading && (
        <Heading id={headingId} className="card-heading">
          {heading}
        </Heading>
      )}
      {children}
    </section>
  );
}
