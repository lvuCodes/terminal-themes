import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NCU,
  dependencyChanges,
  formatChanges,
  ignoredUpdates,
  issueBody,
  manifestChanges,
  ncuRuns,
  normalizeDir,
  relevantErrorLines,
  report,
  update,
} from "./dependency-canary.mjs";

const npmUpdate = (directory, ignore) => ({
  "package-ecosystem": "npm",
  directory,
  ignore,
});
const majorOnly = {
  "dependency-name": "typescript",
  "update-types": ["version-update:semver-major"],
};

describe("normalizeDir", () => {
  it("maps dependabot and workflow spellings to one form", () => {
    expect(["/", ".", "./", ""].map(normalizeDir)).toEqual([".", ".", ".", "."]);
    expect(["/site", "site", "./site/", "site/"].map(normalizeDir)).toEqual([
      "site",
      "site",
      "site",
      "site",
    ]);
  });
});

describe("ignoredUpdates", () => {
  it("reads only npm entries for the matching directory", () => {
    const config = {
      updates: [
        npmUpdate("/", [majorOnly]),
        npmUpdate("/site", [{ "dependency-name": "vite" }]),
        {
          "package-ecosystem": "github-actions",
          directory: "/",
          ignore: [{ "dependency-name": "x" }],
        },
      ],
    };
    expect([...ignoredUpdates(config, ".").keys()]).toEqual(["typescript"]);
    expect([...ignoredUpdates(config, "site").keys()]).toEqual(["vite"]);
  });

  it("supports the plural directories key and skips versions-only entries", () => {
    const config = {
      updates: [
        {
          "package-ecosystem": "npm",
          directories: ["/", "/site"],
          ignore: [{ "dependency-name": "react", versions: ["19.3.0"] }, majorOnly],
        },
      ],
    };
    expect([...ignoredUpdates(config, "site").keys()]).toEqual(["typescript"]);
  });

  it("returns nothing for a missing or empty config", () => {
    expect(ignoredUpdates(undefined, ".").size).toBe(0);
    expect(ignoredUpdates({ updates: [npmUpdate("/")] }, ".").size).toBe(0);
  });
});

describe("ncuRuns", () => {
  it("updates everything to latest when nothing is ignored", () => {
    expect(ncuRuns({}, ".")).toEqual([[]]);
  });

  it("caps a semver-major ignore at the newest minor of the current major", () => {
    expect(ncuRuns({ updates: [npmUpdate("/", [majorOnly])] }, ".")).toEqual([
      ["--reject", "typescript"],
      ["--filter", "typescript", "--target", "minor"],
    ]);
  });

  it("caps a major+minor ignore at patch and leaves a fully ignored package alone", () => {
    const config = {
      updates: [
        npmUpdate("/", [
          {
            "dependency-name": "vite",
            "update-types": ["version-update:semver-major", "version-update:semver-minor"],
          },
          { "dependency-name": "@types/*" },
          majorOnly,
        ]),
      ],
    };
    expect(ncuRuns(config, ".")).toEqual([
      ["--reject", "vite,@types/*,typescript"],
      ["--filter", "typescript", "--target", "minor"],
      ["--filter", "vite", "--target", "patch"],
    ]);
  });

  it("merges repeated entries for one package", () => {
    const config = {
      updates: [
        npmUpdate("/", [
          majorOnly,
          { "dependency-name": "typescript", "update-types": ["version-update:semver-minor"] },
        ]),
      ],
    };
    expect(ncuRuns(config, ".")).toEqual([
      ["--reject", "typescript"],
      ["--filter", "typescript", "--target", "patch"],
    ]);
  });
});

describe("dependencyChanges", () => {
  it("lists changed and added ranges across dependency fields", () => {
    const before = { dependencies: { react: "^19.2.6" }, devDependencies: { vite: "^8.0.12" } };
    const after = {
      dependencies: { react: "^19.3.0" },
      devDependencies: { vite: "^8.0.12", vitest: "^4.2.0" },
    };
    expect(dependencyChanges(before, after)).toEqual([
      { name: "react", from: "^19.2.6", to: "^19.3.0" },
      { name: "vitest", from: null, to: "^4.2.0" },
    ]);
  });
});

describe("formatChanges", () => {
  it("prints one bullet per package, naming non-root directories", () => {
    expect(
      formatChanges([
        { dir: ".", name: "react", from: "^19.2.6", to: "^19.3.0" },
        { dir: "site", name: "vitest", from: null, to: "^4.2.0" },
      ]),
    ).toBe("- `react`: `^19.2.6` → `^19.3.0`\n- `vitest` (site): `(new)` → `^4.2.0`");
  });

  it("says so when nothing changed", () => {
    expect(formatChanges([])).toMatch(/nothing to update/);
  });
});

describe("relevantErrorLines", () => {
  it("starts at the first error line so an ERESOLVE keeps the conflicting package", () => {
    const log = [
      "\x1b[32madded 3 packages\x1b[0m",
      "npm error code ERESOLVE",
      "npm error ERESOLVE unable to resolve dependency tree",
      'npm error peer vite@"^7" from @vitejs/plugin-react@5.0.0',
      "",
    ].join("\n");
    expect(relevantErrorLines(log)).toEqual([
      "npm error code ERESOLVE",
      "npm error ERESOLVE unable to resolve dependency tree",
      'npm error peer vite@"^7" from @vitejs/plugin-react@5.0.0',
    ]);
  });

  it("skips passing test lines that merely mention an error", () => {
    const log = " ✓ src/error-boundary.test.tsx (2 tests)\n FAIL src/app.test.tsx\nexpected 1";
    expect(relevantErrorLines(log)).toEqual([" FAIL src/app.test.tsx", "expected 1"]);
  });

  it("caps the excerpt and falls back to the tail when nothing looks like an error", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i}`);
    expect(relevantErrorLines(lines.join("\n"), 5)).toEqual(lines.slice(-5));
    expect(relevantErrorLines(["error"].concat(lines).join("\n"), 3)).toEqual([
      "error",
      "line 0",
      "line 1",
    ]);
  });
});

describe("issueBody", () => {
  it("names the step, the run, the updates, and the error excerpt", () => {
    const body = issueBody({
      step: "Verify",
      changes: [{ dir: ".", name: "vite", from: "^8.0.0", to: "^9.0.0" }],
      errorLines: ["error TS2345"],
      runUrl: "https://github.com/o/r/actions/runs/1",
    });
    expect(body).toContain("failed at **Verify**");
    expect(body).toContain("Run: https://github.com/o/r/actions/runs/1");
    expect(body).toContain("- `vite`: `^8.0.0` → `^9.0.0`");
    expect(body).toContain("```text\nerror TS2345\n```");
  });
});

describe("update", () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "canary-update-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("runs one pinned ncu pass per run, adding workspace flags for a workspace root", () => {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ workspaces: ["packages/ui"] }));
    const config = join(dir, "dependabot.json");
    writeFileSync(config, JSON.stringify({ updates: [npmUpdate("/", [majorOnly])] }));
    const calls = [];
    const run = (cmd, args, opts) => {
      calls.push([cmd, args, opts.cwd]);
      return { status: 0 };
    };
    expect(update(".", config, run, dir)).toBe(0);
    expect(calls).toEqual([
      ["npx", ["--yes", NCU, "-u", "--workspaces", "--root", "--reject", "typescript"], dir],
      [
        "npx",
        [
          "--yes",
          NCU,
          "-u",
          "--workspaces",
          "--root",
          "--filter",
          "typescript",
          "--target",
          "minor",
        ],
        dir,
      ],
    ]);
  });

  it("treats a missing dependabot config as no ignores and stops on the first failure", () => {
    writeFileSync(join(dir, "package.json"), "{}");
    const calls = [];
    const run = (cmd, args) => {
      calls.push(args);
      return { status: null };
    };
    expect(update(".", join(dir, "missing.json"), run, dir)).toBe(1);
    expect(calls).toEqual([["--yes", NCU, "-u"]]);
  });
});

describe("manifestChanges and report", () => {
  let root;
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { env, encoding: "utf8" });

  beforeEach(() => {
    for (const key of Object.keys(process.env)) if (key.startsWith("GIT_")) delete process.env[key];
    root = mkdtempSync(join(tmpdir(), "canary-repo-"));
    git("init", "-q");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    mkdirSync(join(root, "site"));
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { vite: "^8.0.0" } }),
    );
    writeFileSync(join(root, "site", "package.json"), JSON.stringify({ dependencies: { a: "1" } }));
    writeFileSync(join(root, "README.md"), "x");
    git("add", ".");
    git("commit", "-qm", "init");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("diffs every changed manifest against HEAD", () => {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { vite: "^9.0.0" } }),
    );
    writeFileSync(join(root, "site", "package.json"), JSON.stringify({ dependencies: { a: "2" } }));
    writeFileSync(join(root, "README.md"), "y");
    expect(manifestChanges(root)).toEqual([
      { name: "vite", from: "^8.0.0", to: "^9.0.0", dir: "." },
      { name: "a", from: "1", to: "2", dir: "site" },
    ]);
  });

  it("builds the issue body from the step and log files", () => {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { vite: "^9.0.0" } }),
    );
    const step = join(root, "step");
    const log = join(root, "log");
    writeFileSync(step, "Install dependencies\n");
    writeFileSync(log, "npm warn deprecated x\nnpm error code ERESOLVE\n");
    const body = report(root, step, log, {
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: "o/r",
      GITHUB_RUN_ID: "7",
    });
    expect(body).toContain("failed at **Install dependencies**");
    expect(body).toContain("https://github.com/o/r/actions/runs/7");
    expect(body).toContain("- `vite`: `^8.0.0` → `^9.0.0`");
    expect(body).toContain("npm error code ERESOLVE");
  });

  it("still reports when the checkout never happened", () => {
    const body = report(join(root, "absent"), join(root, "no-step"), join(root, "no-log"), {});
    expect(body).toContain("failed at **Set up job**");
    expect(body).toMatch(/nothing to update/);
  });
});
