import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";

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

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=selection&case=${name}`);
  await expect(content(page)).toBeVisible();
};

// The viewport point at `offset` characters into the first text of `selector`.
const pointAt = (page: Page, selector: string, offset: number) =>
  page.evaluate(
    ([sel, at]) => {
      const scope = document.querySelector("#shadow-host")?.shadowRoot ?? document;
      const text = scope.querySelector(sel)?.firstChild as Text;
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

const dragReply = async (page: Page) => {
  await drag(page, await pointAt(page, "#reply", 0), await pointAt(page, "#reply", 26));
  await page.mouse.up();
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

test("a press inside the root after Escape lets the same selection show the toolbar again", async ({
  page,
}) => {
  await open(page);
  await dragReply(page);
  const text = await selected(page);
  await page.keyboard.press("Escape");
  await expect(toolbar(page)).toBeHidden();
  // A drag that starts on a live selection drags the text instead of selecting, so the press lands elsewhere in the
  // root and the same range is selected again before it ends.
  const point = await pointAt(page, "#reply-2", 8);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.evaluate(() => {
    const node = document.querySelector("#reply")?.firstChild as Text;
    document.getSelection()?.setBaseAndExtent(node, 0, node, 26);
  });
  await page.mouse.up();
  expect(await selected(page)).toBe(text);
  await expect(toolbar(page)).toBeVisible();
});

test("a host that cancels onAction and onDismiss keeps the toolbar and the selection", async ({ page }) => {
  await open(page, "refused");
  await selectWithKeyboard(page);
  await button(page, "Quote").click();
  await page.keyboard.press("Escape");
  await page.locator("#outside").click();
  await frames(page);
  await expect(toolbar(page)).toBeVisible();
  expect(await selected(page)).toBe("Rate limits");
  const log = await host(page);
  expect(log.actions).toEqual([["quote", "Rate limits", "item-press", "mouse"]]);
  expect(log.dismissals).toEqual([
    ["Rate limits", "escape-key", "keyboard"],
    ["Rate limits", "outside-press", "mouse"],
  ]);
});

test("an action's description is its button's title", async ({ page }) => {
  await open(page);
  await selectWithKeyboard(page);
  await expect(button(page, "Copy")).toHaveAttribute("title", "Copy the selected text");
  await expect(button(page, "Ask")).not.toHaveAttribute("title");
});

test("without onAction the buttons are disabled and agents can't run one", async ({ page }) => {
  await open(page, "static");
  await selectWithKeyboard(page);
  for (const name of ["Ask", "Quote", "Copy"]) await expect(button(page, name)).toBeDisabled();
  const actions = await page.evaluate(
    () =>
      (window as unknown as { agent: { snapshot(): { label?: string; actions: string[] }[] } }).agent
        .snapshot()
        .find((entry) => entry.label === "Selection actions")?.actions,
  );
  expect(actions).toContain("dismiss");
  expect(actions).not.toContain("run");
});

test("a selection inside a shadow root shows the toolbar", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "a web element in a shadow root");
  await open(page, "shadow");
  await dragReply(page);
  expect(await page.evaluate(() => getSelection()?.toString())).toContain("Rate limits reset every");
  await expect(toolbar(page)).toBeVisible();
});

type Motion = { property: string; duration: string; scale: string };

// The toolbar's transition as it shows, and as it starts leaving after Escape.
const transitions = async (page: Page) => {
  await selectWithKeyboard(page);
  await settled(page);
  const shown = await toolbar(page).evaluate((el) => {
    const style = getComputedStyle(el);
    return { property: style.transitionProperty, duration: style.transitionDuration, scale: "" };
  });
  await toolbar(page).evaluate((el) => {
    const record = window as unknown as { leaving?: Motion };
    record.leaving = undefined;
    new MutationObserver(() => {
      if (!el.hasAttribute("data-ending-style") || record.leaving) return;
      const style = getComputedStyle(el);
      record.leaving = {
        property: style.transitionProperty,
        duration: style.transitionDuration,
        scale: style.scale,
      };
    }).observe(el, { attributes: true, attributeFilter: ["data-ending-style"] });
  });
  await page.keyboard.press("Escape");
  await expect(toolbar(page)).toBeHidden();
  const leaving = await page.evaluate(() => (window as unknown as { leaving?: Motion }).leaving);
  return { shown, leaving };
};

const seconds = (page: Page, token: string) =>
  page.evaluate(
    (name) => `${parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) / 1000}s`,
    token,
  );

test("full motion fades and scales the toolbar; reduced motion only fades it", async ({ page }) => {
  await open(page);
  const base = await seconds(page, "--kind-duration-base");
  const exit = await seconds(page, "--kind-duration-exit");
  const reducedDuration = await seconds(page, "--kind-duration-reduced");
  const full = await transitions(page);
  expect(full.shown).toMatchObject({ property: "opacity, scale", duration: `${base}, ${base}` });
  // `[data-ending-style]` sets one duration for both properties.
  expect(full.leaving).toMatchObject({ property: "opacity, scale", duration: exit });
  expect(full.leaving?.scale).not.toBe("none");

  const fadeOnly = { property: "opacity", duration: reducedDuration, scale: "none" };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect((await transitions(page)).leaving).toEqual(fadeOnly);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  expect((await transitions(page)).leaving).toEqual(fadeOnly);
});

test('motion="none" has no transition and hides the toolbar at once', async ({ page }) => {
  await open(page, "none");
  await selectWithKeyboard(page);
  await expect(toolbar(page)).toHaveCSS("transition-property", "none");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(() => {
      const el = document.querySelector('[data-slot="kind-selection-toolbar"]') as HTMLElement | null;
      return !el || el.hidden;
    }),
  ).toBe(true);
});
