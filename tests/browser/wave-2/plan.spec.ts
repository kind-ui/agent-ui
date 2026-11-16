import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindItems: { setStatus(id: string, status: string): void };
  kindAccepts: { resolve(): void; reject(): void }[];
  agent: { act(input: unknown): Promise<unknown> };
};

const plan = (page: Page) => page.locator("#plan");
const item = (page: Page, name: string) => plan(page).getByRole("listitem").filter({ hasText: name });
const accept = (page: Page, id = "plan") => page.locator(`#${id} [data-slot="kind-plan-accept"]`);
const accepts = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAccepts.length);
const setStatus = (page: Page, id: string, status: string) =>
  page.evaluate(([i, s]) => (window as unknown as Fixture).kindItems.setStatus(i, s), [id, status] as const);
const act = (page: Page, ref: string, action: string) =>
  page.evaluate(
    ([r, a]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action] as const,
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=plan&case=${name}`);
  await expect(item(page, "Audit the current schema")).toBeVisible();
};

test("shows the planned items and how many are done on a progress bar", async ({ page }) => {
  await open(page);
  await expect(plan(page)).toHaveAttribute("data-kind", "plan");
  const progress = page.getByRole("progressbar", { name: "2 of 5 steps" });
  await expect(progress).toHaveAttribute("aria-valuenow", "40");
  await expect(item(page, "Add the new columns")).toContainText("Nullable first");
  await expect(item(page, "Drop the old columns").getByRole("img")).toHaveAccessibleName("Skipped");
  await setStatus(page, "backfill", "complete");
  await expect(page.getByRole("progressbar", { name: "3 of 5 steps" })).toHaveAttribute(
    "aria-valuenow",
    "60",
  );
});

test("items are one Tab stop with arrow keys", async ({ page }) => {
  await open(page);
  await item(page, "Audit the current schema").focus();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Add the new columns")).toBeFocused();
  await expect(plan(page).locator('[data-slot="kind-plan-item"][tabindex="0"]')).toHaveCount(1);
});

test("a double press on Accept calls the host once, and a rejection enables it again", async ({ page }) => {
  await open(page);
  await accept(page).dblclick();
  await expect(accept(page)).toHaveAttribute("aria-disabled", "true");
  expect(await accepts(page)).toBe(1);
  // Playwright won't click an aria-disabled button; a person can.
  await accept(page).click({ force: true });
  expect(await accepts(page)).toBe(1);
  await page.evaluate(() => (window as unknown as Fixture).kindAccepts[0]?.reject());
  await expect(accept(page)).not.toHaveAttribute("aria-disabled");
  await accept(page).click();
  expect(await accepts(page)).toBe(2);
});

test("when Accept leaves with focus, focus moves to the trigger", async ({ page }) => {
  await open(page);
  await accept(page).focus();
  await page.evaluate(() => (window as unknown as { kindStopAccepting(): void }).kindStopAccepting());
  await expect(accept(page)).toBeHidden();
  await expect(plan(page).locator('[data-slot="kind-plan-trigger"]')).toBeFocused();
});

test("Accept is absent without onAccept", async ({ page }) => {
  await open(page);
  await expect(accept(page, "readonly")).toBeHidden();
  await expect(accept(page, "quick")).toBeVisible();
});

test("an agent's accept needs a person unless agentConfirm is off", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Migration plan", ["accept", "collapse", "expand", "press"]);
  await expectAgentActions(page, "Read-only plan", ["collapse", "expand", "press"]);
  expect(await act(page, "Migration plan", "accept")).toContain("Needs a person");
  expect(await accepts(page)).toBe(0);
  expect(await act(page, "Quick plan", "accept")).toContain('"ok":true');
});

test("a status change doesn't move the rows", async ({ page }) => {
  await open(page);
  const boxes = () =>
    plan(page)
      .getByRole("listitem")
      .evaluateAll((items) => items.map((el) => el.getBoundingClientRect().toJSON()));
  const before = await boxes();
  await setStatus(page, "migrate", "complete");
  await setStatus(page, "backfill", "running");
  await expect(item(page, "Backfill existing rows")).toHaveAttribute("data-status", "running");
  expect(await boxes()).toEqual(before);
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
