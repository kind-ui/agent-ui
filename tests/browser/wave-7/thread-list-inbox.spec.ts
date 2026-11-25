import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Call = { name: string; id?: string; read?: boolean; reason?: string; source?: string };
type Deferred = { id: string; source: string; resolve(): void; reject(): void };
type Fixture = {
  kindHost: { calls: Call[]; archives: Deferred[] };
  kindThreadList: { setThreads(update: (threads: { id: string }[]) => unknown[]): void };
  agent: { act(input: unknown): Promise<unknown> };
};

const load = async (page: Page) => {
  await page.goto("/?c=thread-list&case=inbox");
  await expect(page.getByRole("grid", { name: "Chats" })).toBeVisible();
};
const link = (page: Page, name: string) => page.getByRole("link", { name, exact: true });
const more = (page: Page, title: string) => page.getByRole("button", { name: `More actions for ${title}` });
const item = (page: Page, name: string) => page.getByRole("menuitem", { name });
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const act = (page: Page, action: string, args: unknown[]) =>
  page.evaluate(
    ([action, args]) => (window as unknown as Fixture).agent.act({ steps: [{ ref: "Chats", action, args }] }),
    [action, args] as const,
  );
// The running status mark spins for ever, and a sheet's drag runs on a scroll timeline, so neither counts.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document
        .getAnimations()
        .every(
          (animation) =>
            !(animation.timeline instanceof DocumentTimeline) ||
            animation.effect?.getTiming().iterations === Number.POSITIVE_INFINITY ||
            animation.playState !== "running",
        ),
  );

test("groupBy status reads Pinned, Needs you, Running and Done, newest done first", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("rowheader")).toHaveText(["Pinned", "Needs you", "Running", "Done"]);
  await expect(page.locator("[data-thread-list-title]")).toHaveText([
    "Weekly report",
    "Migrate the billing tables",
    "Fix the flaky checkout test",
    "Write the changelog",
    "Refactor the auth module",
    "Update dependencies",
    "Translate the docs",
    "Audit the logging",
  ]);
  await expect(link(page, "Update dependencies Queued")).toBeVisible();
  await expect(link(page, "Translate the docs Done")).toBeVisible();
  await expect(link(page, "Write the changelog Done Unread")).toBeVisible();
});

test("a running row reads its summary and progress, and every thread's row is tall", async ({ page }) => {
  await load(page);
  await expect(link(page, "Refactor the auth module Running")).toHaveAccessibleDescription(
    "+120 −8 in 4 files 45% done",
  );
  await expect(link(page, "Migrate the billing tables Needs input")).toHaveAccessibleDescription(
    "Waiting to run 3 migrations",
  );
  await expect(link(page, "Update dependencies Queued")).not.toHaveAttribute("aria-describedby", /.+/);
  const bar = page.locator('[data-slot="kind-thread-list-progress"]:visible');
  await expect(bar).toHaveCount(1);
  await expect(bar).toHaveAttribute("aria-hidden", "true");
  await expect(bar.getByRole("progressbar", { includeHidden: true })).toHaveAttribute("aria-valuenow", "45");
  const heights = await page
    .locator('[data-slot="kind-thread-list-row"], [data-slot="kind-thread-list-heading"]')
    .evaluateAll((rows) =>
      rows.map((row) => [row.getAttribute("data-slot"), row.getBoundingClientRect().height] as const),
    );
  for (const [slot, height] of heights)
    expect(height, String(slot)).toBe(slot === "kind-thread-list-row" ? 52 : 36);
});

test("Archive calls onArchive, and focus moves to the next row once the host removes it", async ({ page }) => {
  await load(page);
  await more(page, "Migrate the billing tables").click();
  await item(page, "Archive").click();
  await expect
    .poll(async () => (await host(page)).archives.map(({ id, source }) => [id, source]))
    .toEqual([["r3", "mouse"]]);
  await expect(more(page, "Migrate the billing tables")).toBeFocused();
  await page.evaluate(() => {
    const { kindHost, kindThreadList } = window as unknown as Fixture;
    kindThreadList.setThreads((threads) => threads.filter((thread) => thread.id !== "r3"));
    kindHost.archives[0]?.resolve();
  });
  await expect(more(page, "Fix the flaky checkout test")).toBeFocused();
});

test("Mark as read and Mark as unread follow the thread's unread mark", async ({ page }) => {
  await load(page);
  await more(page, "Write the changelog").click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Rename",
    "Pin",
    "Mark as read",
    "Share",
    "Archive",
    "Delete",
  ]);
  await item(page, "Mark as read").click();
  await more(page, "Translate the docs").click();
  await item(page, "Mark as unread").click();
  expect((await host(page)).calls).toEqual([
    { name: "read", id: "r4", read: true, reason: "item-press", source: "mouse" },
    { name: "read", id: "r8", read: false, reason: "item-press", source: "mouse" },
  ]);
});

test("agents archive and mark read, and an archive locks until it settles", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page);
  const all = ["select", "newThread", "rename", "pin", "markRead", "share", "archive", "delete"];
  await expectAgentActions(page, "Chats", all);
  await act(page, "markRead", ["r4"]);
  await act(page, "markRead", ["r8", false]);
  await act(page, "archive", ["r6"]);
  expect((await host(page)).calls).toEqual([
    { name: "read", id: "r4", read: true, reason: "imperative", source: "agent" },
    { name: "read", id: "r8", read: false, reason: "imperative", source: "agent" },
  ]);
  expect((await host(page)).archives.map(({ id, source }) => [id, source])).toEqual([["r6", "agent"]]);
  await expectAgentActions(
    page,
    "Chats",
    all.filter((action) => action !== "archive"),
  );
  await page.evaluate(() => (window as unknown as Fixture).kindHost.archives[0]?.reject());
  await expectAgentActions(page, "Chats", all);
  expect(JSON.stringify(await act(page, "archive", ["nope"]))).toContain("error");
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the menu open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
    await more(page, "Refactor the auth module").click();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
  });
