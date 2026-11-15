import { defineConfig, devices } from "@playwright/test";

const fixture = (name, port, mode = "development") => ({
  command: `npx vite --config packages/agent-ui/tests/fixtures/${name}/vite.config.mjs --port ${port} --strictPort --mode ${mode}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
});

export default defineConfig({
  testDir: "tests/browser",
  outputDir: "artifacts/test-results",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    { name: "wave-1-react", testMatch: "wave-1/**/*.spec.ts", use: { baseURL: "http://localhost:4310" } },
    { name: "wave-1-web", testMatch: "wave-1/**/*.spec.ts", use: { baseURL: "http://localhost:4311" } },
    {
      name: "wave-1-react-strict",
      testMatch: "wave-1/**/*.spec.ts",
      use: { baseURL: "http://localhost:4312" },
    },
  ],
  webServer: [fixture("react", 4310), fixture("web", 4311), fixture("react", 4312, "strict")],
});
