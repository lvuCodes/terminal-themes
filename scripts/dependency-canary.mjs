#!/usr/bin/env node
// Helpers for the reusable dependency-canary workflow. Zero-dependency so the
// workflow can run it from a sparse checkout without installing anything.
//
//   node scripts/dependency-canary.mjs update <dir> <dependabot.json>
//   node scripts/dependency-canary.mjs changes <repo>
//   node scripts/dependency-canary.mjs report <repo> <step-file> <log-file>
//
// <dependabot.json> is .github/dependabot.yml converted with `yq -o=json`.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const NCU = "npm-check-updates@23.1.1";

const MAJOR = "version-update:semver-major";
const MINOR = "version-update:semver-minor";
const PATCH = "version-update:semver-patch";
const DEP_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

const isMain = (metaUrl) => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(metaUrl)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
};

// Dependabot writes "/" and "/site"; the workflow passes "." and "site".
export const normalizeDir = (dir) => dir.replace(/^\.?\/+|\/+$/g, "") || ".";

// Dependency name -> the update types its dependabot `ignore` entries block. An entry
// without `update-types` blocks every update, except a `versions`-only entry, which
// pins out specific releases the canary cannot express and so leaves the package free.
export const ignoredUpdates = (dependabot, dir) => {
  const target = normalizeDir(dir);
  const blocked = new Map();
  for (const update of dependabot?.updates ?? []) {
    if (update["package-ecosystem"] !== "npm") continue;
    const dirs = update.directories ?? [update.directory ?? "/"];
    if (!dirs.some((d) => normalizeDir(d) === target)) continue;
    for (const rule of update.ignore ?? []) {
      const name = rule["dependency-name"];
      if (!name || (rule.versions && !rule["update-types"])) continue;
      const types = blocked.get(name) ?? new Set();
      for (const type of rule["update-types"] ?? [MAJOR, MINOR, PATCH]) types.add(type);
      blocked.set(name, types);
    }
  }
  return blocked;
};

// One argument list per ncu pass: everything except the ignored packages to latest,
// then each capped package to the newest version its ignore rules still allow.
export const ncuRuns = (dependabot, dir) => {
  const blocked = ignoredUpdates(dependabot, dir);
  const capped = { minor: [], patch: [] };
  for (const [name, types] of blocked) {
    if (types.has(PATCH)) continue;
    capped[types.has(MINOR) ? "patch" : "minor"].push(name);
  }
  const runs = [blocked.size ? ["--reject", [...blocked.keys()].join(",")] : []];
  for (const [level, names] of Object.entries(capped)) {
    if (names.length) runs.push(["--filter", names.join(","), "--target", level]);
  }
  return runs;
};

export const update = (dir, dependabotPath, run = spawnSync, root = ".") => {
  const dependabot = existsSync(dependabotPath)
    ? JSON.parse(readFileSync(dependabotPath, "utf8"))
    : {};
  const pkg = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
  const scope = pkg.workspaces ? ["--workspaces", "--root"] : [];
  for (const args of ncuRuns(dependabot, dir)) {
    const { status } = run("npx", ["--yes", NCU, "-u", ...scope, ...args], {
      cwd: join(root, dir),
      stdio: "inherit",
    });
    if (status !== 0) return status ?? 1;
  }
  return 0;
};

export const dependencyChanges = (before, after) => {
  const changes = [];
  for (const field of DEP_FIELDS) {
    for (const [name, to] of Object.entries(after?.[field] ?? {})) {
      const from = before?.[field]?.[name];
      if (from !== to) changes.push({ name, from: from ?? null, to });
    }
  }
  return changes;
};

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });

export const manifestChanges = (root) => {
  const paths = git(root, ["diff", "--name-only", "HEAD"])
    .split("\n")
    .filter((p) => p === "package.json" || p.endsWith("/package.json"));
  return paths.flatMap((path) => {
    let before = {};
    try {
      before = JSON.parse(git(root, ["show", `HEAD:${path}`]));
    } catch {
      /* a manifest new since HEAD changes from nothing */
    }
    const after = JSON.parse(readFileSync(join(root, path), "utf8"));
    const dir = path === "package.json" ? "." : path.slice(0, -"/package.json".length);
    return dependencyChanges(before, after).map((c) => ({ ...c, dir }));
  });
};

export const formatChanges = (changes) =>
  changes.length
    ? changes
        .map(
          ({ dir, name, from, to }) =>
            `- \`${name}\`${dir === "." ? "" : ` (${dir})`}: \`${from ?? "(new)"}\` → \`${to}\``,
        )
        .join("\n")
    : "None. npm-check-updates found nothing to update.";

const RELEVANT =
  /ERR!|ERESOLVE|npm error|\berror\b|Error:|\bFAIL(?:ED)?\b|\bfailed\b|×|✗|Could not resolve|\[warn\]/i;

// The failing step's output from its first error-looking line, so an ERESOLVE keeps
// the conflicting package it names. Output with no such line falls back to its tail.
export const relevantErrorLines = (log, max = 40) => {
  // eslint-disable-next-line no-control-regex
  const lines = log.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").split("\n");
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  const start = lines.findIndex((l) => RELEVANT.test(l) && !/^\s*✓/.test(l));
  return start === -1 ? lines.slice(-max) : lines.slice(start, start + max);
};

export const issueBody = ({ step, changes, errorLines, runUrl }) =>
  [
    `The weekly dependency canary failed at **${step}**.`,
    "",
    `Run: ${runUrl}`,
    "",
    "### Updated packages",
    "",
    formatChanges(changes),
    "",
    "### Error output",
    "",
    "```text",
    ...errorLines,
    "```",
    "",
  ].join("\n");

const readOr = (path, fallback) => (existsSync(path) ? readFileSync(path, "utf8") : fallback);

export const report = (root, stepFile, logFile, env = process.env) => {
  let changes = [];
  try {
    changes = manifestChanges(root);
  } catch {
    /* the checkout itself failed, so nothing was updated */
  }
  return issueBody({
    step: readOr(stepFile, "Set up job").trim(),
    changes,
    errorLines: relevantErrorLines(readOr(logFile, "")),
    runUrl: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
  });
};

export const main = (argv) => {
  const [command, ...args] = argv;
  if (command === "update") return update(args[0], args[1]);
  if (command === "changes") {
    console.log(formatChanges(manifestChanges(args[0])));
    return 0;
  }
  if (command === "report") {
    process.stdout.write(report(args[0], args[1], args[2]));
    return 0;
  }
  console.error("usage: dependency-canary.mjs update|changes|report ...");
  return 2;
};

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
