import { defineConfig, devices } from "@playwright/test";
import { fixtureIdentity, identityPath } from "./packages/agent-ui/tests/fixtures/identity.mjs";
import { manifests, selectedLayers } from "./registry/layers/index.mjs";

// One fixture server per layer on consecutive ports, reused only when it answers with this worktree's identity, so
// parallel worktrees never test each other's code. A Vue, Svelte or Solid server starts only once its manifest lists
// a spec. Workers load this file again and inherit the base and `KIND_LAYERS` the runner chose.
const allServers = [
  { layer: "react", mode: "development" },
  { layer: "web", mode: "development" },
  { layer: "react", mode: "strict" },
  { layer: "vue", mode: "development" },
  { layer: "svelte", mode: "development" },
  { layer: "solid", mode: "development" },
].map((server, index) => ({ ...server, index }));

const layers = selectedLayers();
const specsOf = (layer) => manifests[layer]?.specs ?? [];
// `parity.spec.ts` compares each layer with React's page, so a layer that runs it starts React's server too.
const parity = layers.some((layer) => manifests[layer] && specsOf(layer).includes("parity.spec.ts"));
const servers = allServers.filter(({ layer, mode }) =>
  layers.includes(layer)
    ? !manifests[layer] || specsOf(layer).length > 0
    : layer === "react" && mode === "development" && parity,
);

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
  Promise.all(servers.map(({ layer, mode, index }) => probe(base + index, fixtureIdentity(layer, mode))));
const ours = (found) => !process.env.CI && found.every((state) => state === "ours");

async function pickBase() {
  const fixed = process.env.KIND_FIXTURE_PORT_BASE;
  if (fixed !== undefined) {
    const base = Number(fixed);
    if (!Number.isInteger(base) || base < 1 || base > 65530)
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
process.env.KIND_LAYERS = layers.join(",");
const origin = (index) => `http://localhost:${base + index}`;
const originOf = (layer) => origin(allServers.find((server) => server.layer === layer).index);

// `tests/browser/warm-up.ts` reads which servers to warm.
process.env.KIND_FIXTURE_SERVERS = JSON.stringify(
  servers.map(({ layer, index }) => ({ layer, url: origin(index) })),
);

const webServer = servers.map(({ layer, mode, index }) => ({
  command: `npx vite --config packages/agent-ui/tests/fixtures/${layer}/vite.config.mjs --port ${base + index} --strictPort --mode ${mode}`,
  url: origin(index),
  reuseExistingServer: reuse,
}));

// React and Web run every spec in a wave's folder; the other layers run only the specs their manifest lists, and
// the root-level specs (`parity.spec.ts`, `hydration.spec.ts`) in a `root-<layer>` project. A project with no specs
// matches nothing.
const nothing = /^$/;
const waves = ["wave-1", "wave-2", "wave-3", "wave-4", "wave-5", "wave-6"];
const testMatchOf = (layer, folder) => {
  if (!manifests[layer]) return `${folder}/**/*.spec.ts`;
  const specs = specsOf(layer).filter((spec) =>
    folder ? spec.startsWith(`${folder}/`) : !spec.includes("/"),
  );
  return specs.length ? specs : nothing;
};
const layerProjects = layers.flatMap((layer) => [
  ...waves.map((wave) => ({ name: `${wave}-${layer}`, testMatch: testMatchOf(layer, wave), layer })),
  ...(manifests[layer] ? [{ name: `root-${layer}`, testMatch: testMatchOf(layer, ""), layer }] : []),
]);

// CI sets CROSS_BROWSER for scheduled runs and PRs labeled ci:cross-browser.
const crossBrowser =
  process.env.CROSS_BROWSER === "true"
    ? ["Desktop Firefox", "Desktop Safari"].flatMap((device) =>
        layerProjects.map(({ name, testMatch, layer }) => ({
          name: `${name}-${devices[device].defaultBrowserType}`,
          testMatch,
          use: { ...devices[device], baseURL: originOf(layer) },
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
    ...layerProjects.map(({ name, testMatch, layer }) => ({
      name,
      testMatch,
      use: { baseURL: originOf(layer) },
    })),
    ...(layers.includes("react")
      ? waves.map((wave) => ({
          name: `${wave}-react-strict`,
          testMatch: `${wave}/**/*.spec.ts`,
          use: { baseURL: origin(2) },
        }))
      : []),
    ...crossBrowser,
  ],
  webServer,
  // Runs once the servers answer and before any worker starts.
  globalSetup: "./tests/browser/warm-up.ts",
});
