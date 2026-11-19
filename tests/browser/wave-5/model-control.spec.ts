import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Change = { component: string; value: unknown; reason: string; source?: string };
type Fixture = {
  kindHost: { changes: Change[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const NAME = "Model, Claude Opus 5.5, Medium effort";
const trigger = (page: Page) => page.locator('#control [data-slot="menu-trigger"]').first();
const row = (page: Page, name: RegExp) => page.getByRole("menuitem", { name });
const option = (page: Page, name: RegExp) => page.getByRole("menuitemradio", { name });
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const act = (page: Page, ref: string, action: string, args: unknown[] = []) =>
  page.evaluate(
    ({ ref, action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { ref, action, args },
  );
// A sheet's drag runs on scroll-driven animations, which never finish, so only time-driven ones count.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document
        .getAnimations()
        .every(
          (animation) =>
            !(animation.timeline instanceof DocumentTimeline) || animation.playState !== "running",
        ),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=model-control&case=${name}`);
  await expect(trigger(page)).toHaveAccessibleName(NAME);
};

test("the trigger reads the model and effort; the menu holds the toggle, Model, Effort and the host's choice", async ({
  page,
}) => {
  await load(page);
  await expect(trigger(page).locator("[data-current]")).toHaveText("Medium");
  await expect(page.getByRole("group", { name: NAME })).toBeVisible();
  await trigger(page).click();
  await expect(page.getByRole("menuitemcheckbox", { name: "Fast mode" })).toBeVisible();
  await expect(page.getByRole("menuitem")).toHaveText([
    /Model.*Claude Opus 5\.5/,
    /Effort.*Medium/,
    /Context window.*1M/,
  ]);
});

test("the Model submenu groups models with icons; choosing one falls back to an effort it supports", async ({
  page,
}) => {
  await load(page);
  await trigger(page).click();
  await row(page, /^Model/).click();
  await expect(page.getByText("OpenAI", { exact: true })).toBeVisible();
  await expect(option(page, /Claude Opus 5\.5/)).toHaveAttribute("aria-checked", "true");
  await expect(option(page, /GPT-6\.1 Terra/).locator("img")).toHaveCount(1);
  await option(page, /GPT-6\.1 Terra/).click();
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Medium effort");
  // Radio items keep the menu open, as in Settings Menu, so the new effort shows beside the model.
  await expect(option(page, /GPT-6\.1 Terra/)).toHaveAttribute("aria-checked", "true");
  await expect(row(page, /^Effort/)).toHaveAccessibleName(/Medium/);
  expect((await changes(page)).map(({ component, value, reason }) => [component, value, reason])).toEqual([
    ["model", "terra", "item-press"],
  ]);
});

test("the Effort submenu dims levels the model doesn't support, which can't be chosen", async ({ page }) => {
  await load(page);
  await act(page, NAME, "setModel", ["terra"]);
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Medium effort");
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await row(page, /^Effort/).press("ArrowRight");
  await expect(option(page, /^Low/)).toBeFocused();
  await expect(option(page, /^High/)).toHaveAttribute("aria-disabled", "true");
  // Playwright waits for an aria-disabled item to be enabled; a person can still press it.
  await option(page, /^High/).click({ force: true });
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Medium effort");
  await option(page, /^Low/).focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Low effort");
  expect((await changes(page)).at(-1)).toMatchObject({
    component: "effort",
    value: "low",
    source: "keyboard",
  });
});

test("a model without effort levels has no Effort row and no effort in its name", async ({ page }) => {
  await load(page);
  await act(page, NAME, "setModel", ["haiku"]);
  await expect(trigger(page)).toHaveAccessibleName("Model, Claude Haiku 5.5");
  await trigger(page).click();
  await expect(row(page, /^Model/)).toBeVisible();
  await expect(row(page, /^Effort/)).toHaveCount(0);
});

test("More models runs the action and closes the menu", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  await row(page, /^Model/).click();
  await page.getByRole("menuitem", { name: "More models" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect((await changes(page)).at(-1)).toMatchObject({
    component: "action",
    value: "more",
    reason: "item-press",
  });
});

test("agents choose a model and an effort, refusing one the model doesn't support", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, NAME, ["open", "toggle", "setValue", "setModel", "setEffort", "run"]);
  await act(page, NAME, "setEffort", ["max"]);
  await expect(trigger(page)).toHaveAccessibleName("Model, Claude Opus 5.5, Max effort");
  await act(page, "Model, Claude Opus 5.5, Max effort", "setModel", ["terra"]);
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Medium effort");
  await act(page, "Model, GPT-6.1 Terra, Medium effort", "setEffort", ["high"]);
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Terra, Medium effort");
  expect(
    (await changes(page)).map(({ component, value, reason, source }) => [component, value, reason, source]),
  ).toEqual([
    ["effort", "max", "imperative", "agent"],
    ["model", "terra", "imperative", "agent"],
    ["effort", "medium", "model-change", "agent"],
  ]);
});

test("a refused model or effort keeps the old one", async ({ page }) => {
  await load(page, "refusing");
  await trigger(page).click();
  await row(page, /^Effort/).click();
  await option(page, /^High/).click();
  await expect(option(page, /^Medium/)).toHaveAttribute("aria-checked", "true");
  await expect(trigger(page)).toHaveAccessibleName(NAME);
  await row(page, /^Model/).click();
  await option(page, /GPT-6\.1 Terra/).click();
  await expect(option(page, /Claude Opus 5\.5/)).toHaveAttribute("aria-checked", "true");
  await expect(trigger(page)).toHaveAccessibleName(NAME);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the Model submenu open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page).click();
    await row(page, /^Model/).click();
    await expect(option(page, /Claude Opus 5\.5/)).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
