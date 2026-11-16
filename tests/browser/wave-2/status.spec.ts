import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

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
  expect(entries).toHaveLength(7);
  expect(entries).toContainEqual({ actions: [], status: "running" });
});
