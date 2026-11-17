import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: { changes: { id: string; value: boolean | string; reason: string; source?: string }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.getByRole("button", { name: "Settings" });
const menu = (page: Page) => page.getByRole("menu").first();
const toggle = (page: Page, name: string | RegExp) => page.getByRole("menuitemcheckbox", { name });
const choice = (page: Page) => page.getByRole("menuitem", { name: /^Response style/ });
const option = (page: Page, name: string) => page.getByRole("menuitemradio", { name });
const content = (page: Page) => page.locator('[data-slot="menu-content"]');
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
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
  await page.goto(`/?c=settings-menu&case=${name}`);
  await expect(trigger(page)).toBeVisible();
};

test("Space or Enter on a toggle flips it and keeps the menu open; typeahead moves by label", async ({
  page,
}) => {
  await load(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  const search = toggle(page, /^Web search/);
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(search).toHaveAttribute("aria-checked", "true");
  await expect(search.locator("[data-menu-switch]")).toHaveAttribute("data-checked", "");
  await expect(menu(page)).toBeVisible();
  await expect(search).toBeFocused();
  await page.keyboard.type("m");
  const memory = toggle(page, "Memory");
  await expect(memory).toBeFocused();
  await expect(memory).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Enter");
  await expect(memory).toHaveAttribute("aria-checked", "false");
  await expect(menu(page)).toBeVisible();
  expect(await changes(page)).toEqual([
    { id: "search", value: true, reason: "item-press", source: "keyboard" },
    { id: "memory", value: false, reason: "item-press", source: "keyboard" },
  ]);
});

test("a choice's submenu checks its value, and the row's value changes without the row moving", async ({
  page,
}) => {
  await load(page);
  await trigger(page).click();
  await expect(choice(page)).toHaveAccessibleName("Response style Balanced");
  const box = async () => {
    const rect = await choice(page).boundingBox();
    const menuRect = await content(page).first().boundingBox();
    return { row: rect, menu: menuRect };
  };
  await settled(page);
  const before = await box();
  await choice(page).press("ArrowRight");
  await expect(option(page, "Balanced")).toHaveAttribute("aria-checked", "true");
  await option(page, "Detailed").click();
  await expect(option(page, "Detailed")).toHaveAttribute("aria-checked", "true");
  await expect(option(page, "Balanced")).toHaveAttribute("aria-checked", "false");
  await expect(choice(page)).toHaveAccessibleName("Response style Detailed");
  await expect(menu(page)).toBeVisible();
  expect(await box()).toEqual(before);
  expect(await changes(page)).toEqual([
    { id: "style", value: "detailed", reason: "item-press", source: "mouse" },
  ]);
});

test("a change the host cancels keeps the old value", async ({ page }) => {
  await load(page, "refusing");
  await trigger(page).click();
  await toggle(page, /^Web search/).click();
  await choice(page).press("ArrowRight");
  await option(page, "Concise").click();
  await expect(toggle(page, /^Web search/)).toHaveAttribute("aria-checked", "false");
  await expect(option(page, "Balanced")).toHaveAttribute("aria-checked", "true");
  await expect(choice(page)).toHaveAccessibleName("Response style Balanced");
  expect((await changes(page)).map(({ id, value }) => [id, value])).toEqual([
    ["search", true],
    ["style", "concise"],
  ]);
});

test("agent actions: open, close, toggle and setValue; open, the bridge adds its press", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Settings", ["open", "toggle", "setValue"]);
  const act = (action: string, args: unknown[]) =>
    page.evaluate(
      ([action, args]) =>
        (window as unknown as Fixture).agent.act({ steps: [{ ref: "Settings", action, args }] }),
      [action, args] as const,
    );
  expect(JSON.stringify(await act("toggle", ["search"]))).not.toContain("error");
  expect(JSON.stringify(await act("setValue", ["style", "concise"]))).not.toContain("error");
  expect(JSON.stringify(await act("toggle", ["unknown"]))).toContain("error");
  expect(await changes(page)).toEqual([
    { id: "search", value: true, reason: "imperative", source: "agent" },
    { id: "style", value: "concise", reason: "imperative", source: "agent" },
  ]);
  await trigger(page).click();
  await expect(toggle(page, /^Web search/)).toHaveAttribute("aria-checked", "true");
  await expect(choice(page)).toHaveAccessibleName("Response style Concise");
  await expectAgentActions(page, "Settings", ["close", "toggle", "setValue", "press"]);
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the menu and a submenu open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await load(page);
    await trigger(page).click();
    await choice(page).press("ArrowRight");
    await expect(option(page, "Concise")).toBeFocused();
    await settled(page);
    const results = await new AxeBuilder({ page }).include("#root").analyze();
    expect(results.violations).toEqual([]);
  });

test("a value change or an equal settings copy redraws no row, and focus stays", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "React keys its rows; web redraws them");
  await load(page);
  await trigger(page).click();
  await choice(page).press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "Balanced")).toBeFocused();
  const removed = await page.evaluate(async () => {
    const menu = document.querySelector("kind-settings-menu");
    if (!menu) return -1;
    let count = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) count += record.removedNodes.length;
    });
    observer.observe(menu, { childList: true, subtree: true });
    menu.values = { ...menu.values, search: true };
    menu.settings = structuredClone(menu.settings);
    await new Promise(requestAnimationFrame);
    observer.disconnect();
    return count;
  });
  expect(removed).toBe(0);
  await expect(option(page, "Balanced")).toBeFocused();
  await expect(toggle(page, /^Web search/)).toHaveAttribute("aria-checked", "true");
});

test("with reduced motion the menu only fades and the switch doesn't slide", async ({ page }) => {
  await load(page, "reduced");
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  const transition = await content(page)
    .first()
    .evaluate((el) => {
      const open = getComputedStyle(el).transitionProperty;
      el.setAttribute("data-ending-style", "");
      const closing = getComputedStyle(el).transitionDuration;
      el.removeAttribute("data-ending-style");
      const thumb = el.querySelector("[data-menu-switch-thumb]");
      const track = el.querySelector("[data-menu-switch]");
      return {
        open,
        closing,
        thumb: thumb && getComputedStyle(thumb).transitionProperty,
        track: track && getComputedStyle(track).transitionProperty,
      };
    });
  expect(transition).toEqual({ open: "opacity", closing: "0.12s", thumb: "none", track: "none" });
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the menu is a sheet and a choice's submenu replaces the level", async ({ page }) => {
    await load(page);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(content(page).first()).toHaveAttribute("data-presentation", "sheet");
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
    await choice(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(option(page, "Concise")).toBeFocused();
    await expect(toggle(page, /^Web search/)).toBeHidden();
    await page.keyboard.press("ArrowLeft");
    await expect(choice(page)).toBeFocused();
    await expect(toggle(page, /^Web search/)).toBeVisible();
  });
});
