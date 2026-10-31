# AI Usage

**100% AI, 0% human**, by lines added since the baseline commit.

| Measure | Lines added |
|---|---|
| **By Claude** | 294 |
| **By the author** | 0 |
| **Total since baseline** | 294 |

Baseline commit `6d61098` (2026-10-30). Regenerate with `node scripts/ai-attribution.mjs`.

## Measurement Scope

- The figures count **lines added since the baseline commit**, not lines currently surviving in the working tree. A line written once and rewritten twice is counted three times.
- Everything committed **before the baseline** is unattributed and appears in no column. Authorship there cannot be honestly reconstructed, so it is not guessed at.
- Claude's lines are the larger of two counts: edits the ledger recorded through **Claude Code's own editing tools**, and every line added by a commit carrying a `Co-Authored-By: Claude` trailer. Anything else counts as the author's.
- A line count is **not a claim about authorship of design or direction**. What to build, which generated output to keep, and what to reject are the author's, and none of it appears in a diff.
- Figures are computed from `.ai-attribution/ledger.jsonl` — an append-only record written as each edit lands — joined against `git log --numstat`. The ledger is committed as the evidence behind this report.

## Excluded Paths

- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `dist/**`
- `build/**`
- `vendor/**`
- `**/*.min.*`
- `AI-USAGE.md`
- `.ai-attribution/**`

_Generated 2026-10-31 00:49:16Z.
