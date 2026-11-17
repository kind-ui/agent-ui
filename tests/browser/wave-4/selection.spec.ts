import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { actions: unknown[][]; dismissals: unknown[][] };
  agent: { act(input: unknown): Promise<unknown> };
};

const toolbar = (page: Page) => page.locator('[data-slot="kind-selection-toolbar"]');
const content = (page: Page) => page.locator('#selection [data-slot="kind-selection-content"]');
const button = (page: Page, name: string) => toolbar(page).getByRole("button", { name });
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const selected = (page: Page) => page.evaluate(() => document.getSelection()?.toString() ?? "");
// Two frames, so a toolbar that was going to open has rendered in either layer.
const frames = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
// The toolbar's entrance starts a frame after it shows, once UI SDK drops `data-starting-style`.
const settled = async (page: Page) => {
  await frames(page);
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
};
const activeSlot = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    return active?.closest("[data-slot]")?.getAttribute("data-slot") ?? active?.tagName;
  });

const open = async (page: Page) => {
  await page.goto("/?c=selection&case=all");
  await expect(content(page)).toBeVisible();
};

// The viewport point at `offset` characters into the first text of `selector`.
const pointAt = (page: Page, selector: string, offset: number) =>
  page.evaluate(
    ([sel, at]) => {
      const text = document.querySelector(sel)?.firstChild as Text;
      const range = document.createRange();
      range.setStart(text, at);
      range.setEnd(text, at + 1);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + 1, y: rect.top + rect.height / 2 };
    },
    [selector, offset] as const,
  );

const drag = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 5 });
};

// Places a selection of the reply's first characters and extends it by one with the keyboard.
const selectWithKeyboard = async (page: Page) => {
  await content(page).focus();
  await page.evaluate(() => {
    const text = document.querySelector("#reply")?.firstChild as Text;
    document.getSelection()?.setBaseAndExtent(text, 0, text, 10);
  });
  await page.keyboard.press("Shift+ArrowRight");
  await expect(toolbar(page)).toBeVisible();
};

test("selecting text with the mouse shows the toolbar above it without moving focus", async ({ page }) => {
  await open(page);
  await drag(page, await pointAt(page, "#reply", 0), await pointAt(page, "#reply", 26));
  const before = await activeSlot(page);
  await page.mouse.up();
  await expect(toolbar(page)).toBeVisible();
  await settled(page);
  expect(await selected(page)).toContain("Rate limits reset every");
  const box = await toolbar(page).boundingBox();
  const top = await page.evaluate(() => document.getSelection()?.getRangeAt(0).getBoundingClientRect().top);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual((top ?? 0) + 0.5);
  expect(await activeSlot(page)).toBe(before);
  await expect(toolbar(page).getByRole("toolbar", { name: "Selection actions" })).toBeVisible();
});

test("a selection reaching outside the root shows no toolbar; collapsing one hides it without moving focus", async ({
  page,
}) => {
  await open(page);
  await drag(page, await pointAt(page, "#reply-2", 5), await pointAt(page, "#after", 10));
  await page.mouse.up();
  await frames(page);
  expect(await selected(page)).toContain("Text after");
  await expect(toolbar(page)).toBeHidden();

  await drag(page, await pointAt(page, "#reply", 0), await pointAt(page, "#reply", 26));
  await page.mouse.up();
  await expect(toolbar(page)).toBeVisible();
  const point = await pointAt(page, "#reply-2", 8);
  await page.mouse.click(point.x, point.y);
  expect(await selected(page)).toBe("");
  await expect(toolbar(page)).toBeHidden();
  expect(await activeSlot(page)).toBe("kind-selection-content");
});

test("keyboard: Shift+Arrow shows the toolbar, Tab reaches it, arrows move in it, Escape keeps the selection", async ({
  page,
}) => {
  await open(page);
  await selectWithKeyboard(page);
  const text = await selected(page);
  expect(text).toBe("Rate limits");
  // The toolbar never takes focus when it opens.
  expect(await activeSlot(page)).toBe("kind-selection-content");
  await page.keyboard.press("Tab");
  await expect(button(page, "Ask")).toBeFocused();
  // Chromium keeps the page's selection when Tab moves focus to the toolbar.
  test
    .info()
    .annotations.push({ type: "tab-from-selection", description: JSON.stringify(await selected(page)) });
  expect(await selected(page)).toBe(text);
  await page.keyboard.press("ArrowRight");
  await expect(button(page, "Quote")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toolbar(page)).toBeHidden();
  expect(await selected(page)).toBe(text);
  await expect(content(page)).toBeFocused();
  expect((await host(page)).dismissals).toEqual([[text, "escape-key", "keyboard"]]);
});

test("pressing an action calls onAction with the selected text, then the toolbar hides", async ({ page }) => {
  await open(page);
  await selectWithKeyboard(page);
  await button(page, "Quote").click();
  await expect(toolbar(page)).toBeHidden();
  expect((await host(page)).actions).toEqual([["quote", "Rate limits", "item-press", "mouse"]]);
  expect(await selected(page)).toBe("Rate limits");
});

test("the toolbar follows the selection when the page scrolls", async ({ page }) => {
  await open(page);
  await selectWithKeyboard(page);
  await settled(page);
  const before = (await toolbar(page).boundingBox())?.y ?? 0;
  await page.evaluate(() => window.scrollBy(0, 100));
  await expect
    .poll(async () => Math.round((await toolbar(page).boundingBox())?.y ?? 0))
    .toBe(Math.round(before - 100));
});

test("agents run an action and dismiss the toolbar while it shows", async ({ page }) => {
  await open(page);
  await selectWithKeyboard(page);
  // `press` is the bridge's own action for a component that holds a button (here, the toolbar's).
  await expectAgentActions(page, "Selection actions", ["dismiss", "press", "run"]);
  await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({
      steps: [{ ref: "Selection actions", action: "run", args: ["ask"] }],
    }),
  );
  await expect(toolbar(page)).toBeHidden();
  expect((await host(page)).actions).toEqual([["ask", "Rate limits", "imperative", "agent"]]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode, with the toolbar open`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await selectWithKeyboard(page);
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
