// The ANSI slot catalog and the UI-role → slot map, kept as data so the panel
// stays declarative and the mapping is assertable in tests.
//
// The role map is transcribed from the dark-ansi reverse map in
// reference-material/ansi — the slot each Claude Code UI token actually reads.
// Light profiles use the same roles against the normal (0–7) slots; that switch
// happens in CSS via the --ansi-ui-* indirection, not here.

export const ANSI_SLOTS = [
  { slot: 0, name: "black" },
  { slot: 1, name: "red" },
  { slot: 2, name: "green" },
  { slot: 3, name: "yellow" },
  { slot: 4, name: "blue" },
  { slot: 5, name: "magenta" },
  { slot: 6, name: "cyan" },
  { slot: 7, name: "white" },
  { slot: 8, name: "blackBright" },
  { slot: 9, name: "redBright" },
  { slot: 10, name: "greenBright" },
  { slot: 11, name: "yellowBright" },
  { slot: 12, name: "blueBright" },
  { slot: 13, name: "magentaBright" },
  { slot: 14, name: "cyanBright" },
  { slot: 15, name: "whiteBright" },
] as const;

export type AnsiSlot = (typeof ANSI_SLOTS)[number]["slot"];

// UI role → the dark-ansi slot it resolves to. The paired light-ansi slot is the
// same hue minus 8 (except `text`/`inverse`/`dim`, which invert — see themes.css).
export const ROLE_SLOTS = {
  claude: 9,
  error: 9,
  fast: 9,
  success: 10,
  warning: 11,
  permission: 12,
  suggestion: 12,
  plan: 14,
  autoAccept: 13,
  bashBorder: 13,
  diffRemoved: 1,
  diffAdded: 2,
  diffRemovedWord: 9,
  diffAddedWord: 10,
  text: 15,
  dim: 7,
  inverse: 0,
} as const satisfies Record<string, AnsiSlot>;

export type Role = keyof typeof ROLE_SLOTS;

// The `[09:01]` slot tag the reference prints beside each sample: the dark slot
// and the light slot it pairs with. Inverting roles are shown as their true pair
// rather than a mechanical -8.
const INVERTING: Partial<Record<Role, AnsiSlot>> = { text: 0, dim: 8, inverse: 7 };

const pad = (n: number) => String(n).padStart(2, "0");

export function slotTag(role: Role): string {
  const dark = ROLE_SLOTS[role];
  const light = INVERTING[role] ?? ((dark >= 8 ? dark - 8 : dark) as AnsiSlot);
  return `[${pad(dark)}:${pad(light)}]`;
}
