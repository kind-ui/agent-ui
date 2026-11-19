import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: { changes: { open: boolean; reason: string; source: string }[]; setUsed(used: number): void };
  agent: { act(input: unknown): Promise<unknown> };
};

const VALUE = "57,600 of 128,000 tokens, 45%";

const meter = (page: Page) => page.getByRole("group", { name: "Context" });
const trigger = (page: Page) => meter(page).locator('[data-slot="kind-context-meter-trigger"]');
const details = (page: Page) => page.getByRole("dialog", { name: "Context" });
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const setUsed = (page: Page, used: number) =>
  page.evaluate((value) => (window as unknown as Fixture).kindHost.setUsed(value), used);
const act = (page: Page, action: string) =>
  page.evaluate(
    (name) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Context", action: name, args: [] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    action,
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=context-meter&case=${name}`);
  await expect(trigger(page)).toBeVisible();
};

test("a group named by its label, whose button reads the tokens and the percentage", async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAccessibleName(VALUE);
  await expect(trigger(page)).toHaveText("45%");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(meter(page).locator('[data-slot="meter"]')).toHaveAttribute("aria-valuetext", VALUE);
  await expect(meter(page)).toHaveAttribute("data-level", "normal");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("a press opens the details with each count and the cost, and Escape closes them", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(details(page)).toBeVisible();
  await expect(details(page)).toHaveAccessibleDescription("57,600 of 128,000 tokens");
  await expect(details(page).locator("dt")).toHaveText(["Input", "Output", "Reasoning", "Cached", "Cost"]);
  await expect(details(page).locator("dd")).toHaveText(["40,000", "12,000", "5,600", "20,000", "$0.42"]);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(details(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect((await changes(page)).map(({ open, reason }) => [open, reason])).toEqual([
    [true, "trigger-press"],
    [false, "escape-key"],
  ]);
});

test("keyboard focus opens the details and leaves focus on the trigger; Escape closes them", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await expect(details(page)).toBeVisible();
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(details(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  // UI SDK keeps press-opened details open on a press only when the pointer opened them, so Enter toggles.
  await page.keyboard.press("Enter");
  await expect(details(page)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(details(page)).toBeHidden();
  expect((await changes(page)).map(({ reason }) => reason)).toEqual([
    "trigger-focus",
    "escape-key",
    "trigger-press",
    "trigger-press",
  ]);
});

test("details written by hand also leave focus on the trigger", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "Web Components only");
  await open(page, "written");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog", { name: "Context window" })).toBeVisible();
  await expect(trigger(page)).toBeFocused();
});

test("resting the pointer opens the details, and leaving closes them", async ({ page }) => {
  await open(page);
  await trigger(page).hover();
  await expect(details(page)).toBeVisible();
  await page.locator("#above").hover();
  await expect(details(page)).toBeHidden();
  expect((await changes(page)).map(({ open, reason }) => [open, reason])).toEqual([
    [true, "trigger-hover"],
    [false, "trigger-hover"],
  ]);
});

for (const name of ["all", "german"]) {
  test(`a new value keeps the trigger's width, so nothing beside it moves (${name})`, async ({ page }) => {
    await open(page, name);
    const width = () => trigger(page).evaluate((el) => el.getBoundingClientRect().width);
    const before = await width();
    for (const used of [1_000, 128_000, 6_400]) {
      await setUsed(page, used);
      await expect(meter(page).locator('[data-slot="meter-value"]')).not.toHaveText(/^45/);
      expect(await width()).toBe(before);
    }
  });
}

test("the button's name follows a new value", async ({ page }) => {
  await open(page);
  await setUsed(page, 128_000);
  await expect(trigger(page)).toHaveAccessibleName("128,000 of 128,000 tokens, 100%");
});

for (const [level, glyph] of [
  ["high", "mask"],
  ["full", "fill"],
] as const) {
  test(`at the ${level} level the ring shows its own mark`, async ({ page }) => {
    await open(page, level);
    await expect(meter(page)).toHaveAttribute("data-level", level);
    const mark = await meter(page)
      .locator('[data-slot="meter-track"]')
      .evaluate((el) => {
        const style = getComputedStyle(el, "::after");
        return { mask: style.maskImage, inset: style.top, color: style.backgroundColor };
      });
    expect(mark.color).not.toBe("rgba(0, 0, 0, 0)");
    if (glyph === "mask") expect(mark.mask).toContain("svg");
    else expect(mark.inset).toBe("4px");
  });
}

test("with reduced motion the ring jumps and the details only fade", async ({ page }) => {
  await open(page, "reduced");
  const ring = meter(page).locator('[data-slot="meter"]');
  expect(await ring.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  await trigger(page).click();
  await expect(details(page)).toBeVisible();
  expect(await details(page).evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("opacity");
  const exit = await details(page).evaluate((el) => {
    el.setAttribute("data-ending-style", "");
    const duration = getComputedStyle(el).transitionDuration;
    el.removeAttribute("data-ending-style");
    return duration;
  });
  expect(exit).toBe("0.12s");
});

test("an agent opens and closes the details, each offered only when it applies", async ({ page }) => {
  await open(page);
  // The bridge adds its generic `press` to any component holding a button.
  await expectAgentActions(page, "Context", ["open", "press"]);
  expect(await act(page, "open")).toContain('"ok":true');
  await expect(details(page)).toBeVisible();
  await expect(trigger(page)).not.toBeFocused();
  await expectAgentActions(page, "Context", ["close", "press"]);
  expect(await act(page, "close")).toContain('"ok":true');
  await expect(details(page)).toBeHidden();
  expect(await changes(page)).toEqual([
    { open: true, reason: "imperative", source: "agent" },
    { open: false, reason: "imperative", source: "agent" },
  ]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations, closed and open, in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const name of ["all", "high", "full"]) {
      await open(page, name);
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await settled(page);
      expect((await new AxeBuilder({ page }).include("#context").analyze()).violations).toEqual([]);
      await trigger(page).click();
      await expect(details(page)).toBeVisible();
      await settled(page);
      expect((await new AxeBuilder({ page }).include("#context").analyze()).violations).toEqual([]);
    }
  });
}
