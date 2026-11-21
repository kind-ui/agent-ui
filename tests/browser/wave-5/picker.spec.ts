import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Change = { component: string; value: string | null; reason: string; source?: string };
type Fixture = {
  kindHost: { changes: Change[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.locator('#picker [data-slot="kind-picker-trigger"]');
const content = (page: Page) => page.locator('[data-slot="kind-picker-content"]');
const search = (page: Page) => page.getByRole("combobox", { name: "Work in" });
const options = (page: Page) => content(page).getByRole("option");
const option = (page: Page, name: string | RegExp) => content(page).getByRole("option", { name });
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const act = (page: Page, ref: string, action: string, args: unknown[]) =>
  page.evaluate(
    ({ ref, action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { ref, action, args },
  );
// The list shows a frame before its entrance starts: UI SDK holds `data-starting-style` on it for that frame. A sheet's
// scroll-driven animations follow its scroll and never finish.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" || !(animation.timeline instanceof DocumentTimeline),
        ),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=picker&case=${name}`);
  await expect(trigger(page)).toHaveAccessibleName(name === "plain" ? "Branch" : "Work in, kind-ui/agent-ui");
};
const openList = async (page: Page) => {
  await trigger(page).click();
  await expect(search(page)).toBeFocused();
};

test("a group and a button named by the label and the chosen item", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("group", { name: "Work in, kind-ui/agent-ui" })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
});

test("opening focuses the search; Escape clears the query, then closes and returns focus to the trigger", async ({
  page,
}) => {
  await load(page);
  await openList(page);
  await expect(search(page)).toHaveAttribute("placeholder", "Search…");
  await search(page).fill("bra");
  await expect(options(page)).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveValue("");
  await expect(content(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("a search filters the page it's on, Backspace goes back to the query typed before, and the check follows across pages", async ({
  page,
}) => {
  await load(page);
  await openList(page);
  await search(page).fill("bra");
  await expect(options(page)).toHaveText([/Branches/]);
  await page.keyboard.press("Enter");
  await expect(options(page)).toHaveCount(4);
  await expect(search(page)).toHaveValue("");
  await search(page).fill("pi");
  await expect(options(page)).toHaveCount(1);
  await expect(option(page, /^picker/)).toBeVisible();
  await search(page).fill("");
  await page.keyboard.press("Backspace");
  await expect(search(page)).toHaveValue("bra");
  await expect(options(page)).toHaveText([/Branches/]);

  await page.keyboard.press("Enter");
  await option(page, /^picker/).click();
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toHaveAccessibleName("Work in, picker");

  await openList(page);
  await expect(option(page, /^kind-ui\/agent-ui/)).toHaveAttribute("aria-checked", "false");
  await expect(content(page).locator('[role="option"][aria-checked="true"]:visible')).toHaveCount(0);
  await option(page, /^Branches/).click();
  await expect(option(page, /^picker/)).toHaveAttribute("aria-checked", "true");
  await expect(option(page, /^main/)).toHaveAttribute("aria-checked", "false");
});

test("the arrow keys reach the footer action, and Enter runs it and closes", async ({ page }) => {
  await load(page);
  await openList(page);
  await page.keyboard.press("ArrowUp");
  await expect(option(page, "New project")).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Enter");
  await expect(content(page)).toBeHidden();
  expect(await changes(page)).toEqual([
    { component: "action", value: "new", reason: "item-press", source: "keyboard" },
  ]);
});

test("rows keep one height with and without a description, and with a marked description", async ({
  page,
}) => {
  await load(page);
  await openList(page);
  await settled(page);
  const heights = (rows: ReturnType<typeof options>) =>
    rows.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  const all = await heights(options(page));
  expect(all.length).toBeGreaterThan(4);
  expect(new Set(all).size).toBe(1);
  await search(page).fill("code");
  await expect(content(page).locator("[data-picker-description] mark").first()).toBeVisible();
  const marked = await heights(options(page));
  expect(marked).toEqual(marked.map(() => all[0]));
});

test("a click chooses the item, closes and renames the trigger", async ({ page }) => {
  await load(page);
  await openList(page);
  await option(page, /^kind-ui\/docs/).click();
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toHaveAccessibleName("Work in, kind-ui/docs");
  expect(await changes(page)).toEqual([
    { component: "value", value: "kind-ui/docs", reason: "item-press", source: "mouse" },
  ]);
});

test("a host that refuses keeps the value and the list open, as a cancelled action does", async ({
  page,
}) => {
  await load(page, "refusing");
  await openList(page);
  await option(page, /^kind-ui\/docs/).click();
  await expect(content(page)).toBeVisible();
  await expect(trigger(page)).toHaveAccessibleName("Work in, kind-ui/agent-ui");
  await option(page, "New project").click();
  await expect(content(page)).toBeVisible();
  expect((await changes(page)).map(({ component, value }) => [component, value])).toEqual([
    ["value", "kind-ui/docs"],
    ["action", "new"],
  ]);
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the list is a sheet in its viewport, flush with the screen's bottom and sides", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await load(page);
    await trigger(page).tap();
    await expect(content(page)).toBeVisible();
    await expect(content(page)).toHaveAttribute("data-presentation", "sheet");
    await expect(
      page.locator('[data-slot="kind-picker-viewport"] > [data-slot="kind-picker-content"]'),
    ).toHaveCount(1);
    await expect
      .poll(() => content(page).evaluate((el) => el.getBoundingClientRect().toJSON()))
      .toMatchObject({ left: 0, right: 390, bottom: 844 });
    // A sheet that resizes before its opening motion's first frame throws from `@ui-sdk/core` (AGENTS.md).
    await settled(page);
    expect(errors).toEqual([]);
  });
});

test("presentation sheet puts the list in its viewport on a desktop too, and closing leaves none", async ({
  page,
}) => {
  await load(page, "sheet");
  await trigger(page).click();
  await expect(content(page)).toHaveAttribute("data-presentation", "sheet");
  await expect(
    page.locator('[data-slot="kind-picker-viewport"] > [data-slot="kind-picker-content"]'),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('[data-slot="kind-picker-viewport"]')).toHaveCount(0);
});

test("without an icon or a choice, the trigger shows the label, then the chosen item", async ({ page }) => {
  await load(page, "plain");
  await expect(trigger(page)).toHaveText("Branch");
  await expect(trigger(page)).toHaveAccessibleName("Branch");
  await trigger(page).click();
  await option(page, "dev").click();
  await expect(trigger(page)).toHaveText("dev");
  await expect(trigger(page)).toHaveAccessibleName("Branch, dev");
});

test("an agent sees open, setValue and run, chooses a leaf on a page and is refused an unknown value", async ({
  page,
}) => {
  await load(page);
  await expectAgentActions(page, "Work in, kind-ui/agent-ui", ["open", "setValue", "run"]);
  expect(await act(page, "Work in, kind-ui/agent-ui", "setValue", ["unknown"])).not.toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Work in, kind-ui/agent-ui");
  expect(await act(page, "Work in, kind-ui/agent-ui", "setValue", ["main"])).toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Work in, main");
  expect(await changes(page)).toEqual([
    { component: "value", value: "main", reason: "imperative", source: "agent" },
  ]);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the list only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await load(page, fixture);
    await trigger(page).click();
    await expect(content(page)).toBeVisible();
    const transition = await content(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s" });
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the list open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await openList(page);
    await search(page).fill("code");
    await expect(content(page).locator("mark").first()).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("in forced colors the chevron and the check keep a system color, unlike what's behind them", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", colorScheme: "dark" });
  await load(page);
  await openList(page);
  const colors = await page.evaluate(() => {
    const color = (selector: string) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).backgroundColor : null;
    };
    return {
      chevron: color("[data-picker-chevron]"),
      check: color("[data-chosen] [data-picker-mark]"),
      canvas: color('[data-slot="kind-picker-content"]'),
    };
  });
  expect(colors.chevron).not.toBe(colors.canvas);
  expect(colors.check).not.toBe(colors.canvas);
});
