import { defineConfig, devices } from "@playwright/test";

const fixture = (name, port, mode = "development") => ({
  command: `npx vite --config packages/agent-ui/tests/fixtures/${name}/vite.config.mjs --port ${port} --strictPort --mode ${mode}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
});

const waves = ["wave-1", "wave-2", "wave-3", "wave-4"];
const layers = waves.flatMap((wave) => [
  { name: `${wave}-react`, wave, baseURL: "http://localhost:4310" },
  { name: `${wave}-web`, wave, baseURL: "http://localhost:4311" },
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
      use: { baseURL: "http://localhost:4312" },
    })),
    ...crossBrowser,
  ],
  webServer: [fixture("react", 4310), fixture("web", 4311), fixture("react", 4312, "strict")],
});
