import { defineConfig, devices } from "@playwright/test";

const fixture = (name, port, mode = "development") => ({
  command: `npx vite --config packages/agent-ui/tests/fixtures/${name}/vite.config.mjs --port ${port} --strictPort --mode ${mode}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
});

const layers = [
  { name: "wave-1-react", baseURL: "http://localhost:4310" },
  { name: "wave-1-web", baseURL: "http://localhost:4311" },
];

// CI sets CROSS_BROWSER for scheduled runs and PRs labeled ci:cross-browser.
const crossBrowser =
  process.env.CROSS_BROWSER === "true"
    ? ["Desktop Firefox", "Desktop Safari"].flatMap((device) =>
        layers.map(({ name, baseURL }) => ({
          name: `${name}-${devices[device].defaultBrowserType}`,
          testMatch: "wave-1/**/*.spec.ts",
          use: { ...devices[device], baseURL },
        })),
      )
    : [];

export default defineConfig({
  testDir: "tests/browser",
  outputDir: "artifacts/test-results",
  forbidOnly: !!process.env.CI,
  // A test that passes on retry is reported as flaky, not passed.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    ...layers.map(({ name, baseURL }) => ({ name, testMatch: "wave-1/**/*.spec.ts", use: { baseURL } })),
    {
      name: "wave-1-react-strict",
      testMatch: "wave-1/**/*.spec.ts",
      use: { baseURL: "http://localhost:4312" },
    },
    ...crossBrowser,
  ],
  webServer: [fixture("react", 4310), fixture("web", 4311), fixture("react", 4312, "strict")],
});
