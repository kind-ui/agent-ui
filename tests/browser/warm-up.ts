import { chromium } from "@playwright/test";
import { parityPages } from "../../packages/agent-ui/tests/fixtures/shared/parity.js";
import { manifests } from "../../registry/layers/index.mjs";

type Server = { layer: string; url: string };

// Vite transforms a fixture's modules on first request, so a cold server takes seconds per page under load: the
// agent pages fetch over 400 modules, and Solid's first server render takes about 6 s. The first test in every
// worker paid that inside its 30 s timeout. Each server loads the pages that reach its module graph once, before
// any test starts: React's and Web's agent page imports nearly every render file, and a manifest layer loads one
// parity page per case module, client-rendered and server-rendered.
const pagesOf = (layer: string): string[] => {
  const manifest = manifests[layer as keyof typeof manifests];
  if (!manifest) return ["/?c=agent&case=all"];
  const names = [...manifest.components, ...manifest.internals.map((name) => `internal-${name}`)];
  const byCase = new Map(
    names.flatMap((name) => (parityPages[name] ?? []).map((page) => [page.c, page.case])),
  );
  return [...byCase].flatMap(([c, variant]) => [`/?c=${c}&case=${variant}`, `/?c=${c}&case=${variant}&ssr`]);
};

export default async function warmUp() {
  const servers: Server[] = JSON.parse(process.env.KIND_FIXTURE_SERVERS ?? "[]");
  const browser = await chromium.launch();
  try {
    await Promise.all(
      servers.flatMap(({ layer, url }) => {
        const queue = pagesOf(layer);
        return Array.from({ length: Math.min(4, queue.length) }, async () => {
          const page = await browser.newPage({ baseURL: url });
          for (let path = queue.shift(); path; path = queue.shift())
            await page.goto(path, { timeout: 120_000 });
          await page.close();
        });
      }),
    );
  } finally {
    await browser.close();
  }
}
