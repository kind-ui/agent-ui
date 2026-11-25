import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Each version is a commit of this repository, checked out on its own outside the workspace, so
// it installs exactly the UI SDK its lockfile pins.
export const versions = {
  before: { ref: "5852177d", label: "0.7.2 on main before #189, UI SDK 0.1.0-beta.1" },
  after: { ref: "7a0127ff", label: "main after #189, UI SDK 0.1.0-beta.17" },
};

const repo = path.resolve(import.meta.dirname, "../../..");
const app = path.resolve(import.meta.dirname, "../app");
const home = path.join(tmpdir(), "kind-agent-benchmark");

const sh = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: ["ignore", "ignore", "inherit"] });

/** Checks out the version, installs it and copies the benchmark app into it. Returns its folder. */
export function prepare(name) {
  const { ref } = versions[name];
  const dir = path.join(home, `${name}-${ref}`);
  if (!existsSync(dir)) {
    mkdirSync(home, { recursive: true });
    sh("git", ["worktree", "add", "--detach", dir, ref], repo);
  }
  if (!existsSync(path.join(dir, "node_modules"))) sh("npm", ["ci", "--no-audit", "--no-fund"], dir);
  const target = path.join(dir, "benchmarks/agent-app");
  for (const entry of ["src", "index.html", "package.json", "vite.config.mjs"]) {
    rmSync(path.join(target, entry), { recursive: true, force: true });
    cpSync(path.join(app, entry), path.join(target, entry), { recursive: true });
  }
  if (!existsSync(path.join(target, "node_modules/@ai-sdk/mcp"))) {
    sh("npm", ["install", "--no-audit", "--no-fund", "--no-package-lock"], target);
  }
  return dir;
}

/** Serves the version's app on `port` until `stop` is called. */
export async function serve(dir, port) {
  const target = path.join(dir, "benchmarks/agent-app");
  const child = spawn(
    process.execPath,
    [path.join(dir, "node_modules/vite/bin/vite.js"), "--port", String(port), "--strictPort"],
    { cwd: target, stdio: "ignore" },
  );
  const url = `http://localhost:${port}`;
  for (let tries = 0; tries < 240; tries++) {
    const ok = await fetch(url).then(
      (response) => response.text().then((html) => html.includes('name="agent-benchmark"')),
      () => false,
    );
    if (ok) return { url, stop: () => child.kill() };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  child.kill();
  throw new Error(`The app in ${dir} didn't start on ${port}.`);
}
