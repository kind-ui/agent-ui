import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Item = { id: string; status: string; title: string; files?: string[] };

type Fixture = {
  kindItems: {
    setStatus(id: string, status: string): void;
    append(item: Item): void;
    remove(id: string): void;
  };
  kindAnnounced: string[];
};

const task = (page: Page) => page.locator("#task");
const item = (page: Page, name: string) => task(page).getByRole("listitem").filter({ hasText: name });
const setStatus = (page: Page, id: string, status: string) =>
  page.evaluate(([i, s]) => (window as unknown as Fixture).kindItems.setStatus(i, s), [id, status] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

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
  await page.goto(`/?c=task&case=${name}`);
  await expect(item(page, "Read the schema")).toBeVisible();
};

test("shows the items as the agent takes them, with how many are done", async ({ page }) => {
  await open(page);
  await expect(task(page)).toHaveAttribute("data-kind", "task");
  await expect(page.getByRole("group", { name: "Migrating the users table" })).toHaveAttribute(
    "data-open",
    "",
  );
  await expect(task(page).locator('[data-slot="kind-task-meta"]')).toHaveText("1 of 3");
  await expect(item(page, "Write the migration")).toHaveAttribute("aria-current", "step");
  await expect(item(page, "Read the schema").getByRole("img")).toHaveAccessibleName("Complete");
  await expect(item(page, "Read the schema").locator("code")).toHaveText("db/schema.sql");
  await expect(item(page, "Run the tests").locator('[data-slot="kind-task-item-files"]')).toBeHidden();
  await setStatus(page, "migrate", "complete");
  await setStatus(page, "tests", "complete");
  await expect(task(page).locator('[data-slot="kind-task-meta"]')).toHaveText("3 of 3");
  await expect(task(page)).toHaveAttribute("data-status", "complete");
  await expect(task(page)).not.toHaveAttribute("data-open");
});

test("items are one Tab stop with arrow, Home and End keys", async ({ page }) => {
  await open(page);
  await task(page).locator('[data-slot="kind-task-trigger"]').focus();
  await page.keyboard.press("Tab");
  await expect(item(page, "Read the schema")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Write the migration")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item(page, "Run the tests")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(item(page, "Read the schema")).toBeFocused();
  await expect(task(page).locator('[data-slot="kind-task-item"][tabindex="0"]')).toHaveCount(1);
});

test("removing the focused item moves focus to a neighbor", async ({ page }) => {
  await open(page);
  await item(page, "Write the migration").focus();
  await page.evaluate(() => (window as unknown as Fixture).kindItems.remove("migrate"));
  await expect(item(page, "Run the tests")).toBeFocused();
});

test("an item's completion is announced once, and the task's with it", async ({ page }) => {
  await open(page);
  await setStatus(page, "migrate", "complete");
  await expect.poll(() => announced(page)).toEqual(["Write the migration complete"]);
  await setStatus(page, "tests", "complete");
  await expect
    .poll(() => announced(page))
    .toEqual(["Write the migration complete", "Run the tests complete. Migrating the users table complete"]);
});

test("a status change doesn't move the rows", async ({ page }) => {
  await open(page);
  const boxes = () =>
    task(page)
      .getByRole("listitem")
      .evaluateAll((items) => items.map((el) => el.getBoundingClientRect().toJSON()));
  const before = await boxes();
  await setStatus(page, "migrate", "error");
  await setStatus(page, "tests", "running");
  await expect(item(page, "Run the tests")).toHaveAttribute("data-status", "running");
  expect(await boxes()).toEqual(before);
});

// Transitions an item's mark starts when its status changes, its pseudo-elements' included.
const markTransitions = async (page: Page) => {
  const mark = item(page, "Write the migration").getByRole("img");
  await mark.evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await setStatus(page, "migrate", "complete");
  await expect(mark).toHaveAttribute("data-status", "complete");
  // Transitions start on the frame after the style change.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  return mark.evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("an item's mark morphs at full motion, and runs no transform under reduced motion", async ({ page }) => {
  await open(page);
  expect(await markTransitions(page)).toContain("transform");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await markTransitions(page)).not.toContain("transform");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  expect(await markTransitions(page)).not.toContain("transform");
});

test("agents can expand and collapse it", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Migrating the users table", ["collapse", "expand", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
