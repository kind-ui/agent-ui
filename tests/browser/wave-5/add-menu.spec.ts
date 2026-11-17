import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { actions: { id: string; reason: string; source?: string }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.getByRole("button", { name: "Add" });
const menu = (page: Page) => page.getByRole("menu").first();
const item = (page: Page, name: string | RegExp) => page.getByRole("menuitem", { name });
const actions = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.actions);
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
  await page.goto(`/?c=add-menu&case=${name}`);
  await expect(trigger(page)).toBeVisible();
};

test("Enter on an item calls onAction once with a keyboard source, and closes the menu", async ({ page }) => {
  await load(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeVisible();
  await expect(item(page, /^Upload file/)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, /^Add context/)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await actions(page)).toEqual([{ id: "context", reason: "item-press", source: "keyboard" }]);
});

test("ArrowRight opens a plugin's submenu, Escape closes only it, and typeahead moves by label", async ({
  page,
}) => {
  await load(page);
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, /^Upload file/)).toBeFocused();
  await page.keyboard.type("g");
  await expect(item(page, "GitHub")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Add an issue")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(item(page, "GitHub")).toBeFocused();
  await expect(item(page, "Add an issue")).toBeHidden();
  await expect(menu(page)).toBeVisible();
  await item(page, "GitHub").press("ArrowRight");
  await item(page, "Add a pull request").click();
  await expect(menu(page)).toBeHidden();
  expect(await actions(page)).toEqual([{ id: "pull", reason: "item-press", source: "mouse" }]);
});

test("an item the host cancels keeps the menu open", async ({ page }) => {
  await load(page, "refusing");
  await trigger(page).click();
  await item(page, /^Upload file/).click();
  await expect(menu(page)).toBeVisible();
  expect(await actions(page)).toEqual([{ id: "upload", reason: "item-press", source: "mouse" }]);
});

test("agent actions: open, close and run", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Add", ["open", "run", "press"]);
  const result = await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({ steps: [{ ref: "Add", action: "run", args: ["issue"] }] }),
  );
  expect(JSON.stringify(result)).not.toContain("error");
  expect(await actions(page)).toEqual([{ id: "issue", reason: "imperative", source: "agent" }]);
  await trigger(page).click();
  await expectAgentActions(page, "Add", ["close", "run", "press"]);
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the menu open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await trigger(page).click();
    await settled(page);
    const results = await new AxeBuilder({ page }).include("#root").analyze();
    expect(results.violations).toEqual([]);
  });

const content = (page: Page) => page.locator('[data-slot="menu-content"]');

test("the trigger is an icon button named Add inside a group named Add, and keeps its width when the menu opens", async ({
  page,
}) => {
  await load(page);
  const group = page.getByRole("group", { name: "Add" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("button", { name: "Add" })).toBeVisible();
  await expect(trigger(page)).toHaveText("");
  const width = () => trigger(page).evaluate((el) => el.getBoundingClientRect().width);
  expect(await width()).toBe(32);
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await settled(page);
  expect(await width()).toBe(32);
});

test("the disabled item is aria-disabled and choosing it calls nothing", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  const screenshot = item(page, "Screenshot");
  await expect(screenshot).toHaveAttribute("aria-disabled", "true");
  await screenshot.click({ force: true });
  await screenshot.press("Enter");
  await expect(menu(page)).toBeVisible();
  expect(await actions(page)).toEqual([]);
});

test("with reduced motion the menu only fades", async ({ page }) => {
  await load(page, "reduced");
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  const transition = await content(page)
    .first()
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(transition).toBe("opacity");
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the menu is a sheet, a plugin's submenu replaces the level, and going back returns to it", async ({
    page,
  }) => {
    await load(page);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(content(page).first()).toHaveAttribute("data-presentation", "sheet");
    await expect(item(page, /^Upload file/)).toBeFocused();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);

    await item(page, "GitHub").focus();
    await page.keyboard.press("ArrowRight");
    await expect(item(page, "Add an issue")).toBeFocused();
    // UI SDK keeps the open submenu's trigger above it as the level's heading and hides the rest of the root level.
    for (const name of [/^Upload file/, /^Add context/, "Linear"])
      await expect(item(page, name)).toBeHidden();
    await page.keyboard.press("ArrowLeft");
    await expect(item(page, "GitHub")).toBeFocused();
    await expect(item(page, "Add an issue")).toBeHidden();
    for (const name of [/^Upload file/, /^Add context/, "Linear"])
      await expect(item(page, name)).toBeVisible();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    await expect(item(page, "Add an issue")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(item(page, "GitHub")).toBeFocused();
    await expect(item(page, /^Upload file/)).toBeVisible();
  });
});
