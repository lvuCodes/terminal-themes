# terminal-themes

A standalone site for the terminal theme + ANSI color module — nine macOS-Terminal-inspired palettes, an ANSI-style categorical ramp, a switcher UI, and `localStorage` persistence. The module itself lives in [src/theme/](src/theme/) and is a drop-in folder with no dependency on this site; see [src/theme/README.md](src/theme/README.md) for its API and token contract.

## Layout

| Path | Role |
|---|---|
| [src/theme/](src/theme/) | The drop-in module — palettes, core, React binding, switcher |
| [src/App.tsx](src/App.tsx) | The showcase page: switcher plus live swatches for every token |
| [src/index.css](src/index.css) | Base document styles, all derived from the palette tokens |
| [src/main.tsx](src/main.tsx) | Entry — also imports `theme/themes.css` so the palette survives tree-shaking |

## Commands

| Command | Effect |
|---|---|
| `npm run dev` | Vite dev server, opens a browser |
| `npm run build` | Typecheck then build to `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm test` | Run the vitest suite once |
| `npm run test:coverage` | Run with coverage and enforce thresholds |
| `npm run lint` | ESLint over the project |

## License

GNU General Public License v3.0 or later — see [LICENSE](LICENSE). Copyright © 2026 lvuCodes.

Copyleft applies to the theme module as well: a project that copies [src/theme/](src/theme/) into itself must also be licensed GPL-3.0-or-later and make its source available.
