# terminal-themes

Home of **[@lvucodes/ui](packages/ui/)** — the shared component library for the lvucodes.github.io sites — and its showcase site: ten macOS-Terminal-inspired palettes, an ANSI-style categorical ramp, a switcher UI, and `localStorage` persistence. The package's API, exports, and token contract are documented in [packages/ui/README.md](packages/ui/README.md) and [packages/ui/src/theme/README.md](packages/ui/src/theme/README.md).

## Layout

| Path                                                           | Role                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [packages/ui/](packages/ui/)                                   | `@lvucodes/ui` — theme system, `BackLink`, `FooterCredits`, `ThemeSwitcher`, shared lint configs |
| [src/App.tsx](src/App.tsx)                                     | The showcase page: switcher plus live swatches for every token                                   |
| [src/index.css](src/index.css)                                 | Base document styles, all derived from the palette tokens                                        |
| [src/main.tsx](src/main.tsx)                                   | Entry — also imports `@lvucodes/ui/theme.css` so the palette survives tree-shaking               |
| [e2e/](e2e/)                                                   | Playwright iPhone SE smoke suite (from `@lvucodes/ui/se-smoke`)                                  |
| [.github/workflows/site-ci.yml](.github/workflows/site-ci.yml) | Reusable CI (`workflow_call`) every site invokes: `verify` + the SE smoke gate                   |

The site consumes the package through the npm workspace exactly the way external repos consume it from npm.

## Commands

| Command                    | Effect                                                           |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`              | Build the package, then Vite dev server                          |
| `npm run build`            | Build the package, typecheck, build the site to `dist/`          |
| `npm run preview`          | Serve the built bundle                                           |
| `npm test`                 | Run the site's vitest suite once                                 |
| `npm test -w @lvucodes/ui` | Run the package's suite                                          |
| `npm run lint`             | ESLint + stylelint over the repo                                 |
| `npm run format:check`     | Prettier check (CSS excluded — stylelint owns CSS)               |
| `npm run smoke`            | Build, then the Playwright iPhone SE smoke suite                 |
| `npm run verify`           | The full gate set: package verify + lint + format + test + build |

## Branch flow

`dev` is the default working branch; CI runs there. `main` is deploy-only: a linear fast-forward from `dev` (gated on `verify` and the SE smoke suite being green) that triggers the Pages deploy.

## License

GNU General Public License v3.0 or later — see [LICENSE](LICENSE). Copyright © 2026 lvuCodes.

Copyleft applies to the package as well: `@lvucodes/ui` is published under GPL-3.0-or-later, and a project that vendors it must also be licensed GPL-3.0-or-later and make its source available.
