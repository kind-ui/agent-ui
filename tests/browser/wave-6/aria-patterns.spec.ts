import { expect, type Locator, type Page, test } from "@playwright/test";
import { addTestingKit } from "../ui-sdk-testing.js";

// UI SDK's `checkPattern` over Wave 6's WAI-ARIA patterns, on each component's fixture page, and `checkDirection`
// over Thread List, whose Right reaches More. The kit has no grid, window splitter or search pattern, so Thread
// List's grid, Sidebar's handle and Conversation Search's landmark aren't pattern-checked; the handle's mirrored
// arrows are checked on its page below. A problem a check accepts (`known`) names its entry in
// `.agents/experts/core/decisions.md`, unless it names another file.

type Pattern = "dialog" | "alertdialog" | "menu" | "combobox" | "listbox" | "disclosure" | "radio-group";

type Check = {
  name: string;
  page: string;
  pattern: Pattern;
  /** The widget, or its popup's trigger. */
  target: (page: Page) => Locator;
  /** Opens a popup before its check. */
  open?: (page: Page) => Promise<void>;
  viewport?: { width: number; height: number };
  /** Checks right to left too: the pattern's horizontal arrows swap. */
  rtl?: boolean;
  /** Problems an expert's `decisions.md` accepts; every other one fails. */
  known?: RegExp[];
};

type Kit = {
  checkPattern: (root: Element, pattern: Pattern) => Promise<void>;
  checkDirection: (primitive: unknown, options: unknown, markup: string) => Promise<void>;
  [primitive: string]: unknown;
};

const narrow = { width: 390, height: 844 };
const button = (name: string | RegExp) => (page: Page) => page.getByRole("button", { name }).first();
const share = (page: Page) => page.locator("#share").getByRole("button", { name: "Share", exact: true });
const press = (locator: (page: Page) => Locator) => (page: Page) => locator(page).click();
const enter = (locator: (page: Page) => Locator) => async (page: Page) => {
  await locator(page).focus();
  await page.keyboard.press("Enter");
};

const checks: Check[] = [
  {
    name: "thread-list row menu",
    page: "thread-list&case=all",
    pattern: "menu",
    target: (page) => page.getByRole("menu"),
    open: enter(button("More actions for Release checklist")),
    rtl: true,
  },
  {
    name: "thread-search",
    page: "thread-search&case=all",
    pattern: "dialog",
    target: (page) => page.locator('[data-slot="kind-thread-search-trigger"]'),
    open: press((page) => page.locator('[data-slot="kind-thread-search-trigger"]')),
  },
  {
    name: "thread-search list",
    page: "thread-search&case=all",
    pattern: "combobox",
    target: (page) => page.getByRole("combobox").first(),
    open: press((page) => page.locator('[data-slot="kind-thread-search-trigger"]')),
    // Escape closes the whole dialog: see "Thread Search's Escape closes its dialog".
    known: [/Escape should close its popup/, /focus stays here when Escape closes the popup/],
  },
  {
    name: "sidebar trigger",
    page: "sidebar&case=all",
    pattern: "disclosure",
    target: button(/^(Hide|Show) Chats$/),
  },
  {
    name: "sidebar drawer",
    page: "sidebar&case=all",
    pattern: "dialog",
    target: (page) => page.getByRole("dialog", { name: "Chats" }),
    open: press(button(/^(Hide|Show) Chats$/)),
    viewport: narrow,
  },
  {
    name: "share-dialog",
    page: "share-dialog&case=all",
    pattern: "dialog",
    target: (page) => page.getByRole("dialog", { name: "Share chat" }),
    open: press(share),
  },
  {
    name: "share-dialog visibility",
    page: "share-dialog&case=all",
    pattern: "radio-group",
    target: (page) => page.getByRole("radiogroup").first(),
    open: press(share),
    rtl: true,
  },
];

const problemsOf = (target: Locator, pattern: Pattern) =>
  target.evaluate(async (el, pattern) => {
    try {
      await (window as unknown as { kindTesting: Kit }).kindTesting.checkPattern(el, pattern);
      return [];
    } catch (error) {
      const message = (error as Error).message;
      const listed = message.split("\n- ").slice(1);
      return listed.length ? listed : [message];
    }
  }, pattern);

for (const check of checks) {
  test(`${check.name} follows the ${check.pattern} pattern`, async ({ page }) => {
    if (check.viewport) await page.setViewportSize(check.viewport);
    for (const dir of check.rtl ? ["ltr", "rtl"] : ["ltr"]) {
      await page.goto(`/?c=${check.page}`);
      await page.evaluate((dir) => document.documentElement.setAttribute("dir", dir), dir);
      await addTestingKit(page);
      await check.open?.(page);
      await expect(check.target(page)).toBeVisible();
      const problems = await problemsOf(check.target(page), check.pattern);
      expect(
        problems.filter((problem) => !check.known?.some((known) => known.test(problem))),
        dir,
      ).toEqual([]);
    }
  });
}

test("thread-list mirrors its arrows right to left", async ({ page }) => {
  await page.goto("/?c=status&case=all");
  await addTestingKit(page);
  const problems = await page.evaluate(async () => {
    const kit = (window as unknown as { kindTesting: Kit }).kindTesting;
    const ids = ["a", "b"];
    const rows = ids
      .map(
        (id) =>
          `<row value="${id}"><link-cell value="${id}"><link value="${id}">${id}</link></link-cell>` +
          `<more-cell value="${id}"><more value="${id}">More</more></more-cell></row>`,
      )
      .join("");
    try {
      await kit.checkDirection(
        kit.threadListPrimitive,
        {
          threads: ids.map((id) => ({ id, title: id, href: `#${id}`, updatedAt: "2026-11-18T09:00:00Z" })),
          now: "2026-11-18",
          onRename: () => undefined,
        },
        `<root><viewport><grid>${rows}</grid></viewport></root>`,
      );
      return "";
    } catch (error) {
      return (error as Error).message;
    }
  });
  expect(problems).toBe("");
});

test.describe("sidebar handle", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // UI SDK Resizable's arrows move the handle the way they point, so right to left, where the panel sits at the
  // right, Left widens it as Right does left to right.
  test("mirrors its arrows right to left", async ({ page }) => {
    const widened = async (dir: string, key: string) => {
      await page.goto("/?c=sidebar&case=all");
      await page.evaluate((dir) => document.documentElement.setAttribute("dir", dir), dir);
      const handle = page.getByRole("separator", { name: "Resize Chats" });
      await expect(handle).toHaveAttribute("aria-valuenow", "22");
      await handle.focus();
      await page.keyboard.press(key);
      return handle.getAttribute("aria-valuenow");
    };
    expect(await widened("rtl", "ArrowLeft")).toBe(await widened("ltr", "ArrowRight"));
    expect(await widened("rtl", "ArrowRight")).toBe(await widened("ltr", "ArrowLeft"));
  });
});
