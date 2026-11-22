import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { isWebElements, layerOf } from "../layer.js";

type Fixture = { kindServerMarkup?: string; kindHydrationErrors?: string[] };

const separator = (page: Page, id: string) => page.locator(`#${id}`);

const load = async (page: Page, time: string, name = "all") => {
  await page.clock.install({ time: new Date(time) });
  await page.goto(`/?c=day-separator&case=${name}`);
};

test("a recent day reads in words, an older one as its date, under a level 3 heading", async ({ page }) => {
  await load(page, "2026-11-18T12:00:00Z");
  const days = [
    ["today", "Today", "2026-11-18"],
    ["yesterday", "Yesterday", "2026-11-17"],
    ["weekday", "Friday", "2026-11-13"],
    ["older", "October 2, 2026", "2026-10-02"],
  ] as const;
  for (const [id, name, datetime] of days) {
    await expect(separator(page, id)).toHaveAccessibleName(new RegExp(`^${name}$`, "i"));
    await expect(separator(page, id)).toHaveAttribute("role", "heading");
    await expect(separator(page, id)).toHaveAttribute("aria-level", "3");
    await expect(separator(page, id).locator("time")).toHaveAttribute("datetime", datetime);
  }
  await expect(page.getByRole("heading", { name: "Friday", level: 3 })).toHaveAttribute("id", "weekday");
  await expect(page.getByRole("heading", { name: "October 2, 2026", level: 2 })).toHaveAttribute(
    "id",
    "level",
  );
  await expect(separator(page, "absolute")).toHaveText("November 18, 2026");
});

test("without a date the heading is hidden", async ({ page }) => {
  await load(page, "2026-11-18T12:00:00Z");
  await expect(separator(page, "undated")).toBeHidden();
});

test("a label written after the element connects is filled in", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements fill in their parts");
  await load(page, "2026-11-18T12:00:00Z");
  await separator(page, "written").evaluate((el) => {
    el.innerHTML = "<kind-day-separator-label><time>\n  </time></kind-day-separator-label>";
  });
  await expect(separator(page, "written")).toHaveText("today");
});

test("the time zone decides which day a date-time falls on", async ({ page }) => {
  await load(page, "2026-11-18T12:00:00Z");
  await expect(separator(page, "late-tokyo")).toHaveText("today");
  await expect(separator(page, "late-tokyo").locator("time")).toHaveAttribute("datetime", "2026-11-18");
  await expect(separator(page, "late-utc")).toHaveText("yesterday");
  await expect(separator(page, "late-utc").locator("time")).toHaveAttribute("datetime", "2026-11-17");
});

test("a page left open past midnight moves Today to Yesterday", async ({ page }) => {
  await load(page, "2026-11-18T23:59:30Z");
  await expect(separator(page, "today")).toHaveText("today");
  await page.clock.runFor(60_000);
  await expect(separator(page, "today")).toHaveText("yesterday");
});

test("server markup shows the date and hydrates into Today without an error", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "React renders server markup");
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await load(page, "2026-11-18T12:00:00Z", "hydrate");
  await expect(page.locator("#hydrated").getByRole("heading", { name: /^today$/i })).toBeVisible();
  const { kindServerMarkup, kindHydrationErrors } = await page.evaluate(() => {
    const { kindServerMarkup, kindHydrationErrors } = window as unknown as Fixture;
    return { kindServerMarkup, kindHydrationErrors };
  });
  expect(kindServerMarkup).toContain("November 18, 2026");
  expect(kindServerMarkup).not.toMatch(/today/i);
  expect(kindHydrationErrors).toEqual([]);
  expect(errors).toEqual([]);
});

for (const scheme of ["light", "dark"] as const)
  test(`has no axe violations in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page, "2026-11-18T12:00:00Z");
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await expect(separator(page, "today")).toHaveText("today");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
