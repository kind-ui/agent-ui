import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindLog: { values: string[]; expanded: string[] };
  kindHost: { tick(ms: number): void };
  agent: { act(input: unknown): Promise<unknown> };
};

const grid = (page: Page, name = "Agent run") => page.getByRole("treegrid", { name });
const row = (page: Page, name: string | RegExp) => grid(page).getByRole("row", { name });
const rowHeader = (page: Page, name: string | RegExp) => grid(page).getByRole("rowheader", { name });
const details = (page: Page) => page.locator('[data-trace-part="details"]');
const log = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindLog);
const act = (page: Page, action: string, id: string) =>
  page.evaluate(
    ([name, value]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Agent run", action: name, args: [value] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, id],
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=trace&case=${name}`);
  await expect(rowHeader(page, /^web_search/)).toBeVisible();
};

test("each row reads its span's name, status, duration and bar", async ({ page }) => {
  await open(page);
  await expect(rowHeader(page, /^web_search/)).toHaveAccessibleName("web_search Complete");
  await expect(rowHeader(page, /^read_url/)).toHaveAccessibleName("read_url Failed");
  const search = row(page, /^web_search/);
  await expect(search.locator('[data-trace-part="duration"]')).toHaveText("340 ms");
  await expect(search.getByRole("gridcell", { name: /^Starts at/ })).toHaveAccessibleName(
    "Starts at 120 ms, takes 340 ms",
  );
  await expect(search.locator('[data-trace-part="name"]')).toHaveAttribute("data-kind", "tool");
  await expect(grid(page)).toHaveAttribute("aria-rowcount", "8");
  await expect(row(page, /^Summarize sources/)).toHaveCount(0);
});

test("the keyboard expands, collapses, selects, and Escape in the details returns to the row", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(row(page, /^Answer the question/)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(row(page, /^Answer the question/)).toHaveAttribute("aria-expanded", "false");
  await expect(row(page, /^web_search/)).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(row(page, /^web_search/)).toBeVisible();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown");
  await expect(row(page, /^Researcher/)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(row(page, /^Summarize sources/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(row(page, /^Researcher/)).toHaveAttribute("aria-selected", "true");
  await expect(details(page)).toBeVisible();
  await expect(details(page)).toHaveAccessibleName("Researcher details");
  await expect(details(page).locator("dl")).toContainText("Duration2.28 sec");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(row(page, /^Researcher/)).toBeFocused();
  await expect(details(page)).toBeVisible();
  expect((await log(page)).values).toEqual(["researcher item-press"]);
  expect((await log(page)).expanded).toEqual([
    " list-navigation",
    "run list-navigation",
    "run,researcher list-navigation",
  ]);
});

test("a press selects a row, its details list the attributes, and Close returns focus", async ({ page }) => {
  await open(page);
  await rowHeader(page, /^web_search/).click();
  await expect(details(page)).toBeVisible();
  await expect(details(page).locator("dt")).toHaveText([
    "Kind",
    "Status",
    "Start",
    "Duration",
    "query",
    "results",
  ]);
  await expect(details(page).locator("dd")).toHaveText([
    "Tool",
    "Complete",
    "120 ms",
    "340 ms",
    "waterfall charts",
    "8",
  ]);
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(details(page)).toBeHidden();
  await expect(row(page, /^web_search/)).toBeFocused();
  expect((await log(page)).values).toEqual(["search item-press", "null close-press"]);
});

test("a refused selection keeps the details closed", async ({ page }) => {
  await open(page, "refused");
  await rowHeader(page, /^web_search/).click();
  await expect(row(page, /^web_search/)).not.toHaveAttribute("aria-selected", "true");
  await expect(details(page)).toBeHidden();
});

test("a running span grows to now", async ({ page }) => {
  await open(page, "running");
  const answer = row(page, /^Write the answer/);
  await expect(answer.locator('[data-trace-part="duration"]')).toHaveText("380 ms");
  await expect(answer.getByRole("gridcell", { name: /^Starts at/ })).toHaveAccessibleName(
    "Starts at 3.62 sec, running for 380 ms",
  );
  await expect(rowHeader(page, /^Write the answer/)).toHaveAccessibleName("Write the answer Running");
  await page.evaluate(() => (window as unknown as Fixture).kindHost.tick(4500));
  await expect(answer.locator('[data-trace-part="duration"]')).toHaveText("880 ms");
});

test("agents select, expand and collapse by id, and an unknown id changes nothing", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Agent run", ["select", "expand", "collapse"]);
  await act(page, "expand", "researcher");
  await expect(row(page, /^Summarize sources/)).toBeVisible();
  await act(page, "select", "fetch");
  await expect(details(page)).toHaveAccessibleName("fetch_page details");
  await act(page, "collapse", "run");
  await expect(row(page, /^web_search/)).toHaveCount(0);
  expect(await act(page, "select", "nope")).not.toContain('"ok":true');
  await expect(details(page)).toHaveAccessibleName("fetch_page details");
});

test("with 5,000 spans only the rows in view render, and End reaches the last row", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 700 });
  await page.goto("/?c=trace&case=many-5000");
  const trace = grid(page, "Trace");
  await expect(trace.getByRole("row", { name: /^job 1 / })).toBeVisible();
  expect(await trace.locator('[data-slot="waterfall-row"]').count()).toBeLessThan(40);
  await page.keyboard.press("Tab");
  await page.keyboard.press("End");
  await expect(trace.getByRole("row", { name: /^step 4 / }).last()).toBeFocused();
  await expect(page.locator(":focus")).toHaveAttribute("aria-rowindex", "5001");
  await page.keyboard.press("Home");
  await expect(trace.getByRole("row", { name: /^job 1 / })).toBeFocused();
});

for (const colorScheme of ["light", "dark"] as const)
  test(`axe passes with a span selected, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await rowHeader(page, /^web_search/).click();
    await expect(details(page)).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
