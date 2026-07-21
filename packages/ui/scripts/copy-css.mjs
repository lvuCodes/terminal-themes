// Mirror the stylesheet tree into dist/ after tsc emits the JS. The emitted
// modules keep their relative `import "./x.css"` side-effect specifiers, so the
// CSS must sit at the same paths next to them.
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
cpSync(`${root}src`, `${root}dist`, {
  recursive: true,
  filter: (src) => src.endsWith(".css") || !/\.[^/]+$/.test(src),
});
