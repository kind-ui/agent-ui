import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindHost: { removes: { id: string; reason: string; source?: string }[] };
  kindContext: { add(): void };
};

const bar = (page: Page) => page.getByRole("group", { name: "Context" });
const shown = (page: Page) => page.locator('[data-context-bar-part="chip"]:not([data-overflow])');
const more = (page: Page) => page.locator('[data-context-bar-part="overflow"]');
const content = (page: Page) => page.locator('[data-slot="kind-context-bar-content"]');
const items = (page: Page) => content(page).getByRole("listitem");
const removes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.removes);
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style], [data-leaving]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=context-bar&case=${name}`);
  await expect(bar(page)).toBeVisible();
  await expect(more(page)).toHaveAccessibleName("4 more");
};

test("at 360px with 120px chips, two chips show and the other four go behind +4", async ({ page }) => {
  await load(page);
  await expect(shown(page)).toHaveCount(2);
  await expect(more(page)).toHaveText("+4");
  await expect(bar(page).getByRole("listitem")).toHaveCount(2);
});

test("the chips are one Tab stop; Delete removes the focused one and focus moves to its neighbor", async ({
  page,
}) => {
  await load(page);
  await page.locator("body").press("Tab");
  await expect(shown(page).first()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(shown(page).nth(1)).toBeFocused();
  // The next chip doesn't fit, so the arrow stays on the last one shown.
  await page.keyboard.press("ArrowRight");
  await expect(shown(page).nth(1)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(more(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Delete");
  await expect(more(page)).toHaveText("+3");
  await settled(page);
  await expect(shown(page)).toHaveCount(2);
  // The chip after it didn't fit while it left, so focus moved to the one before.
  await expect(page.locator('[data-context-bar-part="chip"]:focus')).toContainText("conversation-view-0");
  expect(await removes(page)).toEqual([{ id: "chip-1", reason: "remove-press", source: "keyboard" }]);
});

test("parts written with whitespace inside are filled in, and the list opens at the button's end", async ({
  page,
}) => {
  await load(page, "written");
  await expect(shown(page)).toHaveCount(2);
  await more(page).click();
  await expect(items(page)).toHaveCount(4);
  await expect(content(page)).toHaveAttribute("data-align", "end");
});

test("a focused chip that no longer fits hands focus to the last chip shown", async ({ page }) => {
  await load(page);
  await shown(page).nth(1).focus();
  await page.locator("#context").evaluate((el) => {
    (el.parentElement as HTMLElement).style.width = "260px";
  });
  await expect(more(page)).toHaveText("+5");
  await expect(shown(page).first()).toBeFocused();
});

test("a host that refuses keeps the chip", async ({ page }) => {
  await load(page, "refusing");
  await shown(page).first().focus();
  await page.keyboard.press("Backspace");
  await expect(more(page)).toHaveText("+4");
  await expect(shown(page).first()).toBeFocused();
});

test("adding a chip moves nothing below the bar and counts it behind +N in the same frame", async ({
  page,
}) => {
  await load(page);
  const below = () => page.locator("#below").evaluate((el) => el.getBoundingClientRect().toJSON());
  const before = await below();
  // Every frame from the change on shows two chips, never three.
  const frames = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const counts: number[] = [];
        const count = () =>
          document.querySelectorAll('[data-context-bar-part="chip"]:not([data-overflow]):not([data-leaving])')
            .length;
        const frame = () => {
          counts.push(count());
          if (counts.length < 6) requestAnimationFrame(frame);
          else resolve(counts);
        };
        (window as unknown as Fixture).kindContext.add();
        requestAnimationFrame(frame);
      }),
  );
  expect(frames).toEqual([2, 2, 2, 2, 2, 2]);
  await expect(more(page)).toHaveText("+5");
  expect(await below()).toEqual(before);
});

test("+N lists the rest; removing one there updates the count, and Escape returns to +N", async ({
  page,
}) => {
  await load(page);
  await more(page).click();
  await expect(page.getByRole("dialog", { name: "Context" })).toBeVisible();
  await expect(items(page)).toHaveCount(4);
  await expect(items(page).first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items(page).nth(1)).toBeFocused();
  await page.keyboard.press("Delete");
  await expect(more(page)).toHaveText("+3");
  await settled(page);
  await expect(items(page)).toHaveCount(3);
  await expect(items(page).nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(content(page)).toBeHidden();
  await expect(more(page)).toBeFocused();
  expect(await removes(page)).toEqual([{ id: "chip-3", reason: "remove-press", source: "keyboard" }]);
});

test("removing the last chip behind +N closes the list and focus stays in the bar", async ({ page }) => {
  await page.goto("/?c=context-bar&case=none");
  await more(page).click();
  for (let left = 4; left > 0; left--) {
    await expect(items(page)).toHaveCount(left);
    await page.keyboard.press("Delete");
  }
  await expect(content(page)).toBeHidden();
  await expect(more(page)).toBeHidden();
  await expect(shown(page).last()).toBeFocused();
});

test("an agent sees one Context entry, removes by id, and refuses an unknown one", async ({
  page,
}, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page);
  await expectAgentActions(page, "Context", ["remove", "open", "press"]);
  const act = (action: string, args: unknown[]) =>
    page.evaluate(
      ({ action, args }) =>
        (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent
          .act({ steps: [{ ref: "Context", action, args }] })
          .then(JSON.stringify, (error: Error) => error.message),
      { action, args },
    );
  await act("remove", ["chip-0"]);
  await expect(more(page)).toHaveText("+3");
  expect(await removes(page)).toEqual([{ id: "chip-0", reason: "imperative", source: "agent" }]);
  expect(await act("remove", ["nope"])).not.toContain('"ok":true');
  await act("open", []);
  await expect(content(page)).toBeVisible();
  await expectAgentActions(page, "Context", ["remove", "close", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the list open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await more(page).click();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the list only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto(`/?c=context-bar&case=${fixture}`);
    await more(page).click();
    await expect(content(page)).toBeVisible();
    const transition = await content(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s" });
  });
}

test('with motion "none" the list opens without a transition', async ({ page }) => {
  await page.goto("/?c=context-bar&case=none");
  await more(page).click();
  await expect(content(page)).toBeVisible();
  expect(await content(page).evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test.describe("on a touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("+N opens the list as a bottom sheet", async ({ page }) => {
    await load(page);
    await more(page).tap();
    await expect(content(page)).toHaveAttribute("data-presentation", "sheet");
    await expect(
      page.locator('[data-slot="kind-context-bar-viewport"] > [data-slot="kind-context-bar-content"]'),
    ).toHaveCount(1);
  });
});
