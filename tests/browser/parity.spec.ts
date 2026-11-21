import { expect, type Page, test } from "@playwright/test";
import {
  missingNeeds,
  type ParityPage,
  type ParityStep,
  parityPages,
} from "../../packages/agent-ui/tests/fixtures/shared/parity.js";
import { manifests } from "../../registry/layers/index.mjs";
import { layerOf } from "./layer.js";
import { stableTree } from "./tree.js";

// Each page a layer's manifest reaches renders the same normalized tree as React's, at rest and after its
// interaction (plan D6). React's server is the first fixture port.
const reactOrigin = `http://localhost:${process.env.KIND_FIXTURE_PORT_BASE}`;
const pageUrl = ({ c, case: variant }: ParityPage) => `/?c=${c}&case=${variant}`;

async function run(page: Page, steps: readonly ParityStep[]) {
  for (const step of steps) {
    if ("press" in step) await page.locator(step.press).first().click();
    else if ("hover" in step) await page.locator(step.hover).first().hover();
    else {
      if (step.focus) await page.locator(step.focus).first().focus();
      await page.keyboard.press(step.key);
    }
  }
}

for (const [layer, manifest] of Object.entries(manifests)) {
  const names = [...manifest.components, ...manifest.internals.map((name) => `internal-${name}`)];
  for (const name of names)
    for (const entry of parityPages[name] ?? [])
      test(`${layer}: ${name} ${pageUrl(entry)}`, async ({ page, browser }, testInfo) => {
        test.skip(layerOf(testInfo) !== layer, `a ${layer} page`);
        const missing = missingNeeds(entry, manifest.components);
        test.skip(missing.length > 0, `${layer} doesn't list ${missing.join(", ")} yet`);
        const react = await browser.newPage();
        await Promise.all([page.goto(pageUrl(entry)), react.goto(reactOrigin + pageUrl(entry))]);
        expect(await stableTree(page)).toEqual(await stableTree(react));
        if (entry.interaction) {
          await run(page, entry.interaction);
          await run(react, entry.interaction);
          expect(await stableTree(page)).toEqual(await stableTree(react));
        }
        await react.close();
      });
}
