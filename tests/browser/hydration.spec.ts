import { expect, test } from "@playwright/test";
import { missingNeeds, parityPages } from "../../packages/agent-ui/tests/fixtures/shared/parity.js";
import { manifests } from "../../registry/layers/index.mjs";
import { mismatches } from "./hydration.js";
import { layerOf } from "./layer.js";
import { stableTree } from "./tree.js";

// Each page a layer's manifest reaches server-renders, hydrates without a mismatch warning, and ends up with the
// tree the client-rendered page has (plan D11).
for (const [layer, manifest] of Object.entries(manifests)) {
  const names = [...manifest.components, ...manifest.internals.map((name) => `internal-${name}`)];
  for (const name of names)
    for (const entry of parityPages[name] ?? [])
      test(`${layer}: ${name} ?c=${entry.c}&case=${entry.case}`, async ({ page, browser }, testInfo) => {
        test.skip(layerOf(testInfo) !== layer, `a ${layer} page`);
        const missing = missingNeeds(entry, manifest.components);
        test.skip(missing.length > 0, `${layer} doesn't list ${missing.join(", ")} yet`);
        const { c, case: variant } = entry;
        const warnings = mismatches(page);
        await page.goto(`/?c=${c}&case=${variant}&ssr`);
        await expect(page.locator("#root[data-ssr]")).toBeAttached();
        const client = await browser.newPage({ baseURL: testInfo.project.use.baseURL });
        await client.goto(`/?c=${c}&case=${variant}`);
        expect(await stableTree(page)).toEqual(await stableTree(client));
        expect(warnings).toEqual([]);
        await client.close();
      });
}
