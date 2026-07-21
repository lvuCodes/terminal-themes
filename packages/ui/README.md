# @lvucodes/ui

Shared UI for the [lvucodes.github.io](https://lvucodes.github.io) family of sites. **Personal infrastructure** — published publicly so the sites can install it from npm, but versioned and evolved for exactly those consumers; no stability promises are made to anyone else.

Lives in the [terminal-themes](https://github.com/lvuCodes/terminal-themes) repo alongside its showcase site. GPL-3.0-or-later.

## Contents

| Export                   | Contents                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lvucodes/ui`           | `BackLink`, `FooterCredits`, `ThemeSwitcher`, the theme system (`useTheme`, `useAnsiMode`, `applyTheme`, `THEMES`, …); importing it side-effect-loads the palette stylesheet and the shared `.pill` primitive |
| `@lvucodes/ui/theme.css` | The palette stylesheet alone, for non-React consumers                                                                                                                                                         |
| `@lvucodes/ui/se-smoke`  | `defineSeSmoke` — the shared iPhone SE (375×667) Playwright smoke suite gating every site's `dev` → `main` merge                                                                                              |
| `@lvucodes/ui/eslint`    | Shared eslint flat config                                                                                                                                                                                     |
| `@lvucodes/ui/stylelint` | Shared stylelint config (extend it from `.stylelintrc.json`)                                                                                                                                                  |
| `@lvucodes/ui/prettier`  | Shared prettier settings (reference it from the `"prettier"` key in `package.json`; CSS is excluded from prettier — stylelint owns CSS)                                                                       |

## Usage

```tsx
import { BackLink, FooterCredits, ThemeSwitcher, useTheme } from "@lvucodes/ui";

function App() {
  const [theme, setTheme] = useTheme();
  return (
    <main className="page">
      <BackLink />
      <ThemeSwitcher theme={theme} onChange={setTheme} />
      {/* … */}
      <FooterCredits licenseHref="https://github.com/lvuCodes/<repo>/blob/main/LICENSE" />
    </main>
  );
}
```

The token contract (`--bg`, `--panel`, `--text`, `--accent`, `--item-0…10`, the ANSI slots) is documented in [the theme module README](https://github.com/lvuCodes/terminal-themes/blob/main/packages/ui/src/theme/README.md). `BackLink` renders at `position: absolute; top: 20px; left: 20px` against the document, so the page needs no positioned wrapper.

Lint config wiring in a consumer:

```js
// eslint.config.js
import lvucodes from "@lvucodes/ui/eslint";
export default lvucodes;
```

```json
// .stylelintrc.json
{ "extends": "@lvucodes/ui/stylelint" }
```

```json
// package.json
{ "prettier": "@lvucodes/ui/prettier" }
```

Smoke spec in a consumer (requires `@playwright/test`):

```ts
// e2e/se-smoke.spec.ts
import { defineSeSmoke } from "@lvucodes/ui/se-smoke";
defineSeSmoke();
```
