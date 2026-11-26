import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: { selects: { date: string; reason: string; source: string }[] };
  kindServerMarkup?: string;
  kindHydrationErrors?: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const load = async (page: Page, name = "all", label = "Activity") => {
  await page.goto(`/?c=activity-graph&case=${name}`);
  await expect(grid(page, label)).toBeVisible();
};
const grid = (page: Page, label = "Activity") => page.getByRole("grid", { name: label });
const day = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });
const focused = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("data-date"));
const selects = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.selects);
const act = (page: Page, action: string, args: unknown[]) =>
  page.evaluate(
    ([action, args]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Activity", action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, args] as const,
  );

test("a grid of weekday rows and week columns, each day named by its count and date", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("group", { name: "Activity" })).toBeVisible();
  await expect(grid(page).getByRole("row")).toHaveCount(7);
  await expect(grid(page).getByRole("rowheader")).toHaveText([
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  await expect(grid(page).getByRole("gridcell")).toHaveCount(53 * 7);
  await expect(day(page, "12 runs on Tuesday, November 3, 2026")).toHaveAttribute("data-level", "4");
  await expect(day(page, "No runs on Wednesday, November 25, 2026")).toHaveAttribute("data-level", "0");
  await expect(page.locator('[data-date="2026-11-26"]')).toHaveAttribute("aria-disabled", "true");
  await expect(grid(page)).toHaveAccessibleDescription(/^[\d,]+ runs in the last year$/);
  await expect(page.locator('[data-slot="kind-activity-graph-months"]')).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator('[data-slot="kind-activity-graph-legend"]')).toHaveText(/^Less\s*More$/);
});

test("one Tab stop, on the latest day, and the arrows move by day and week", async ({ page }) => {
  await load(page);
  await expect(grid(page).locator('[tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press("Tab");
  expect(await focused(page)).toBe("2026-11-25");
  await page.keyboard.press("ArrowUp");
  expect(await focused(page)).toBe("2026-11-24");
  await page.keyboard.press("ArrowLeft");
  expect(await focused(page)).toBe("2026-11-17");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  expect(await focused(page)).toBe("2026-11-25");
  // Thursday to Saturday are still to come, so Down and Right have nowhere to go.
  await page.keyboard.press("ArrowDown");
  expect(await focused(page)).toBe("2026-11-25");
  await page.keyboard.press("ArrowRight");
  expect(await focused(page)).toBe("2026-11-25");
  await expect(grid(page).locator('[tabindex="0"]')).toHaveCount(1);
});

test("Home and End stay within the week, skipping days to come", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("End");
  expect(await focused(page)).toBe("2026-11-25");
  await page.keyboard.press("Home");
  expect(await focused(page)).toBe("2026-11-22");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("End");
  expect(await focused(page)).toBe("2026-11-21");
  await page.keyboard.press("ControlOrMeta+Home");
  expect(await focused(page)).toBe("2025-11-23");
});

test("the arrows follow the text direction", async ({ page }) => {
  await load(page, "rtl");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  expect(await focused(page)).toBe("2026-11-18");
  await page.keyboard.press("ArrowLeft");
  expect(await focused(page)).toBe("2026-11-25");
});

test("Enter and a press select a day", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await day(page, "12 runs on Tuesday, November 3, 2026").click();
  await page.locator('[data-date="2026-11-27"]').click({ force: true });
  expect(await selects(page)).toEqual([
    { date: "2026-11-24", reason: "item-press", source: "keyboard" },
    { date: "2026-11-03", reason: "item-press", source: "mouse" },
  ]);
  expect(await focused(page)).toBe("2026-11-03");
});

test("a week can start on Monday, and the counts read in the host's unit", async ({ page }) => {
  await load(page, "monday", "Tokens");
  await expect(grid(page, "Tokens").getByRole("rowheader").first()).toHaveText("Mon");
  await expect(grid(page, "Tokens").getByRole("gridcell")).toHaveCount(8 * 7);
  await expect(page.locator('[data-date="2026-11-23"]')).toHaveAttribute("tabindex", "-1");
  await expect(grid(page, "Tokens")).toHaveAccessibleDescription(/^[\d,]+ tokens in the last 8 weeks$/);
});

test("an agent selects a day by its date", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Activity", ["select"]);
  expect(await act(page, "select", ["2026-11-03"])).toContain('"ok":true');
  expect(await act(page, "select", ["2026-11-30"])).not.toContain('"ok":true');
  expect(await selects(page)).toEqual([{ date: "2026-11-03", reason: "imperative", source: "agent" }]);
});

test("without onSelect days can't be selected", async ({ page }) => {
  await load(page, "read-only");
  await expectAgentActions(page, "Activity", []);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(grid(page).locator("[data-selectable]")).toHaveCount(0);
});

test("a graph wider than its box starts at the latest week", async ({ page }) => {
  await load(page, "narrow");
  await expect(day(page, "No runs on Wednesday, November 25, 2026")).toBeInViewport();
  await expect(day(page, "12 runs on Tuesday, November 3, 2026")).toBeInViewport();
  await expect(page.locator('[data-date="2025-11-23"]')).not.toBeInViewport();
});

test("server markup ends with the data's last day and hydrates into today", async ({ page }, testInfo) => {
  test.skip(
    layerOf(testInfo) !== "react",
    "React renders server markup here; hydration.spec.ts covers the others",
  );
  await page.clock.install({ time: new Date("2026-11-25T12:00:00Z") });
  await page.goto("/?c=activity-graph&case=hydrate");
  const hydrated = page.locator("#hydrated");
  await expect(hydrated.locator('[data-date="2026-11-25"]')).toHaveCount(1);
  const { kindServerMarkup, kindHydrationErrors } = await page.evaluate(() => {
    const { kindServerMarkup, kindHydrationErrors } = window as unknown as Fixture;
    return { kindServerMarkup, kindHydrationErrors };
  });
  expect(kindServerMarkup).toContain('data-date="2026-11-18"');
  expect(kindServerMarkup).not.toContain('data-date="2026-11-22"');
  expect(kindHydrationErrors).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe passes, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    await page.keyboard.press("Tab");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
