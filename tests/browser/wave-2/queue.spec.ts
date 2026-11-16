import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Call = { type: string; id: string; index?: number; reason: string; source: string };

type Fixture = {
  kindCalls: Call[];
  kindQueue: {
    remove(id: string): void;
    add(item: { id: string; status: string; title: string }): void;
    complete(id: string): void;
  };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const queue = (page: Page) => page.locator("#queue");
const pending = (page: Page) => queue(page).locator('[data-slot="kind-queue-list"][data-section="pending"]');
const row = (page: Page, name: string) => queue(page).getByRole("listitem").filter({ hasText: name });
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindCalls);
const hostRemove = (page: Page, id: string) =>
  page.evaluate((i) => (window as unknown as Fixture).kindQueue.remove(i), id);
const complete = (page: Page, id: string) =>
  page.evaluate((i) => (window as unknown as Fixture).kindQueue.complete(i), id);
const act = (page: Page, action: string, args: unknown[]) =>
  page.evaluate(
    ([a, r]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Queue", action: a, args: r }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, args] as const,
  );
const titles = (page: Page) => pending(page).locator('[data-slot="kind-queue-item-title"]').allTextContents();

// Records each row as it starts leaving: whether it's inert and hidden from assistive technology.
const recordLeaving = (page: Page) =>
  page.evaluate(() => {
    const seen: { inert: boolean; hidden: string | null }[] = [];
    Object.assign(window, { kindLeaving: seen });
    new MutationObserver((mutations) => {
      for (const { target } of mutations)
        if (target instanceof HTMLElement && target.hasAttribute("data-leaving"))
          seen.push({ inert: target.inert, hidden: target.getAttribute("aria-hidden") });
    }).observe(document.getElementById("queue") as HTMLElement, {
      attributes: true,
      attributeFilter: ["data-leaving"],
      subtree: true,
    });
  });
const leavingSeen = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { kindLeaving: { inert: boolean; hidden: string | null }[] }).kindLeaving,
  );

const open = async (page: Page, name = "all") => {
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
  await page.goto(`/?c=queue&case=${name}`);
  await expect(row(page, "Write the migration")).toBeVisible();
};

test("splits the items into Queued and Completed, with counts", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("region", { name: "Queue" })).toBeVisible();
  const queued = page.getByRole("button", { name: "Queued" });
  const completed = page.getByRole("button", { name: "Completed" });
  await expect(queued).toHaveAttribute("aria-expanded", "true");
  await expect(queued.locator("[data-count]")).toHaveText("3");
  await expect(completed).toHaveAttribute("aria-expanded", "false");
  await expect(completed.locator("[data-count]")).toHaveText("1");
  await expect(row(page, "Read the schema")).toBeHidden();
  await expect(row(page, "Update the docs")).toContainText("README and the API page");
  await completed.click();
  await expect(row(page, "Read the schema")).toBeVisible();
});

test("Space, ArrowDown, Space moves an item and announces it; Escape puts it back", async ({ page }) => {
  await open(page);
  await row(page, "Write the migration").focus();
  await page.keyboard.press("Space");
  await expect(row(page, "Write the migration")).toHaveAttribute("data-grabbed", "");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(row(page, "Write the migration")).not.toHaveAttribute("data-grabbed");
  expect(await titles(page)).toEqual(["Write the migration", "Update the docs", "Run the tests"]);
  expect(await calls(page)).toEqual([]);

  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect.poll(() => titles(page)).toEqual(["Update the docs", "Write the migration", "Run the tests"]);
  expect(await calls(page)).toEqual([
    { type: "reorder", id: "a", index: 1, reason: "move-key", source: "keyboard" },
  ]);
  await expect(row(page, "Write the migration")).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindAnnounced))
    .toContain("Dropped Write the migration at position 2 of 3.");
});

test("dragging an item moves it", async ({ page }) => {
  await open(page);
  const from = await row(page, "Write the migration").boundingBox();
  const to = await row(page, "Update the docs").boundingBox();
  if (!from || !to) throw new Error("rows have no box");
  await page.mouse.move(from.x + 20, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + from.height / 2 + 8, { steps: 2 });
  await page.mouse.move(to.x + 20, to.y + to.height - 2, { steps: 6 });
  await page.mouse.up();
  await expect
    .poll(() => calls(page))
    .toEqual([{ type: "reorder", id: "a", index: 1, reason: "drag", source: "mouse" }]);
  await expect.poll(() => titles(page)).toEqual(["Update the docs", "Write the migration", "Run the tests"]);
});

test("Delete removes the focused item, which leaves inert before it's gone, and focus moves on", async ({
  page,
}) => {
  await open(page);
  await recordLeaving(page);
  await row(page, "Update the docs").focus();
  await page.keyboard.press("Delete");
  expect(await calls(page)).toEqual([
    { type: "remove", id: "b", reason: "remove-press", source: "keyboard" },
  ]);
  await expect(row(page, "Run the tests")).toBeFocused();
  await expect(queue(page).locator("[data-leaving]")).toHaveCount(0);
  await expect(queue(page).locator('[data-slot="kind-queue-item"]')).toHaveCount(3);
  expect(await leavingSeen(page)).toEqual([{ inert: true, hidden: "true" }]);
  await expect(queue(page).locator('[data-slot="kind-queue-item"][tabindex="0"]')).toHaveCount(1);
});

test("the host removing the item being moved cancels the move and moves focus on", async ({ page }) => {
  await open(page);
  await row(page, "Write the migration").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await hostRemove(page, "a");
  await expect(row(page, "Update the docs")).toBeFocused();
  await expect(queue(page).locator("[data-grabbed]")).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(row(page, "Run the tests")).toBeFocused();
  expect(await calls(page)).toEqual([]);
});

test("without onReorder and onRemove, nothing can be picked up or removed", async ({ page }) => {
  await open(page, "readonly");
  await expect(pending(page)).not.toHaveAttribute("aria-roledescription");
  await row(page, "Write the migration").focus();
  await page.keyboard.press("Space");
  await expect(row(page, "Write the migration")).not.toHaveAttribute("data-grabbed");
  await page.keyboard.press("Delete");
  await expect(row(page, "Write the migration")).toBeVisible();
  await expect(queue(page).locator('[data-slot="kind-queue-item-remove"]').first()).toBeHidden();
  await expectAgentActions(page, "Queue", []);
});

test("completed items can't be picked up", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Completed" }).click();
  await row(page, "Read the schema").focus();
  await page.keyboard.press("Space");
  await expect(row(page, "Read the schema")).not.toHaveAttribute("data-grabbed");
  await expect(row(page, "Read the schema")).not.toHaveAttribute("aria-roledescription");
});

// Removes "b" and watches each frame until it's gone: the properties its exit animates, and which rows and
// sections slid (the motion helper's `layout` writes `translate`).
const watchRemove = (page: Page) =>
  page.evaluate(async () => {
    (window as unknown as Fixture).kindQueue.remove("b");
    const exit = new Set<string>();
    const slid = new Set<string>();
    let framesSinceGone = 0;
    for (let frame = 0; frame < 120 && framesSinceGone < 5; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const leaving = document.querySelector<HTMLElement>("#queue [data-leaving]");
      // The motion helper's own animations, not the row's CSS transitions.
      for (const animation of leaving?.getAnimations().filter((each) => !(each instanceof CSSTransition)) ??
        [])
        for (const keyframe of (animation.effect as KeyframeEffect).getKeyframes())
          for (const property of Object.keys(keyframe)) exit.add(property);
      for (const el of document.querySelectorAll<HTMLElement>(
        '#queue :is([data-slot="kind-queue-item"], [data-slot="kind-queue-section"])',
      ))
        if (el.style.translate)
          slid.add(
            el.dataset.section ?? el.querySelector('[data-slot="kind-queue-item-title"]')?.textContent ?? "",
          );
      if (!leaving) framesSinceGone++;
    }
    return {
      exit: [...exit].filter((property) => !/offset|easing|composite/i.test(property)),
      slid: [...slid],
    };
  });

test("under reduced motion a removed item only fades, and nothing after it slides", async ({ page }) => {
  await open(page, "reduced");
  expect(await watchRemove(page)).toEqual({ exit: ["opacity"], slid: [] });
});

test("at full motion the row and section after a removed item slide up into its place", async ({ page }) => {
  await open(page);
  const { slid } = await watchRemove(page);
  expect(slid.sort()).toEqual(["Run the tests", "complete"]);
});

test('with motion="none" a removed item leaves at once', async ({ page }) => {
  await open(page, "none");
  await recordLeaving(page);
  await hostRemove(page, "b");
  await expect(queue(page).locator('[data-slot="kind-queue-item"]')).toHaveCount(3);
  expect(await leavingSeen(page)).toEqual([]);
});

test("an item that completes moves to Completed, and keeps focus there while it's open", async ({ page }) => {
  await open(page);
  await row(page, "Update the docs").focus();
  await complete(page, "b");
  await expect(row(page, "Run the tests")).toBeFocused();
  await expect(page.getByRole("button", { name: "Completed" }).locator("[data-count]")).toHaveText("2");

  await page.getByRole("button", { name: "Completed" }).click();
  await row(page, "Run the tests").focus();
  await complete(page, "c");
  await expect(row(page, "Run the tests")).toBeFocused();
  await expect(row(page, "Run the tests")).toHaveAttribute("data-status", "complete");
  await expect(queue(page).locator('[data-slot="kind-queue-item"][tabindex="0"]')).toHaveCount(1);
});

test("only an item that arrives after the first frame plays its entrance", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    (window as unknown as Fixture).kindQueue.add({ id: "e", status: "pending", title: "Ship it" }),
  );
  await expect(row(page, "Ship it")).toBeVisible();
  const animated = await pending(page)
    .getByRole("listitem")
    .evaluateAll((rows) =>
      rows.map((el) => el.getAnimations().some((each) => !(each instanceof CSSTransition))),
    );
  expect(animated).toEqual([false, false, false, true]);
});

test("agents can reorder and remove items", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Queue", ["remove", "reorder"]);
  const result = await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({
      steps: [{ ref: "Queue", action: "reorder", args: ["c", 0] }],
    }),
  );
  expect(JSON.stringify(result)).toContain('"ok":true');
  expect(await calls(page)).toEqual([
    { type: "reorder", id: "c", index: 0, reason: "imperative", source: "agent" },
  ]);
  await expect.poll(() => titles(page)).toEqual(["Run the tests", "Write the migration", "Update the docs"]);
  expect(await act(page, "reorder", ["a", -1])).toContain('"result":false');
  expect(await calls(page)).toHaveLength(1);
});

test("kind-queue keeps its open sections when it leaves the page and comes back", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await page.getByRole("button", { name: "Completed" }).click();
  await page.evaluate(async () => {
    const element = document.getElementById("queue") as HTMLElement;
    const parent = element.parentElement as HTMLElement;
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.append(element);
  });
  await expect(page.getByRole("button", { name: "Completed" })).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, "Read the schema")).toBeVisible();
});

test("kind-queue fills in sections written after it connects", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await page.evaluate(() => {
    const element = document.createElement("kind-queue");
    element.id = "late";
    element.innerHTML = "<p>Loading</p>";
    document.getElementById("root")?.append(element);
    Object.assign(element, { items: [{ id: "x", status: "pending", title: "Late item" }] });
    element.insertAdjacentHTML(
      "beforeend",
      '<kind-queue-section value="pending"><kind-queue-section-trigger><button><span data-title></span><span data-count></span></button></kind-queue-section-trigger><kind-queue-section-content><kind-queue-list></kind-queue-list></kind-queue-section-content></kind-queue-section>',
    );
  });
  await expect(page.locator("#late").getByRole("listitem")).toHaveText(["Late item"]);
  await expect(page.locator("#late [data-count]")).toHaveText("1");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    await page.getByRole("button", { name: "Completed" }).click();
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
