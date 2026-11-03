// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.
//
// Test-only helpers for asserting on a component stylesheet's selectors. Shared
// by every component whose skin must stay at zero specificity, so a consuming
// site's own class always wins regardless of stylesheet order.

function splitTopLevel(text: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

// Every selector in the sheet, with multi-line lists split into their parts and
// at-rule preludes (@media, @supports) skipped.
export function selectorsOf(source: string) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return code.split("}").flatMap((chunk) => {
    const open = chunk.lastIndexOf("{");
    if (open < 0) return [];
    const prelude = chunk.slice(0, open).split("{").pop()!.trim();
    return prelude.startsWith("@") ? [] : splitTopLevel(prelude);
  });
}

// True only when the whole selector is one :where(...) group, which has zero
// specificity, optionally followed by one pseudo-element (0,0,1, still below
// any caller class). `:where(a):hover` and `:where(a), :is(b)` both fail.
export function isSingleWhere(rawSelector: string) {
  const selector = rawSelector.replace(/::[a-z-]+$/, "");
  if (!selector.startsWith(":where(")) return false;
  let depth = 0;
  for (let i = 6; i < selector.length; i++) {
    if (selector[i] === "(") depth++;
    else if (selector[i] === ")" && --depth === 0) return i === selector.length - 1;
  }
  return false;
}

// The declaration block of the rule whose whole prelude is exactly `selector`,
// ignoring comments, so a longer selector ending in the same text never matches.
export function ruleBody(source: string, selector: string) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const chunk of code.split("}")) {
    const open = chunk.lastIndexOf("{");
    if (open < 0) continue;
    const prelude = chunk.slice(0, open).split("{").pop()!.trim();
    if (prelude === selector) return chunk.slice(open + 1);
  }
  throw new Error(`no rule for ${selector}`);
}
