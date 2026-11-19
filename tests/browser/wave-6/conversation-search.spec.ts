import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { queries: [string, string][]; opens: [boolean, string][] };
  kindAnnounced: string[];
};

const bar = (page: Page) => page.getByRole("search", { name: "Search in conversation" });
const field = (page: Page) => bar(page).getByRole("searchbox");
const count = (page: Page) => page.locator('[data-slot="kind-conversation-search-count"]');
const viewport = (page: Page) => page.locator('[data-slot="kind-conversation-viewport"]');
const marks = (page: Page) => page.locator('[data-slot="kind-conversation-mark"]');
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

/** The text of each range a highlight holds, or `null` without the API. */
const painted = (page: Page, name: string) =>
  page.evaluate((key) => {
    if (!("highlights" in CSS)) return null;
    return [...(CSS.highlights.get(key) ?? [])].map((range) => (range as Range).toString());
  }, name);

/** Whether the current match's range sits inside the viewport. */
const currentInView = (page: Page) =>
  page.evaluate(() => {
    const [range] = [...(CSS.highlights.get("kind-search-current") ?? [])] as Range[];
    const view = document.querySelector('[data-slot="kind-conversation-viewport"]')?.getBoundingClientRect();
    if (!range || !view) return false;
    const box = range.getBoundingClientRect();
    return box.height > 0 && box.top >= view.top && box.bottom <= view.bottom;
  });

test.beforeEach(({ page }) =>
  page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.closest("[data-ui-sdk-announcer]") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  }),
);

const open = async (page: Page, name = "basic") => {
  await page.goto(`/?c=conversation-search&case=${name}`);
  await expect(bar(page)).toBeVisible();
  await expect(page.locator('[data-slot="kind-conversation-row"]').first()).toBeVisible();
};

test("typing counts every match, paints them, marks their messages and announces the count once", async ({
  page,
}) => {
  await open(page);
  await field(page).fill("rollout");
  // Two of every six lines hold "rollout": 17 matches in 50 messages.
  await expect(count(page)).toHaveText("17 of 17");
  await expect(field(page)).toHaveAccessibleDescription("17 of 17");
  await expect.poll(() => painted(page, "kind-search").then((ranges) => ranges?.length)).toBe(17);
  expect(await painted(page, "kind-search-current")).toEqual(["rollout"]);
  await expect(marks(page)).not.toHaveCount(0);
  await expect.poll(() => announced(page)).toEqual(["17 of 17"]);
  await field(page).fill("résumé");
  await expect(count(page)).toHaveText("8 of 8");
  await field(page).fill("nothing like it");
  await expect(count(page)).toHaveText("0 of 0");
  await expect(count(page)).toHaveAttribute("data-none", "");
  await expect(marks(page)).toHaveCount(0);
  await expect.poll(() => painted(page, "kind-search").then((ranges) => ranges?.length)).toBe(0);
});

test("Enter, Shift+Enter, F3 and the buttons move between matches and scroll each into view", async ({
  page,
}) => {
  await open(page);
  await field(page).fill("rollout");
  await expect(count(page)).toHaveText("17 of 17");
  await field(page).press("Enter");
  await expect(count(page)).toHaveText("1 of 17");
  await expect.poll(() => currentInView(page)).toBe(true);
  await field(page).press("Shift+Enter");
  await expect(count(page)).toHaveText("17 of 17");
  await field(page).press("F3");
  await expect(count(page)).toHaveText("1 of 17");
  await bar(page).getByRole("button", { name: "Next match" }).click();
  await expect(count(page)).toHaveText("2 of 17");
  await expect.poll(() => currentInView(page)).toBe(true);
  await bar(page).getByRole("button", { name: "Previous match" }).click();
  await expect(count(page)).toHaveText("1 of 17");
});

test("the shortcut opens the bar on its field; Escape clears, then closes, and focus returns", async ({
  page,
}) => {
  await open(page);
  await field(page).press("Escape");
  await expect(bar(page)).toBeHidden();
  await page.locator("#before").focus();
  await page.keyboard.press("ControlOrMeta+f");
  await expect(field(page)).toBeFocused();
  await page.keyboard.type("rollout");
  await expect(count(page)).toHaveText("17 of 17");
  await page.keyboard.press("Escape");
  await expect(field(page)).toHaveValue("");
  await expect(count(page)).toHaveText("");
  await expect(bar(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bar(page)).toBeHidden();
  await expect(page.locator("#before")).toBeFocused();
  expect((await host(page)).queries.at(-1)).toEqual(["", "escape-key"]);
  expect((await host(page)).opens).toEqual([
    [false, "escape-key"],
    [true, "shortcut"],
    [false, "escape-key"],
  ]);
});

test("Next to a message that isn't rendered scrolls it in and paints it, among 5,000", async ({ page }) => {
  await open(page, "many-5000");
  await field(page).fill("résumé");
  await expect(count(page)).toHaveText("833 of 833");
  await field(page).press("Enter");
  await expect(count(page)).toHaveText("1 of 833");
  // The first match is in message 2, far above the rows in view at the end.
  await expect(page.locator('[data-message="m2"]')).toBeVisible();
  await expect.poll(() => currentInView(page)).toBe(true);
  expect(await painted(page, "kind-search-current")).toEqual(["Résumé"]);
  const { height, count: shown } = await page.evaluate(() => ({
    height: (document.querySelector('[data-slot="kind-conversation-marks"]') as HTMLElement).clientHeight,
    count: document.querySelectorAll('[data-slot="kind-conversation-mark"]').length,
  }));
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThanOrEqual(Math.floor(height / 4));
});

test("without the Highlight API it still counts, moves and marks", async ({ page }) => {
  await page.addInitScript(() => {
    delete (CSS as { highlights?: unknown }).highlights;
  });
  await open(page);
  await field(page).fill("rollout");
  await expect(count(page)).toHaveText("17 of 17");
  await field(page).press("Enter");
  await expect(count(page)).toHaveText("1 of 17");
  await expect(marks(page)).not.toHaveCount(0);
});

test("a search the owner doesn't take is written back into the field", async ({ page }) => {
  await open(page, "refused");
  await field(page).fill("rollout");
  await expect(field(page)).toHaveValue("");
  await expect(count(page)).toHaveText("");
  expect((await host(page)).queries).toEqual([["rollout", "input-change"]]);
});

test("a bar that mounts with a search counts, paints and marks it", async ({ page }) => {
  await open(page, "preset");
  await expect(count(page)).toHaveText("17 of 17");
  await expect.poll(() => painted(page, "kind-search").then((ranges) => ranges?.length)).toBe(17);
  await expect(marks(page)).not.toHaveCount(0);
});

test("every match in a Markdown message lines up with the text it renders", async ({ page }) => {
  await open(page, "markdown");
  await field(page).fill("rollout");
  // The first message's, then bold, link text, inline code, a list item, a table cell twice and the code block's
  // code; not the link's URL or the image's alt.
  // A new search starts at the newest message's first match.
  await expect(count(page)).toHaveText("2 of 8");
  await expect.poll(() => painted(page, "kind-search")).toEqual(Array(8).fill("rollout"));
});

// The bridge adds its generic `press` for the bar's buttons.
test("an agent sees search and close, then next and previous once there are matches", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Search in conversation", ["search", "close", "press"]);
  await field(page).fill("rollout");
  await expectAgentActions(page, "Search in conversation", ["search", "next", "previous", "close", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with matches in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await field(page).fill("rollout");
    await expect(count(page)).toHaveText("17 of 17");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("the viewport keeps its focus ring path: the bar is not inside the log", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("log").getByRole("search")).toHaveCount(0);
  await expect(viewport(page)).toBeVisible();
});
