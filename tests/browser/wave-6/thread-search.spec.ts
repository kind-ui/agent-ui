import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Call = { name: string; value: string; reason: string; source?: string };
type Fixture = {
  kindHost: { calls: Call[]; setStatus?: (status: string) => void };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.locator('#search [data-slot="kind-thread-search-trigger"]');
const dialog = (page: Page) => page.getByRole("dialog", { name: "Search chats" });
const search = (page: Page) => page.getByRole("combobox", { name: "Search chats" });
const options = (page: Page) => dialog(page).getByRole("option");
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.calls);
const act = (page: Page, action: string, args: unknown[] = []) =>
  page.evaluate(
    ({ action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Search chats", action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { action, args },
  );
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=thread-search&case=${name}`);
  await expect(trigger(page)).toHaveAccessibleName("Search chats");
};
const open = async (page: Page) => {
  await trigger(page).click();
  await expect(search(page)).toBeFocused();
};

test("the trigger opens a modal dialog of the newest threads, grouped, with New chat after them", async ({
  page,
}) => {
  await load(page);
  await open(page);
  await expect(dialog(page)).toBeVisible();
  const groups = dialog(page).locator('[data-slot="command-group-label"]');
  await expect(groups).toHaveText([
    "Pinned",
    "Team",
    "today",
    "yesterday",
    "Previous 7 days",
    "October",
    "2025",
  ]);
  // 20 newest threads, then New chat.
  await expect(options(page)).toHaveCount(21);
  await expect(options(page).last()).toHaveText("New chat");
  // An option's children are presentational, so its status mark's words are part of its name.
  await expect(options(page).filter({ hasText: "Fix the login redirect" })).toHaveAccessibleName(
    "Fix the login redirect Running",
  );
});

test("typing searches every thread and marks the title and snippet", async ({ page }) => {
  await load(page);
  await open(page);
  await search(page).fill("lentil");
  await expect(options(page).filter({ hasNotText: "New chat" })).toHaveText([
    /Weeknight recipes/,
    /Archived lentil soup/,
  ]);
  await expect(dialog(page).locator("[data-picker-description] mark")).toHaveText(["lentil"]);
  expect((await calls(page)).filter((call) => call.name === "query").at(-1)).toMatchObject({
    value: "lentil",
  });
});

test("Enter calls onSelect and closes, returning focus to the trigger; Escape clears, then closes", async ({
  page,
}) => {
  await load(page);
  await open(page);
  await search(page).fill("pricing");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await calls(page)).toContainEqual(
    expect.objectContaining({ name: "select", value: "pricing", reason: "item-press" }),
  );

  await open(page);
  await search(page).fill("plan");
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveValue("");
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("a canceled onSelect keeps the dialog open", async ({ page }) => {
  await load(page, "refusing");
  await open(page);
  await search(page).fill("pricing");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
});

test("New chat filters like any row, and gets the search text", async ({ page }) => {
  await load(page);
  await open(page);
  await search(page).fill("zzzz");
  await expect(dialog(page).getByText("No chats found")).toBeVisible();
  await search(page).fill("new ch");
  await expect(options(page)).toHaveText(["New chat"]);
  await page.keyboard.press("Enter");
  expect(await calls(page)).toContainEqual(expect.objectContaining({ name: "new", value: "new ch" }));
  await expect(dialog(page)).toBeHidden();
});

test("the shortcut opens it and the trigger shows its keys", async ({ page }) => {
  await load(page);
  await expect(page.locator('[data-thread-search-part="shortcut"]')).toHaveText(/(⌘|Ctrl\+)K/);
  await expect(trigger(page)).toHaveAttribute("aria-keyshortcuts", /^(Meta|Control)\+K$/);
  await page.locator("#above").click();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(search(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
});

test("with filter false the host's rows keep its order, ungrouped, and loading sets aria-busy", async ({
  page,
}) => {
  await page.goto("/?c=thread-search&case=server");
  await open(page);
  await expect(options(page)).toHaveText([/Export invoices/, /Plan the launch/, /Pricing page/]);
  await expect(dialog(page).locator('[data-slot="command-group-label"]')).toHaveCount(0);
  await expect(dialog(page).getByRole("listbox")).toHaveAttribute("aria-busy", "true");
  await expect(dialog(page).locator('[data-slot="command-status"]')).toHaveText("Searching");
  await search(page).fill("zz");
  // The host's results stay: nothing filters them.
  await expect(options(page)).toHaveCount(3);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.setStatus?.("error"));
  await expect(dialog(page).locator('[data-slot="command-status"]')).toHaveText("Search failed");
});

test("agents open, search, select and start a new chat", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Search chats", ["open", "search", "select", "newThread", "press"]);
  expect(await act(page, "select", ["pricing"])).not.toMatch(/error|refused/i);
  expect(await act(page, "select", ["nope"])).toMatch(/.+/);
  expect(await calls(page)).toContainEqual(
    expect.objectContaining({ name: "select", value: "pricing", reason: "imperative", source: "agent" }),
  );
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the dialog is a sheet", async ({ page }) => {
    await load(page);
    await trigger(page).tap();
    await expect(page.locator('[data-slot="kind-thread-search-content"]')).toHaveAttribute(
      "data-presentation",
      "sheet",
    );
  });
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the dialog open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await open(page);
    await search(page).fill("pri");
    await expect(dialog(page).locator("mark").first()).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
