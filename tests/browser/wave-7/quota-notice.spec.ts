import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { upgrades: string[]; dismisses: number; setUsed(used: number): void };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const HALF = "You've used 50% of this month's requests";
const SPENT = "You've used all of your tokens";

const notice = (page: Page, name: string) => page.getByRole("note", { name });
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const setUsed = (page: Page, used: number) =>
  page.evaluate((value) => (window as unknown as Fixture).kindHost.setUsed(value), used);
const afterFrames = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const open = async (page: Page, name = "all") => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`/?c=quota-notice&case=${name}`);
  await expect(notice(page, SPENT)).toBeVisible();
};

test("shows how much is used in its title, a named bar with the amounts, and when it resets", async ({
  page,
}) => {
  await open(page);
  const quota = notice(page, HALF);
  await expect(quota.getByRole("img", { name: "Info" })).toBeVisible();
  const meter = quota.getByRole("meter", { name: "Usage" });
  await expect(meter).toHaveAttribute("aria-valuetext", "500 of 1,000 requests, 50%");
  await expect(quota).toContainText("500 of 1,000 requests");
  await expect(quota).toContainText("Resets in 3 days");
  await expect(quota.getByRole("button", { name: "Upgrade" })).toBeVisible();
  await expect(quota.getByRole("button", { name: "Dismiss" })).toBeVisible();

  const spent = notice(page, SPENT);
  await expect(spent.getByRole("img", { name: "Error" })).toBeVisible();
  await expect(spent.getByRole("meter", { name: "Usage" })).toHaveAttribute(
    "aria-valuetext",
    "200,000 of 200,000 tokens, 100%",
  );
  await expect(spent).toContainText("smaller model");
  await expect(spent.getByRole("button")).toHaveCount(0);
});

test("warns from 80% and errs at the limit, announcing each once and nothing in between", async ({
  page,
}) => {
  await open(page);
  await afterFrames(page);
  const top = await page.locator("#below").evaluate((el) => el.getBoundingClientRect().top);
  await setUsed(page, 700);
  await expect(notice(page, "You've used 70% of this month's requests")).toBeVisible();
  await setUsed(page, 800);
  const warning = notice(page, "You've used 80% of this month's requests");
  await expect(warning).toHaveAttribute("data-variant", "warning");
  await expect(warning.getByRole("img", { name: "Warning" })).toBeVisible();
  // A polite announcement replaces one still waiting, so the next change waits for it.
  await expect.poll(() => announced(page)).toEqual(["You've used 80% of this month's requests"]);
  await setUsed(page, 850);
  await expect(notice(page, "You've used 85% of this month's requests")).toBeVisible();
  await setUsed(page, 1000);
  await expect(notice(page, "You've used all of this month's requests")).toHaveAttribute(
    "data-variant",
    "error",
  );
  await expect
    .poll(() => announced(page))
    .toEqual(["You've used 80% of this month's requests", "You've used all of this month's requests"]);
  expect(await page.locator("#below").evaluate((el) => el.getBoundingClientRect().top)).toBe(top);
});

test("Upgrade and Dismiss work from the keyboard", async ({ page }) => {
  await open(page);
  await page.locator("#above").focus();
  await page.keyboard.press("Tab");
  await expect(notice(page, HALF).getByRole("button", { name: "Upgrade" })).toBeFocused();
  await page.keyboard.press("Enter");
  expect((await host(page)).upgrades).toEqual(["keyboard"]);
  await page.keyboard.press("Tab");
  await expect(notice(page, HALF).getByRole("button", { name: "Dismiss" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#below")).toBeFocused();
  await expect.poll(async () => (await host(page)).dismisses).toBe(1);
  await expect(notice(page, HALF)).toHaveCount(0);
});

test("the reset countdown follows the clock and is never announced", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-12-01T00:00:00Z") });
  await open(page, "clock");
  const quota = notice(page, HALF);
  await expect(quota).toContainText("Resets in 5 sec");
  await page.clock.runFor(2000);
  await expect(quota).toContainText("Resets in 3 sec");
  await page.clock.runFor(4000);
  await expect(quota).toContainText("Resets now");
  expect(await announced(page)).toEqual([]);
});

test("agents upgrade and dismiss a notice that offers them", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, SPENT, []);
  await expectAgentActions(page, HALF, ["dismiss", "upgrade"]);
  const result = await page.evaluate(
    (ref) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action: "upgrade", args: [] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    HALF,
  );
  expect(result).toContain('"ok":true');
  expect((await host(page)).upgrades).toEqual(["agent"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await setUsed(page, 850);
    await expect(notice(page, "You've used 85% of this month's requests")).toBeVisible();
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
