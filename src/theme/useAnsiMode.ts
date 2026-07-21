// Terminal Themes. Copyright (C) 2026 lvuCodes. Licensed under GPL-3.0-or-later; see LICENSE.

import { useEffect, useState } from "react";
import { applyAnsiMode, naturalAnsiMode, type AnsiMode, type ThemeId } from "./theme";

// React binding for the ANSI half-palette override. The mode follows whichever
// half the active profile naturally uses, and resets to it whenever the profile
// changes — so picking a new profile always starts from how that profile really
// looks, and the toggle is a deliberate departure from it rather than sticky
// state that quietly misrepresents the next profile.
//
//   const [ansiMode, setAnsiMode] = useAnsiMode(theme);
export function useAnsiMode(theme: ThemeId): [AnsiMode, (mode: AnsiMode) => void] {
  const [mode, setMode] = useState<AnsiMode>(() => naturalAnsiMode(theme));

  // Adjust during render rather than in an effect: the reset is derived from the
  // theme, not a side effect of it, and doing it here avoids rendering one frame
  // with the previous profile's half still selected.
  const [prevTheme, setPrevTheme] = useState<ThemeId>(theme);
  if (prevTheme !== theme) {
    setPrevTheme(theme);
    setMode(naturalAnsiMode(theme));
  }

  useEffect(() => {
    applyAnsiMode(mode);
  }, [mode]);

  return [mode, setMode];
}
