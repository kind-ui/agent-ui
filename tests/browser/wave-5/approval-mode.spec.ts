import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindHost: {
    changes: { value: string; reason: string; source?: string }[];
    learned: { href: string | undefined; source?: string }[];
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.getByRole("button", { name: /^Approvals, / });
const menu = (page: Page) => page.getByRole("menu").first();
const mode = (page: Page, name: string | RegExp) => page.getByRole("menuitemradio", { name });
const learnMore = (page: Page) => page.getByRole("menuitem", { name: "Learn more" });
const content = (page: Page) => page.locator('[data-slot="menu-content"]');
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const act = (page: Page, value: string) =>
  page.evaluate(
    (value) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Approvals, Ask every time", action: "setValue", args: [value] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    value,
  );
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
  await page.goto(`/?c=approval-mode&case=${name}`);
  await expect(trigger(page)).toBeVisible();
};

test("arrow keys and Enter choose a mode and the menu closes", async ({ page }) => {
  await load(page);
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Ask every time");
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(mode(page, /^Ask every time/)).toBeFocused();
  await expect(mode(page, /^Ask every time/)).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("ArrowDown");
  await expect(mode(page, /^Allow edits/)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Allow edits");
  await expect(trigger(page)).toBeFocused();
  expect(await changes(page)).toEqual([{ value: "edits", reason: "item-press", source: "keyboard" }]);
});

test("the danger row says Risky once, in words, and its label keeps the text color", async ({ page }) => {
  await load(page);
  await trigger(page).click();
  const full = mode(page, /^Full access/);
  await expect(full).toHaveAccessibleName(/Risky/);
  await expect(full).toHaveAttribute("data-danger", "");
  await expect(full.locator("[data-status-mark]")).toHaveCount(0);
  const [label, other] = await Promise.all(
    [full, mode(page, /^Ask every time/)].map((row) =>
      row.locator("[data-menu-text] > :first-child").evaluate((el) => getComputedStyle(el).color),
    ),
  );
  expect(label).toBe(other);
  await full.click();
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Full access, risky");
});

test("Learn more comes after the modes and follows its href", async ({ page }) => {
  await load(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(mode(page, /^Ask every time/)).toBeFocused();
  await page.keyboard.press("End");
  await expect(learnMore(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#approvals-help");
});

test("without a link, Learn more calls onLearnMore once and closes the menu", async ({ page }) => {
  await load(page, "learning");
  await trigger(page).click();
  await learnMore(page).click();
  await expect(menu(page)).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.learned)).toEqual([
    { href: undefined, source: "mouse" },
  ]);
});

test("a value change or an equal modes copy redraws nothing, and focus stays", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "React keys its rows; web redraws them");
  await load(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await expect(mode(page, /^Allow edits/)).toBeFocused();
  const removed = await page.evaluate(async () => {
    const menu = document.querySelector("kind-approval-mode");
    if (!menu?.modes) return -1;
    let count = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) count += record.removedNodes.length;
    });
    observer.observe(menu, { childList: true, subtree: true });
    menu.modes = structuredClone(menu.modes);
    await new Promise(requestAnimationFrame);
    observer.disconnect();
    return count;
  });
  expect(removed).toBe(0);
  await expect(mode(page, /^Allow edits/)).toBeFocused();
});

test("an agent's setValue needs a person while agentConfirm is on", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Approvals, Ask every time", ["open", "setValue"]);
  expect(await act(page, "full")).toContain("Needs a person");
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Ask every time");
  expect(await changes(page)).toEqual([]);
});

test("with agentConfirm off an agent sets the mode, and an unknown one is refused", async ({ page }) => {
  await load(page, "unconfirmed");
  expect(await act(page, "unknown")).toContain("error");
  expect(await act(page, "full")).toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Full access, risky");
  expect(await changes(page)).toEqual([{ value: "full", reason: "imperative", source: "agent" }]);
});

test("a change the host cancels keeps the old value and the menu open", async ({ page }) => {
  await load(page, "refusing");
  await trigger(page).click();
  await mode(page, /^Allow edits/).click();
  await expect(menu(page)).toBeVisible();
  await expect(mode(page, /^Ask every time/)).toHaveAttribute("aria-checked", "true");
  await expect(mode(page, /^Allow edits/)).toHaveAttribute("aria-checked", "false");
  await expect(trigger(page)).toHaveAccessibleName("Approvals, Ask every time");
  expect((await changes(page)).map(({ value }) => value)).toEqual(["edits"]);
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the menu open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).include("#root").analyze();
    expect(results.violations).toEqual([]);
  });

test("with reduced motion the menu only fades", async ({ page }) => {
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
      return { open, closing };
    });
  expect(transition).toEqual({ open: "opacity", closing: "0.12s" });
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the menu is a sheet", async ({ page }) => {
    await load(page);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(content(page).first()).toHaveAttribute("data-presentation", "sheet");
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
});
