import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Deferred = { id: string; source: string; resolve(): void; reject(): void };
type Fixture = {
  kindHost: { archives: Deferred[] };
  kindThreadList: { setThreads(update: (threads: { id: string; archived?: boolean }[]) => unknown[]): void };
  agent: { act(input: unknown): Promise<unknown> };
};

const load = async (page: Page, name = "inbox") => {
  await page.goto(`/?c=thread-list&case=${name}`);
  await expect(page.getByRole("grid", { name: "Chats" })).toBeVisible();
};
const link = (page: Page, name: string | RegExp) => page.getByRole("link", { name });
const row = (page: Page, title: string) =>
  page.locator('[data-slot="kind-thread-list-row"]').filter({ hasText: title });
const archives = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.archives.map(({ id, source }) => ({ id, source })),
  );
const act = (page: Page, action: string, args: unknown[]) =>
  page.evaluate(
    ([action, args]) => (window as unknown as Fixture).agent.act({ steps: [{ ref: "Chats", action, args }] }),
    [action, args] as const,
  );

test("groups by what needs the person, each heading with its count", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("rowheader")).toHaveText(["Needs you 3", "Running 3", "Done 13"]);
  await expect(page.locator("[data-thread-list-title]")).toHaveText([
    "Migrate auth to sessions",
    "Fix flaky checkout test",
    "Upgrade to React 20",
    "Write release notes",
    "Add dark mode to settings",
    "Bump dependencies",
    "Refactor the router",
  ]);
  await expect(page.locator('[data-slot="kind-thread-list-time"]')).toHaveText([
    "12 min",
    "8 min",
    "2 min",
    "4 min",
    "11 min",
    "",
    "1 hr",
  ]);
});

test("one mark per row, and the second line joins the name: approval and question read apart", async ({
  page,
}) => {
  await load(page);
  await expect(
    link(page, "Migrate auth to sessions Approval · Run rm -rf dist?"),
  ).toHaveAccessibleDescription("12 min");
  await expect(link(page, "Fix flaky checkout test Question · Which payment provider?")).toBeVisible();
  await expect(link(page, "Upgrade to React 20 Failed · 3 tests failing")).toBeVisible();
  await expect(link(page, "Write release notes Running Reading CHANGELOG.md")).toBeVisible();
  await expect(link(page, "Bump dependencies Queued")).toBeVisible();
  await expect(link(page, "Refactor the router Done +120 −8 in 4 files · PR #412")).toBeVisible();
  for (const each of await page.locator('[data-slot="kind-thread-list-row"]').all())
    await expect(
      each.locator("[data-status-mark], [data-slot='kind-thread-list-unread']:visible"),
    ).toHaveCount(1);
  await expect(row(page, "Migrate auth").locator("code")).toHaveText("rm -rf dist");
});

test("Done folds behind a disclosure that pages, then folds again", async ({ page }) => {
  await load(page);
  const fold = page.getByRole("button", { name: "12 more done" });
  await expect(fold).toHaveAttribute("aria-expanded", "false");
  await link(page, /^Refactor the router/).focus();
  await page.keyboard.press("ArrowDown");
  await expect(fold).toBeFocused();
  await page.keyboard.press("Enter");
  const next = page.getByRole("button", { name: "2 more done" });
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute("aria-expanded", "true");
  const grid = page.getByRole("grid", { name: "Chats" });
  await expect(grid).toHaveAttribute("aria-rowcount", "21");
  await next.click();
  await expect(page.getByRole("button", { name: "Show less" })).toBeVisible();
  await page.getByRole("button", { name: "Show less" }).click();
  await expect(page.getByRole("button", { name: "12 more done" })).toBeVisible();
  await expect(grid).toHaveAttribute("aria-rowcount", "11");
});

test("with nothing waiting and nothing running, the list says so above Done", async ({ page }) => {
  await load(page, "nothing-waiting");
  await expect(page.getByText("Nothing is waiting on you.")).toBeVisible();
  await expect(page.getByRole("rowheader")).toHaveText(["Done 14"]);
  await expect(page.locator("[data-status-mark]")).toHaveCount(0);
});

test("Archive moves the row out at once; a rejection brings it back and says so", async ({ page }) => {
  await load(page);
  await page.getByRole("button", { name: "More actions for Write release notes" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(link(page, /^Write release notes/)).toHaveCount(0);
  await expect(page.getByRole("rowheader")).toHaveText(["Needs you 3", "Running 2", "Done 13"]);
  expect(await archives(page)).toEqual([{ id: "r4", source: "mouse" }]);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.archives[0]?.reject());
  await expect(link(page, /^Write release notes/)).toBeVisible();
  await expect(page.locator("[data-ui-sdk-announcer]")).toContainText("Write release notes was restored");
});

test("an archive the host takes stays out once the thread is archived", async ({ page }) => {
  await load(page);
  await page.getByRole("button", { name: "More actions for Bump dependencies" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await page.evaluate(() => {
    const { kindHost, kindThreadList } = window as unknown as Fixture;
    kindThreadList.setThreads((threads) =>
      threads.map((thread) => (thread.id === "r6" ? { ...thread, archived: true } : thread)),
    );
    kindHost.archives[0]?.resolve();
  });
  await expect(page.getByRole("rowheader")).toHaveText(["Needs you 3", "Running 2", "Done 13"]);
  await expect(link(page, /^Bump dependencies/)).toHaveCount(0);
});

test("the archived view lists archived threads; Unarchive takes the time's place on hover", async ({
  page,
}) => {
  await load(page, "archived");
  await expect(page.getByRole("rowheader")).toHaveText(["Archived"]);
  await expect(page.locator("[data-thread-list-title]")).toHaveText([
    "Refactor the router",
    "Spike: edge runtime",
  ]);
  const first = row(page, "Refactor the router");
  await first.hover();
  await expect(first.locator('[data-slot="kind-thread-list-time"]')).toHaveCSS("opacity", "0");
  const unarchive = page.getByRole("button", { name: "Unarchive Refactor the router" });
  await expect(unarchive).toBeVisible();
  await link(page, /^Spike: edge runtime/).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Unarchive Spike: edge runtime" })).toBeFocused();
  await unarchive.click();
  await expect(link(page, /^Refactor the router/)).toHaveCount(0);
  expect(await archives(page)).toEqual([{ id: "r7", source: "mouse" }]);
});

test("agents archive, page Done and refuse unknown ids", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page);
  await expectAgentActions(page, "Chats", [
    "select",
    "newThread",
    "rename",
    "pin",
    "share",
    "archive",
    "showMoreDone",
    "delete",
  ]);
  await act(page, "showMoreDone", []);
  await expect(page.getByRole("grid", { name: "Chats" })).toHaveAttribute("aria-rowcount", "21");
  await act(page, "archive", ["r5"]);
  expect(await archives(page)).toEqual([{ id: "r5", source: "agent" }]);
  expect(JSON.stringify(await act(page, "archive", ["nope"]))).toContain("error");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a long second line wraps once, then truncates, and the row grows to hold it", async ({ page }) => {
    await load(page);
    await page.evaluate(() =>
      (window as unknown as Fixture).kindThreadList.setThreads((threads) =>
        threads.map((thread) =>
          thread.id === "r4"
            ? { ...thread, summary: "Reading every changelog entry since 2019 ".repeat(6) }
            : thread,
        ),
      ),
    );
    const summary = row(page, "Write release notes").locator('[data-slot="kind-thread-list-summary"]');
    await expect
      .poll(async () =>
        summary.evaluate((el) =>
          Math.round(el.clientHeight / Number.parseFloat(getComputedStyle(el).lineHeight)),
        ),
      )
      .toBe(2);
    const [top, next] = await Promise.all([
      row(page, "Write release notes").boundingBox(),
      row(page, "Add dark mode").boundingBox(),
    ]);
    expect(next?.y).toBeGreaterThanOrEqual((top?.y ?? 0) + (top?.height ?? 0) - 1);
  });
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes on the inbox, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
  });
