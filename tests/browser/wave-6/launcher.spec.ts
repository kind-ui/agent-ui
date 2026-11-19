import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Change = { open: boolean; reason: string; source: string };
type Fixture = { kindHost: { changes: Change[]; pageClicks: number } };

const trigger = (page: Page) => page.locator('[data-launcher-part="trigger"]');
const badge = (page: Page) => page.locator('[data-launcher-part="badge"]');
const content = (page: Page) => page.locator('[data-launcher-part="content"]');
const editor = (page: Page) => content(page).getByRole("textbox", { name: "Prompt" });
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const load = (page: Page, fixture = "all") => page.goto(`/?c=launcher&case=${fixture}`);
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style], [data-ending-style]") &&
      document
        .getAnimations()
        // The conversation's edge fades run on a scroll timeline, which never ends.
        .every(
          (animation) =>
            !(animation.timeline instanceof DocumentTimeline) || animation.playState !== "running",
        ),
  );

test("opening focuses the composer's editor, and Escape closes and returns focus to the button", async ({
  page,
}) => {
  await load(page);
  await expect(content(page)).toBeHidden();
  await trigger(page).click();
  await expect(content(page)).toBeVisible();
  await expect(editor(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect((await host(page)).changes.map(({ open, reason }) => [open, reason])).toEqual([
    [true, "trigger-press"],
    [false, "escape-key"],
  ]);
});

test("the page stays usable while the panel is open", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  await expect(editor(page)).toBeFocused();
  await page.locator("#page-button").click();
  expect((await host(page)).pageClicks).toBe(1);
});

test("a modal panel makes the page inert", async ({ page }) => {
  await load(page, "modal");
  await trigger(page).click();
  await expect(editor(page)).toBeFocused();
  await expect(content(page)).toHaveAttribute("aria-modal", "true");
  expect(await page.locator("#page-button").evaluate((el) => el.closest("[inert]") !== null)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  expect(await page.locator("#page-button").evaluate((el) => el.closest("[inert]") !== null)).toBe(false);
});

test("a draft survives closing and opening the panel", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  await expect(editor(page)).toBeFocused();
  await page.keyboard.type("Keep this");
  await page.keyboard.press("Escape");
  await expect(content(page)).toBeHidden();
  await trigger(page).click();
  await expect(editor(page)).toBeFocused();
  await expect(editor(page)).toHaveText("Keep this");
});

test("the unread count is in the button's name, and the badge shows it to sight only", async ({ page }) => {
  await load(page);
  await expect(trigger(page)).toHaveAccessibleName("Open Assistant, 2 unread");
  await expect(badge(page)).toHaveText("2");
  await expect(badge(page)).toHaveAttribute("aria-hidden", "true");
  await trigger(page).click();
  await expect(trigger(page)).toHaveAccessibleName("Close Assistant, 2 unread");
});

test("without unread messages the button is named without a count and has no badge", async ({ page }) => {
  await load(page, "read");
  await expect(trigger(page)).toHaveAccessibleName("Open Assistant");
  await expect(badge(page)).toBeHidden();
  await expect(trigger(page)).toHaveText("");
});

test("the panel is named by its title and Close closes it", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  await expect(page.getByRole("dialog", { name: "Assistant" })).toBeVisible();
  await content(page).getByRole("button", { name: "Close Assistant" }).click();
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the panel is a sheet that spans the screen's width", async ({ page }) => {
    await load(page);
    await trigger(page).tap();
    await expect(content(page)).toBeVisible();
    await expect(content(page)).toHaveAttribute("data-presentation", "sheet");
    await expect(
      page.locator('[data-slot="kind-launcher-viewport"] > [data-launcher-part="content"]'),
    ).toHaveCount(1);
    await expect
      .poll(() => content(page).evaluate((el) => el.getBoundingClientRect().toJSON()))
      .toMatchObject({ left: 0, right: 390 });
  });
});

test("the shortcut opens and closes the panel from the keyboard, also from the composer inside", async ({
  page,
}) => {
  await load(page);
  await expect(trigger(page)).toHaveAttribute("aria-keyshortcuts", /^(Meta|Control)\+J$/);
  await page.keyboard.press("ControlOrMeta+j");
  await expect(editor(page)).toBeFocused();
  await page.keyboard.press("ControlOrMeta+j");
  await expect(content(page)).toBeHidden();
  expect((await host(page)).changes).toEqual([
    { open: true, reason: "shortcut", source: "keyboard" },
    { open: false, reason: "shortcut", source: "keyboard" },
  ]);
});

test("reduced motion only fades the panel", async ({ page }) => {
  await load(page, "reduced");
  await trigger(page).click();
  await expect(content(page)).toHaveAttribute("data-motion", "reduced");
  await settled(page);
  expect(await content(page).evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("opacity");
});

test("an empty title someone writes is filled in and names the panel", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web fills in parts written empty");
  await load(page, "written");
  await trigger(page).click();
  await expect(page.getByRole("dialog", { name: "Assistant" })).toBeVisible();
});

test("an agent opens and closes the panel", async ({ page }) => {
  await load(page, "read");
  await expectAgentActions(page, "Assistant", ["open", "press"]);
  await trigger(page).click();
  await expect(content(page)).toBeVisible();
  await expectAgentActions(page, "Assistant", ["close", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the panel open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page).click();
    await expect(editor(page)).toBeFocused();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
