import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindReasoning: {
    set(id: string, next: Record<string, string | number | undefined>): void;
    append(id: string, chunk: string): void;
  };
  kindAnnounced: string[];
};

const reasoning = (page: Page, id: string) => page.locator(`#${id}`);
const trigger = (page: Page, id: string) => reasoning(page, id).getByRole("button");
const content = (page: Page, id: string) =>
  reasoning(page, id).locator('[data-slot="kind-reasoning-content"]');
// Duration first: on web each key is its own attribute write, and the title reads the duration it has.
const set = (page: Page, id: string, next: Record<string, string | number | undefined>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindReasoning.set(i, n), [id, next] as const);
const append = (page: Page, id: string, chunk: string) =>
  page.evaluate(([i, c]) => (window as unknown as Fixture).kindReasoning.append(i, c), [id, chunk] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

const open = async (page: Page) => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/?c=reasoning&case=all");
  await expect(trigger(page, "done")).toHaveText("Thought for 3 s");
};

test("thinks while running, opens, then closes into a summary on complete", async ({ page }) => {
  await open(page);
  const live = reasoning(page, "live");
  await expect(live).toHaveAttribute("data-kind", "reasoning");
  await expect(live).toHaveAttribute("data-open", "");
  await expect(trigger(page, "live")).toHaveText("Thinking");
  await expect(live.getByRole("group")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Thought for 3 s" })).toHaveAttribute("id", "done");
  await append(page, "live", "First, **check** the cache.");
  await expect(content(page, "live").locator("strong")).toHaveText("check");
  await expect(content(page, "live").locator('[data-slot="kind-markdown"]')).toHaveCSS("font-size", "14px");
  await set(page, "live", { durationSeconds: 2.6, status: "complete" });
  await expect(trigger(page, "live")).toHaveText("Thought for 3 s");
  await expect(live).not.toHaveAttribute("data-open");
});

test("label replaces the title", async ({ page }) => {
  await open(page);
  await set(page, "live", { label: "Planning" });
  await expect(trigger(page, "live")).toHaveText("Planning");
});

test("a person's toggle stops auto open and close", async ({ page }) => {
  await open(page);
  await trigger(page, "live").click();
  await expect(reasoning(page, "live")).not.toHaveAttribute("data-open");
  await set(page, "live", { status: "awaiting-input" });
  await set(page, "live", { status: "running" });
  await expect(reasoning(page, "live")).toHaveAttribute("data-status", "running");
  await expect(reasoning(page, "live")).not.toHaveAttribute("data-open");
});

test("streaming thoughts never move the trigger", async ({ page }) => {
  await open(page);
  const box = () => trigger(page, "live").boundingBox();
  const before = await box();
  for (let i = 0; i < 40; i++) await append(page, "live", i % 8 === 7 ? `word ${i}.\n\n` : `word ${i} `);
  await expect(content(page, "live").locator("p")).toHaveCount(5);
  expect(await box()).toEqual(before);
});

test("announces the summary once, and failures and stops in words", async ({ page }) => {
  await open(page);
  for (let i = 0; i < 20; i++) await append(page, "live", `token ${i} `);
  await set(page, "live", { durationSeconds: 3, status: "complete" });
  await expect.poll(() => announced(page)).toEqual(["Thought for 3 s"]);
  await set(page, "live", { status: "running" });
  await set(page, "live", { status: "error" });
  await expect.poll(() => announced(page)).toEqual(["Thought for 3 s", "Thinking failed"]);
  await set(page, "done", { status: "running" });
  await set(page, "done", { status: "cancelled" });
  await expect
    .poll(() => announced(page))
    .toEqual(["Thought for 3 s", "Thinking failed", "Thinking stopped"]);
});

test("a cached answer that goes from pending to complete stays closed and announces only the summary", async ({
  page,
}) => {
  await open(page);
  const cached = reasoning(page, "cached");
  await expect(cached).not.toHaveAttribute("data-open");
  await cached.evaluate((el) => {
    new MutationObserver(() => {
      if (el.hasAttribute("data-open")) el.setAttribute("data-was-open", "");
    }).observe(el, { attributes: true, attributeFilter: ["data-open"] });
  });
  await set(page, "cached", { durationSeconds: 2, status: "complete" });
  await expect(trigger(page, "cached")).toHaveText("Thought for 2 s");
  await expect.poll(() => announced(page)).toEqual(["Thought for 2 s"]);
  await expect(cached).not.toHaveAttribute("data-open");
  await expect(cached).not.toHaveAttribute("data-was-open");
});

test("find in page opens a collapsed summary", async ({ page }) => {
  await open(page);
  await expect(content(page, "done")).toHaveAttribute("hidden", "until-found");
  await content(page, "done").evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(reasoning(page, "done")).toHaveAttribute("data-open", "");
  await expect(page.getByText("Collapsed text: kumquat.")).toBeVisible();
});

// Transitions started while the summary opens, collected until bindPanel settles the height to `auto`.
const openingTransitions = async (page: Page) => {
  const panel = content(page, "done");
  await panel.evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await trigger(page, "done").click();
  await expect(panel).toHaveCSS("--kind-step-content-height", "auto");
  return panel.evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("full motion animates height; reduced motion and motion reduced animate none", async ({ page }) => {
  await open(page);
  expect(await openingTransitions(page)).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await openingTransitions(page)).not.toContain("height");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  await set(page, "done", { motion: "reduced" });
  await expect(content(page, "done")).toHaveAttribute("data-motion", "reduced");
  expect(await openingTransitions(page)).not.toContain("height");
});

test("the running Thinking title is plain text: the status mark is the only loop", async ({ page }) => {
  await open(page);
  const title = reasoning(page, "live").locator('[data-slot="kind-reasoning-title"]');
  await expect(title).toHaveAttribute("data-status", "running");
  await expect(title).toHaveCSS("animation-name", "none");
  await expect(title).toHaveCSS("background-image", "none");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await append(page, "live", "Weighing **two** options.");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("agents expand and collapse it by its title", async ({ page }) => {
  await open(page);
  // `press` is the bridge's own action for a component that holds a button (here, the trigger).
  await expectAgentActions(page, "Thought for 3 s", ["collapse", "expand", "press"]);
  await page.evaluate(() =>
    (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
      steps: [{ ref: "Thought for 3 s", action: "expand" }],
    }),
  );
  await expect(reasoning(page, "done")).toHaveAttribute("data-open", "");
});

test("kind-reasoning exposes live open state and its api", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  type KindReasoning = HTMLElement & { open: boolean; api: { expand(): boolean } };
  const done = reasoning(page, "done");
  expect(await done.evaluate((el: KindReasoning) => el.open)).toBe(false);
  expect(await done.evaluate((el: KindReasoning) => el.api.expand())).toBe(true);
  await expect(done).toHaveAttribute("data-open", "");
});

test("kind-reasoning keeps its title current after it leaves the page and comes back", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  await reasoning(page, "live").evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.prepend(el);
  });
  await set(page, "live", { durationSeconds: 4, status: "complete" });
  await expect(trigger(page, "live")).toHaveText("Thought for 4 s");
});
