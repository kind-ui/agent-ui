import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindStatus: {
    setStatus(status: string): void;
    setLabel(label: string | undefined): void;
    setMotion(motion: string): void;
  };
  kindAnnounced: string[];
  agent: { snapshot(): { component: string; actions?: string[]; status?: string }[] };
};

const labels = {
  pending: "Pending",
  running: "Running",
  "awaiting-input": "Needs input",
  complete: "Complete",
  error: "Failed",
  cancelled: "Cancelled",
};

const live = (page: Page) => page.locator("#live");
const set = (page: Page, method: keyof Fixture["kindStatus"], value: string | undefined) =>
  page.evaluate(([name, next]) => (window as unknown as Fixture).kindStatus[name](next as string), [
    method,
    value,
  ] as const);

const open = async (page: Page) => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const announced: string[] = [];
    Object.assign(window, { kindAnnounced: announced });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          announced.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/?c=status&case=all");
  await expect(live(page)).toHaveText("Running");
};
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

test("each status shows its default label, its mark and data-status", async ({ page }) => {
  await open(page);
  for (const [status, label] of Object.entries(labels)) {
    const badge = page.locator(`[data-slot="kind-status"][data-status="${status}"]`).first();
    await expect(badge).toHaveText(label);
    await expect(badge.locator("[data-status-mark]")).toHaveAttribute("aria-hidden", "true");
    await expect(badge.locator("[data-status-mark]")).toHaveAttribute("data-status", status);
  }
});

test("label replaces the default text, and removing it restores the default", async ({ page }) => {
  await open(page);
  await set(page, "setLabel", "Deploying");
  await expect(live(page)).toHaveText("Deploying");
  await set(page, "setLabel", undefined);
  await expect(live(page)).toHaveText("Running");
});

test("an unknown status shows as pending", async ({ page }) => {
  await open(page);
  await set(page, "setStatus", "done");
  await expect(live(page)).toHaveText("Pending");
  await expect(live(page)).toHaveAttribute("data-status", "pending");
});

test("composed parts keep their order and their own label text", async ({ page }) => {
  await open(page);
  const composed = page.locator("#composed");
  await expect(composed).toHaveText("Build complete");
  await expect(composed.locator("> :last-child")).toHaveAttribute("data-status-mark", "");
  await expect(composed.locator("[data-status-mark]")).toHaveAttribute("aria-hidden", "true");
});

test("kind-status writes its label into a label part added later", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web only");
  await open(page);
  await page.evaluate(() =>
    document.querySelector("#late")?.append(document.createElement("kind-status-label")),
  );
  await expect(page.locator("#late")).toHaveText("Failed");
});

test("announces terminal transitions once, and label changes never", async ({ page }) => {
  await open(page);
  for (let i = 0; i < 20; i++) await set(page, "setLabel", `Step ${i}`);
  await set(page, "setLabel", undefined);
  await set(page, "setStatus", "complete");
  await expect.poll(() => announced(page)).toEqual(["Complete"]);
  await set(page, "setStatus", "running");
  await set(page, "setStatus", "error");
  await expect.poll(() => announced(page)).toEqual(["Complete", "Failed"]);
});

test("the badge keeps its height across statuses", async ({ page }) => {
  await open(page);
  const heights = new Set<number>();
  for (const status of Object.keys(labels)) {
    await set(page, "setStatus", status);
    await expect(live(page)).toHaveAttribute("data-status", status);
    heights.add(await live(page).evaluate((el) => el.getBoundingClientRect().height));
  }
  expect(heights.size).toBe(1);
});

const markTransitions = (page: Page) =>
  live(page)
    .locator("[data-status-mark]")
    .evaluate((mark) =>
      ["::before", "::after"].flatMap((pseudo) =>
        getComputedStyle(mark, pseudo).transitionProperty.split(", "),
      ),
    );

test("the mark morphs with a transform at full motion", async ({ page }) => {
  await open(page);
  expect(await markTransitions(page)).toContain("transform");
});

test("reduced motion runs no transform transition on the mark", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await markTransitions(page)).not.toContain("transform");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await set(page, "setMotion", "reduced");
  await expect(live(page)).toHaveAttribute("data-motion", "reduced");
  expect(await markTransitions(page)).not.toContain("transform");
});

test("motion none transitions nothing", async ({ page }) => {
  await open(page);
  await set(page, "setMotion", "none");
  await expect(live(page)).toHaveAttribute("data-motion", "none");
  await set(page, "setStatus", "complete");
  expect(
    await page.evaluate(() => document.querySelector("#live")?.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("the agent snapshot lists each status by kind, with its state and no actions", async ({ page }) => {
  await open(page);
  const entries = await page.evaluate(() =>
    (window as unknown as Fixture).agent
      .snapshot()
      .filter((entry) => entry.component === "kind-status")
      .map(({ actions = [], status }) => ({ actions, status })),
  );
  expect(entries.length).toBeGreaterThan(7);
  for (const { actions } of entries) expect(actions).toEqual([]);
  expect(entries).toContainEqual({ actions: [], status: "running" });
});

// The center of the dot's pixels, inside the ring, from the mark's center, in CSS pixels.
const dotOffset = async (page: Page, scale: number) => {
  const mark = page
    .locator('[data-slot="kind-status"][data-status="awaiting-input"] [data-status-mark]')
    .first();
  const png = (await mark.screenshot({ animations: "disabled" })).toString("base64");
  return page.evaluate(
    async ([data, ratio]) => {
      const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
      const context = new OffscreenCanvas(image.width, image.height).getContext(
        "2d",
      ) as OffscreenCanvasRenderingContext2D;
      context.drawImage(image, 0, 0);
      const { data: pixels, width, height } = context.getImageData(0, 0, image.width, image.height);
      const [cx, cy] = [width / 2, height / 2];
      let [sum, sx, sy] = [0, 0, 0];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Inside the ring only, weighted by how warm the pixel is.
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 5 * ratio) continue;
          const i = (y * width + x) * 4;
          const weight = Math.max(0, (pixels[i] as number) - (pixels[i + 2] as number));
          sum += weight;
          sx += weight * (x + 0.5);
          sy += weight * (y + 0.5);
        }
      }
      return [(sx / sum - cx) / ratio, (sy / sum - cy) / ratio];
    },
    [png, scale] as const,
  );
};

for (const scale of [1, 2]) {
  test(`at ${scale}x the needs-input dot is centered and the running arc sits on its track`, async ({
    browser,
  }, testInfo) => {
    const page = await browser.newPage({ deviceScaleFactor: scale, baseURL: testInfo.project.use.baseURL });
    await open(page);
    for (const offset of await dotOffset(page, scale)) expect(Math.abs(offset)).toBeLessThan(0.25);
    const [ring, arc, inset] = await page
      .locator('[data-slot="kind-status"][data-status="running"] [data-status-mark]')
      .first()
      .evaluate((mark) => {
        const before = getComputedStyle(mark, "::before");
        return [getComputedStyle(mark).borderTopWidth, before.borderTopWidth, before.top];
      });
    expect(arc).toBe(ring);
    expect(inset).toBe(`-${ring}`);
    await page.close();
  });
}

test("kind-status keeps its label current after it leaves the page and comes back", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "web only");
  await open(page);
  await live(page).evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.append(el);
  });
  await set(page, "setStatus", "complete");
  await expect(live(page)).toHaveText("Complete");
});
