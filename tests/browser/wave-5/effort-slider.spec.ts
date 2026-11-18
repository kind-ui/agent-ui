import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Change = { component: string; value: string | null; reason: string; source?: string };
type Fixture = {
  kindHost: { changes: Change[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.locator('#effort [data-slot="kind-effort-slider-trigger"]');
const content = (page: Page) => page.locator('[data-slot="kind-effort-slider-content"]');
const thumb = (page: Page) => page.getByRole("slider", { name: "Effort" });
const reset = (page: Page) => content(page).getByRole("button", { name: "Reset" });
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const act = (page: Page, ref: string, action: string, args: unknown[] = []) =>
  page.evaluate(
    ({ ref, action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { ref, action, args },
  );
// The popup shows a frame before its entrance starts: UI SDK holds `data-starting-style` on it for that frame.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=effort-slider&case=${name}`);
  await expect(trigger(page)).toHaveAccessibleName("Effort, Medium");
};
const open = async (page: Page) => {
  await trigger(page).click();
  await expect(thumb(page)).toBeFocused();
};

test("a group and a button named by the label and the level, which opens with focus on the thumb", async ({
  page,
}) => {
  await load(page);
  await expect(page.getByRole("group", { name: "Effort, Medium" })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
  await open(page);
  await expect(page.getByRole("dialog", { name: "Effort" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(content(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("the arrow keys move one level, read its label and report each once; Home and End reach the ends", async ({
  page,
}) => {
  await load(page);
  await open(page);
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Medium");
  await page.keyboard.press("ArrowRight");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "High");
  await expect(trigger(page)).toHaveAccessibleName("Effort, High");
  await page.keyboard.press("End");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Max");
  await expect(trigger(page)).toHaveAttribute("data-top", "");
  await expect(trigger(page).locator("[data-current] [data-effort-slider-sparkle]")).toHaveCount(1);
  await page.keyboard.press("Home");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Low");
  await expect(trigger(page)).not.toHaveAttribute("data-top", "");
  expect(await changes(page)).toEqual([
    { component: "value", value: "high", reason: "step-key", source: "keyboard" },
    { component: "value", value: "max", reason: "step-key", source: "keyboard" },
    { component: "value", value: "low", reason: "step-key", source: "keyboard" },
  ]);
});

test("a drag reports one change, when it ends", async ({ page }) => {
  await load(page);
  await open(page);
  const box = await page.locator('[data-slot="slider-track"]').boundingBox();
  const at = (fraction: number) => [(box?.x ?? 0) + (box?.width ?? 0) * fraction, (box?.y ?? 0) + 2] as const;
  await page.mouse.move(...at(1 / 3));
  await page.mouse.down();
  await page.mouse.move(...at(2 / 3), { steps: 4 });
  await page.mouse.move(...at(1), { steps: 4 });
  await page.mouse.up();
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Max");
  // UI SDK reads a `pointerup` without pressure as a virtual pointer, which is how Playwright's mouse lifts.
  expect((await changes(page)).map(({ value, reason }) => [value, reason])).toEqual([["max", "drag"]]);
});

test("Reset comes and goes without moving the slider, and its focus moves to the thumb", async ({ page }) => {
  await load(page);
  await open(page);
  await settled(page);
  await expect(reset(page)).toHaveCount(0);
  const before = await thumb(page).evaluate((el) =>
    el.closest("[data-slot=slider]")?.getBoundingClientRect().toJSON(),
  );
  await page.keyboard.press("ArrowLeft");
  await expect(reset(page)).toBeVisible();
  const after = await thumb(page).evaluate((el) =>
    el.closest("[data-slot=slider]")?.getBoundingClientRect().toJSON(),
  );
  expect(after).toEqual(before);
  await reset(page).focus();
  await page.keyboard.press("Enter");
  await expect(reset(page)).toHaveCount(0);
  await expect(thumb(page)).toBeFocused();
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Medium");
  expect((await changes(page)).at(-1)).toEqual({
    component: "value",
    value: "medium",
    reason: "reset-press",
    source: "keyboard",
  });
});

test("a host that refuses keeps the level, and the slider goes back", async ({ page }) => {
  await load(page, "refusing");
  await open(page);
  await page.keyboard.press("ArrowRight");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Medium");
  await expect(trigger(page)).toHaveAccessibleName("Effort, Medium");
  expect(await changes(page)).toEqual([
    { component: "value", value: "high", reason: "step-key", source: "keyboard" },
  ]);
});

test("the model line is a button that reports the model", async ({ page }) => {
  await load(page);
  await open(page);
  await content(page).getByRole("button", { name: "Effort for GPT-5" }).click();
  expect(await changes(page)).toEqual([
    { component: "model", value: "GPT-5", reason: "model-press", source: "mouse" },
  ]);
});

test("an agent sees open and setValue, then reset once the level changed, and is refused an unknown level", async ({
  page,
}) => {
  await load(page);
  await expectAgentActions(page, "Effort, Medium", ["open", "setValue"]);
  expect(await act(page, "Effort, Medium", "setValue", ["extreme"])).not.toContain('"ok":true');
  expect(await act(page, "Effort, Medium", "setValue", ["high"])).toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Effort, High");
  await expectAgentActions(page, "Effort, High", ["open", "setValue", "reset"]);
  expect(await act(page, "Effort, High", "reset")).toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Effort, Medium");
  expect(await changes(page)).toEqual([
    { component: "value", value: "high", reason: "imperative", source: "agent" },
    { component: "value", value: "medium", reason: "imperative", source: "agent" },
  ]);
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the popup is a sheet in its viewport, flush with the screen's bottom and sides", async ({ page }) => {
    await load(page);
    await trigger(page).tap();
    await expect(content(page)).toHaveAttribute("data-presentation", "sheet");
    await expect(
      page.locator('[data-slot="kind-effort-slider-viewport"] > [data-slot="kind-effort-slider-content"]'),
    ).toHaveCount(1);
    await expect
      .poll(() => content(page).evaluate((el) => el.getBoundingClientRect().toJSON()))
      .toMatchObject({ left: 0, right: 390, bottom: 844 });
  });
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the popup only fades`, async ({ page }) => {
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
  test(`axe reports no violations with the popup open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await open(page);
    await page.keyboard.press("End");
    await expect(reset(page)).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("in forced colors the sparkle and the chevron keep a system color", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", colorScheme: "dark" });
  await load(page);
  await open(page);
  const colors = await page.evaluate(() => {
    const color = (selector: string) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).backgroundColor : null;
    };
    return {
      chevron: color("[data-effort-slider-chevron]"),
      sparkle: color("[data-effort-slider-stop] [data-effort-slider-sparkle]"),
      canvas: color('[data-slot="kind-effort-slider-content"]'),
    };
  });
  expect(colors.chevron).not.toBe(colors.canvas);
  expect(colors.sparkle).not.toBe(colors.canvas);
});
