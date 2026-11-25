import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { reset } from "../../../packages/agent-ui/tests/fixtures/shared/usage-meter.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindHost: { changes: { open: boolean; reason: string; source: string }[]; setUsed(used: number): void };
  agent: { act(input: unknown): Promise<unknown> };
};

const meter = (page: Page, name = "Usage") => page.getByRole("group", { name });
const trigger = (page: Page, name = "Usage") => meter(page, name).locator('[data-meter-part="trigger"]');
const details = (page: Page, name = "Usage") => page.getByRole("dialog", { name });
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const setUsed = (page: Page, used: number) =>
  page.evaluate((value) => (window as unknown as Fixture).kindHost.setUsed(value), used);
const act = (page: Page, action: string) =>
  page.evaluate(
    (name) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Usage", action: name, args: [] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    action,
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, c: string, name: string, label = "Usage") => {
  await page.goto(`/?c=${c}&case=${name}`);
  await expect(trigger(page, label)).toBeVisible();
};

// The bar's segments, as fractions of the bar's width.
const segments = (page: Page, label: string) =>
  meter(page, label)
    .locator('[data-meter-part="breakdown"]')
    .evaluate((bar) => {
      const width = bar.getBoundingClientRect().width;
      return [...bar.children].map((segment) => segment.getBoundingClientRect().width / width);
    });

const shownBreakdown = (page: Page, label: string) =>
  details(page, label).locator('[data-meter-part^="breakdown"]:visible');

test.describe("Usage Meter", () => {
  test("its button reads the label, the amounts and the share; the ring warns from warnAt", async ({
    page,
  }) => {
    await open(page, "usage-meter", "all");
    await expect(trigger(page)).toHaveAccessibleName("Usage, $3.20 of $5.00, 64%");
    await expect(trigger(page)).toHaveText("64%");
    await expect(meter(page)).toHaveAttribute("data-level", "normal");
    await setUsed(page, 4);
    await expect(meter(page)).toHaveAttribute("data-level", "warning");
    await expect(trigger(page)).toHaveAccessibleName("Usage, $4.00 of $5.00, 80%");
    await setUsed(page, 5);
    await expect(meter(page)).toHaveAttribute("data-level", "error");
    await expect(trigger(page)).toHaveAccessibleName("Usage, $5.00 of $5.00, 100%");
    await setUsed(page, 3.99);
    await expect(meter(page)).toHaveAttribute("data-level", "normal");
  });

  test("a press opens the details: the amounts, the period and each slice with its percent", async ({
    page,
  }) => {
    await open(page, "usage-meter", "all");
    await trigger(page).click();
    await expect(details(page)).toBeVisible();
    await expect(details(page)).toHaveAccessibleDescription("$3.20 of $5.00");
    await expect(details(page).locator('[data-meter-part="period"]')).toHaveText("This month");
    await expect(details(page).locator("dt")).toHaveText(["Planner", "Coder", "Reviewer"]);
    await expect(details(page).locator("dd")).toHaveText(["$2.10", "42%", "$0.80", "16%", "$0.30", "6%"]);
    await expect(details(page).locator('[data-meter-part="breakdown"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const shares = await segments(page, "Usage");
    expect(shares.map((share) => Math.round(share * 100) / 100)).toEqual([0.42, 0.16, 0.06]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(0.64, 2);
  });

  test("hover and keyboard focus open the details, as Context Meter's do", async ({ page }) => {
    await open(page, "usage-meter", "all");
    await trigger(page).hover();
    await expect(details(page)).toBeVisible();
    await page.locator("#above").hover();
    await expect(details(page)).toBeHidden();
    await page.keyboard.press("Tab");
    await expect(trigger(page)).toBeFocused();
    await expect(details(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(details(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    expect((await changes(page)).map(({ open, reason }) => [open, reason])).toEqual([
      [true, "trigger-hover"],
      [false, "trigger-hover"],
      [true, "trigger-focus"],
      [false, "escape-key"],
    ]);
  });

  test("counts down to the reset", async ({ page }) => {
    const now = Date.parse(reset.now);
    await page.clock.setFixedTime(now);
    await open(page, "usage-meter", "reset");
    await trigger(page).click();
    const period = details(page).locator('[data-meter-part="period"]');
    await expect(period).toHaveText("This month · Resets in 3 hr");
    await page.clock.setFixedTime(now + 61_000);
    await expect(period).toHaveText("This month · Resets in 2 hr 58 min 59 sec");
  });

  test("counts requests in their own words", async ({ page }) => {
    await open(page, "usage-meter", "requests", "Requests");
    await expect(trigger(page, "Requests")).toHaveAccessibleName("Requests, 120 of 500 requests, 24%");
    await trigger(page, "Requests").click();
    await expect(details(page, "Requests")).toHaveAccessibleDescription("120 of 500 requests");
    await expect(shownBreakdown(page, "Requests")).toHaveCount(0);
  });

  test("an agent opens and closes the details", async ({ page }, testInfo) => {
    test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
    await open(page, "usage-meter", "all");
    await expectAgentActions(page, "Usage", ["open", "press"]);
    expect(await act(page, "open")).toContain('"ok":true');
    await expect(details(page)).toBeVisible();
    await expectAgentActions(page, "Usage", ["close", "press"]);
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
      for (const name of ["all", "warning", "error"]) {
        await open(page, "usage-meter", name);
        await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
        await settled(page);
        expect((await new AxeBuilder({ page }).include("#usage").analyze()).violations).toEqual([]);
        await trigger(page).click();
        await expect(details(page)).toBeVisible();
        await settled(page);
        expect((await new AxeBuilder({ page }).include("#usage").analyze()).violations).toEqual([]);
      }
    });
  }
});

test.describe("Context Meter's breakdown", () => {
  test("lists what fills the window, and its bar adds up to the share used", async ({ page }) => {
    await open(page, "context-meter", "breakdown", "Context");
    await trigger(page, "Context").click();
    const popup = details(page, "Context");
    const rows = popup.locator('[data-meter-part="breakdown-rows"]');
    await expect(rows.locator("dt")).toHaveText(["System", "Tools", "Messages", "Files"]);
    await expect(rows.locator("dd")).toHaveText([
      "8,000",
      "6%",
      "12,000",
      "9%",
      "30,000",
      "23%",
      "7,600",
      "6%",
    ]);
    // The counts still follow, as they did without a breakdown.
    await expect(popup.locator('[data-slot="kind-context-meter-rows"] dt')).toHaveText([
      "Input",
      "Output",
      "Reasoning",
      "Cached",
      "Cost",
    ]);
    const shares = await segments(page, "Context");
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(57_600 / 128_000, 2);
  });

  test("without a breakdown, the details draw none", async ({ page }) => {
    await open(page, "context-meter", "all", "Context");
    await trigger(page, "Context").click();
    await expect(details(page, "Context")).toBeVisible();
    await expect(shownBreakdown(page, "Context")).toHaveCount(0);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`axe reports no violations with the breakdown open in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await open(page, "context-meter", "breakdown", "Context");
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await trigger(page, "Context").click();
      await expect(details(page, "Context")).toBeVisible();
      await settled(page);
      expect((await new AxeBuilder({ page }).include("#context").analyze()).violations).toEqual([]);
    });
  }
});
