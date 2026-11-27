import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindHost: {
    changes: { open: boolean; reason: string; source: string }[];
    compacts: string[];
    settleCompact(): void;
    setUsed(used: number): void;
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const VALUE = "57,600 of 128,000 tokens, 45%";

const meter = (page: Page) => page.getByRole("group", { name: "Context" });
const trigger = (page: Page) => meter(page).locator('[data-slot="kind-context-meter-trigger"]');
const details = (page: Page) => page.getByRole("dialog", { name: /% full/ });
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
  test.skip(!isWebElements(testInfo), "Web Components only");
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

test("an agent opens and closes the details, each offered only when it applies", async ({
  page,
}, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
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

test("the breakdown is one image named as a sentence, with a row per slice and Free space last", async ({
  page,
}) => {
  await open(page, "breakdown");
  await expect(details(page)).toHaveAccessibleName("57% full");
  await expect(
    page.getByRole("img", { name: /^57% full: Messages 41,200, Files 18,100/ }),
  ).toHaveAccessibleName(
    "57% full: Messages 41,200, Files 18,100, Tools 9,800, System 3,800, Free space 55,100",
  );
  const rows = page.locator('[data-slot="kind-context-meter-breakdown"] > li');
  await expect(rows).toHaveText([
    "Messages41,20032%",
    "Files18,10014%",
    "Tools9,8008%",
    "System3,8003%",
    "Free space55,10043%",
  ]);
  // Category colors, never a status color.
  const colors = await page
    .locator("[data-context-meter-segment]")
    .evaluateAll((segments) => segments.map((el) => getComputedStyle(el).backgroundColor));
  expect(new Set(colors).size).toBe(4);
});

test("Compact calls onCompact and shows Compacting until it settles; an agent can compact too", async ({
  page,
}, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await open(page, "breakdown");
  await page.getByRole("button", { name: "Compact" }).click();
  await expect(page.locator('[data-slot="kind-context-meter-compacting"]')).toHaveText("Compacting");
  await expect(page.getByRole("button", { name: "Compact" })).toHaveCount(0);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.settleCompact());
  await expect(page.getByRole("button", { name: "Compact" })).toBeVisible();
  expect(await act(page, "compact")).toContain('"ok":true');
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.compacts)).toEqual([
    "mouse",
    "agent",
  ]);
});

test("from 80% the level has words and the description says where it compacts", async ({ page }) => {
  await open(page, "compacting");
  await expect(details(page)).toHaveAccessibleName("86% full · Filling up");
  await expect(details(page)).toHaveAccessibleDescription("110,100 of 128,000 tokens · compacts at 80%");
  await expect(page.locator('[data-slot="kind-context-meter-compacting"]')).toBeVisible();
});

test("each limit is a meter with its share used and reset in words", async ({ page }) => {
  await open(page, "limits");
  const limits = page.locator('[data-slot="kind-context-meter-limits"] [role="meter"]');
  await expect(limits).toHaveCount(2);
  await expect(limits.first()).toHaveAccessibleName("5-hour limit");
  await expect(limits.first()).toHaveAttribute("aria-valuetext", /^62% used, resets \d+:00 [AP]M, in \d hr$/);
  await expect(limits.nth(1)).toHaveAttribute("data-level", "normal");
});

test("from 80% the ring shows the fullest limit and says Running low", async ({ page }) => {
  await open(page, "near-cap");
  await expect(meter(page)).toHaveAttribute("data-level", "high");
  await expect(trigger(page)).toHaveText("Weekly limit 82%");
  await expect(trigger(page)).toHaveAccessibleName("Weekly limit, 82% used");
  const weekly = page.locator('[data-slot="kind-context-meter-limits"] [role="meter"]').nth(1);
  await expect(weekly).toHaveAttribute("data-level", "high");
  await expect(weekly.locator("[data-context-meter-detail]")).toHaveText(/^Running low · Resets /);
});

test("inline, the limits sit in the page without a ring", async ({ page }) => {
  await page.goto("/?c=context-meter&case=inline");
  await expect(meter(page)).toHaveAttribute("data-layout", "inline");
  await expect(trigger(page)).toHaveCount(0);
  const limits = meter(page).locator('[role="meter"]');
  await expect(limits).toHaveCount(3);
  await expect(limits.nth(2).locator("[data-context-meter-detail]")).toHaveText(
    /^\$20\.50 of \$50\.00 · Resets /,
  );
});

test("axe reports no violations with a breakdown and limits", async ({ page }) => {
  for (const name of ["limits", "near-cap", "inline"]) {
    await page.goto(`/?c=context-meter&case=${name}`);
    await expect(meter(page)).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#context").analyze()).violations).toEqual([]);
  }
});
