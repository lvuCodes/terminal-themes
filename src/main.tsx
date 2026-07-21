/*
 * Terminal Themes — macOS-Terminal-inspired palettes as a drop-in theme module.
 * Copyright (C) 2026 lvuCodes
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The palette is imported from the entry module, which is never tree-shaken.
// When the theme lived in app source, Rollup ignored the `sideEffects` globs
// and dropped the barrel's own CSS import, shipping a site with no colour
// tokens; the package's own sideEffects field protects it now, but the entry
// import stays as the belt-and-braces guard (pinned by bundling.test.ts).
import "@lvucodes/ui/theme.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
