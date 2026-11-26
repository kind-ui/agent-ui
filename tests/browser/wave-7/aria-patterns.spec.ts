import { expect, type Locator, type Page, test } from "@playwright/test";
import { addTestingKit } from "../ui-sdk-testing.js";

// UI SDK's `checkPattern` over the WAI-ARIA patterns Wave 7a adds, on each component's fixture page. The kit has no
// table pattern, so Diff's table is checked by its own spec (`diff.spec.ts`: row and cell roles, `aria-rowcount`,
// Show N lines by keyboard), and `checkServer` covers Diff, Step Group and Handoff in `ui-sdk-testing.test.mjs`.

type Pattern = "menu" | "disclosure";

type Check = {
  name: string;
  page: string;
  pattern: Pattern;
  target: (page: Page) => Locator;
  /** Brings the widget up before its check. */
  open?: (page: Page) => Promise<void>;
};

type Kit = { checkPattern: (root: Element, pattern: Pattern) => Promise<void> };

const steerMenu = (page: Page) => page.getByRole("button", { name: "More send options" });

const checks: Check[] = [
  {
    name: "composer steer menu",
    page: "composer-steer&case=steer",
    pattern: "menu",
    target: (page) => page.getByRole("menu"),
    open: async (page) => {
      await page.getByRole("textbox", { name: "Prompt" }).click();
      await page.keyboard.type("check the logs");
      await steerMenu(page).focus();
      await page.keyboard.press("Enter");
    },
  },
  {
    name: "step-group",
    page: "step-group&case=all",
    pattern: "disclosure",
    target: (page) => page.locator("#agents").getByRole("button", { name: /^3 agents/ }),
  },
];

for (const check of checks) {
  test(`${check.name} follows the ${check.pattern} pattern`, async ({ page }) => {
    await page.goto(`/?c=${check.page}`);
    await addTestingKit(page);
    await check.open?.(page);
    await expect(check.target(page)).toBeVisible();
    const problems = await check.target(page).evaluate(async (el, pattern) => {
      try {
        await (window as unknown as { kindTesting: Kit }).kindTesting.checkPattern(el, pattern);
        return [];
      } catch (error) {
        const message = (error as Error).message;
        const listed = message.split("\n- ").slice(1);
        return listed.length ? listed : [message];
      }
    }, check.pattern);
    expect(problems).toEqual([]);
  });
}
