import { defineConfig, devices } from "@playwright/test";
import { fixtureIdentity, identityPath } from "./packages/agent-ui/tests/fixtures/identity.mjs";

// The React, Web and StrictMode fixture servers listen on three ports from a base. A server is reused only when it
// answers with this worktree's identity, so parallel worktrees never test each other's code; otherwise the first
// base whose three ports are free is taken. `KIND_FIXTURE_PORT_BASE` fixes the base for a run. Workers load this
// file again and inherit the base the runner chose.
const servers = [
  { name: "react", mode: "development" },
  { name: "web", mode: "development" },
  { name: "react", mode: "strict" },
];

async function probe(port, identity) {
  try {
    const response = await fetch(`http://localhost:${port}${identityPath}`, {
      signal: AbortSignal.timeout(2000),
    });
    return (await response.text()) === identity ? "ours" : "taken";
  } catch (error) {
    return error.cause?.code === "ECONNREFUSED" ? "free" : "taken";
  }
}

const ports = (base) =>
  Promise.all(servers.map(({ name, mode }, index) => probe(base + index, fixtureIdentity(name, mode))));
const ours = (found) => !process.env.CI && found.every((state) => state === "ours");

async function pickBase() {
  const fixed = process.env.KIND_FIXTURE_PORT_BASE;
  if (fixed !== undefined) {
    const base = Number(fixed);
    if (!Number.isInteger(base) || base < 1 || base > 65533)
      throw new Error(`KIND_FIXTURE_PORT_BASE must be a port number, got "${fixed}"`);
    return { base, reuse: ours(await ports(base)) };
  }
  for (let base = 4310; base < 4310 + 1000; base += 10) {
    const found = await ports(base);
    if (ours(found) || found.every((state) => state === "free")) return { base, reuse: ours(found) };
  }
  throw new Error("no free fixture ports between 4310 and 5310; set KIND_FIXTURE_PORT_BASE");
}

const { base, reuse } = await pickBase();
process.env.KIND_FIXTURE_PORT_BASE = String(base);
const origin = (index) => `http://localhost:${base + index}`;

const webServer = servers.map(({ name, mode }, index) => ({
  command: `npx vite --config packages/agent-ui/tests/fixtures/${name}/vite.config.mjs --port ${base + index} --strictPort --mode ${mode}`,
  url: origin(index),
  reuseExistingServer: reuse,
}));

const waves = ["wave-1", "wave-2", "wave-3", "wave-4", "wave-5"];
const layers = waves.flatMap((wave) => [
  { name: `${wave}-react`, wave, baseURL: origin(0) },
  { name: `${wave}-web`, wave, baseURL: origin(1) },
]);

// CI sets CROSS_BROWSER for scheduled runs and PRs labeled ci:cross-browser.
const crossBrowser =
  process.env.CROSS_BROWSER === "true"
    ? ["Desktop Firefox", "Desktop Safari"].flatMap((device) =>
        layers.map(({ name, wave, baseURL }) => ({
          name: `${name}-${devices[device].defaultBrowserType}`,
          testMatch: `${wave}/**/*.spec.ts`,
          use: { ...devices[device], baseURL },
        })),
      )
    : [];

// Each run writes traces into its own folder, since a run clears its output folder as it starts and would delete
// the traces another run is writing. Workers load this file again and inherit the runner's environment.
process.env.KIND_TEST_RUN ??= `${Date.now()}-${process.pid}`;

export default defineConfig({
  testDir: "tests/browser",
  outputDir: `artifacts/test-results/${process.env.KIND_TEST_RUN}`,
  forbidOnly: !!process.env.CI,
  // A test that passes on retry is reported as flaky, not passed.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    ...layers.map(({ name, wave, baseURL }) => ({
      name,
      testMatch: `${wave}/**/*.spec.ts`,
      use: { baseURL },
    })),
    ...waves.map((wave) => ({
      name: `${wave}-react-strict`,
      testMatch: `${wave}/**/*.spec.ts`,
      use: { baseURL: origin(2) },
    })),
    ...crossBrowser,
  ],
  webServer,
});
