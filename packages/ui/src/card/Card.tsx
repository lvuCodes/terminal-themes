// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useId, type ComponentProps, type ReactNode } from "react";
import "./card.css";

export interface CardProps extends Omit<ComponentProps<"section">, "title"> {
  // Rendered as the card's heading and used as the section's accessible name,
  // so a headed card is a landmark region.
  heading?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export function Card({
  heading,
  headingLevel = 2,
  className,
  children,
  "aria-labelledby": labelledBy,
  ...props
}: CardProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  const hasHeading = heading !== undefined && heading !== null && heading !== false;
  return (
    <section
      className={className ? `card ${className}` : "card"}
      aria-labelledby={labelledBy ?? (hasHeading ? headingId : undefined)}
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
