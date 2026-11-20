import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Call = { name: string; id?: string; pinned?: boolean; reason?: string; source?: string };
type Deferred = { id: string; title?: string; source: string; resolve(): void; reject(): void };
type Fixture = {
  kindHost: { calls: Call[]; renames: Deferred[]; deletes: Deferred[]; route: boolean; permit: boolean };
  kindThreadList: {
    setThreads(update: (threads: { id: string }[]) => unknown[]): void;
    setStatus(status: string): void;
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=thread-list&case=${name}`);
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

test("groups read Pinned, the host's group, then dates, each under a row header", async ({ page }) => {
  await load(page);
  // Relative names are lower case where `Intl` writes them so, and CSS capitalizes them.
  await expect(page.getByRole("rowheader")).toHaveText([
    "Pinned",
    "Atlas",
    "today",
    "yesterday",
    "Previous 7 days",
  ]);
  await expect(page.getByRole("link")).toHaveText([
    "Release checklist",
    "Atlas roadmap",
    "Fix the login redirect",
    "Draft the launch post",
    "Why the build is slow",
    "Plan the offsite",
  ]);
  await expect(link(page, "Fix the login redirect Running")).toHaveAttribute("aria-current", "page");
  await expect(link(page, "Draft the launch post Unread")).toBeVisible();
});

test("each row ends in how long ago it changed, hidden from assistive technology, which More covers on hover", async ({
  page,
}) => {
  await load(page);
  const times = page.locator('[data-slot="kind-thread-list-time"]');
  await expect(times).toHaveText(["Nov 10", "5h", "1h", "4h", "20h", "4d"]);
  await expect(times.first()).toHaveAttribute("aria-hidden", "true");
  const row = page.locator('[data-slot="kind-thread-list-row"]').filter({ has: link(page, "Atlas roadmap") });
  await row.hover();
  await expect(row.locator('[data-slot="kind-thread-list-time"]')).toHaveCSS("opacity", "0");
  await expect(row.locator('[data-slot="kind-thread-list-more-cell"]')).toHaveCSS("opacity", "1");
});

test("one Tab stop: arrows skip headings, Right reaches More, the context menu key opens the same menu", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "New chat" }).focus();
  await page.keyboard.press("Tab");
  await expect(link(page, "Release checklist")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(link(page, "Atlas roadmap")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(more(page, "Atlas roadmap")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(more(page, "Fix the login redirect")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(more(page, "Fix the login redirect")).not.toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(more(page, "Fix the login redirect")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  // What Shift+F10 and the context-menu key fire on the focused link, which Playwright's keys don't.
  await page.evaluate(() =>
    document.activeElement?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
  );
  await expect(item(page, "Rename")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(link(page, "Fix the login redirect Running")).toBeFocused();
  await page.keyboard.press("w");
  await expect(link(page, "Why the build is slow")).toBeFocused();
});

test("Left reaches More under right-to-left", async ({ page }) => {
  await load(page);
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
  await link(page, "Release checklist").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(more(page, "Release checklist")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(link(page, "Release checklist")).toBeFocused();
});

test("a cancelled onSelect stays put, an uncancelled one follows the link", async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.route = true;
  });
  await link(page, "Atlas roadmap").click();
  await expect(page).not.toHaveURL(/#t4$/);
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.route = false;
  });
  await link(page, "Atlas roadmap").click();
  await expect(page).toHaveURL(/#t4$/);
  const select = { name: "select", id: "t4", reason: "item-press", source: "mouse" };
  expect((await host(page)).calls).toEqual([select, select]);
});

test("Rename saves on Enter and keeps the host's title while pending and after a rejection; Escape keeps it", async ({
  page,
}) => {
  await load(page);
  await more(page, "Atlas roadmap").click();
  await item(page, "Rename").click();
  const editor = page.getByRole("textbox", { name: "Rename Atlas roadmap" });
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue("Atlas roadmap");
  await editor.fill("Atlas plan");
  await page.keyboard.press("Escape");
  await expect(editor).toBeHidden();
  await expect(link(page, "Atlas roadmap")).toBeVisible();
  expect((await host(page)).renames).toEqual([]);

  await link(page, "Atlas roadmap").focus();
  await page.keyboard.press("F2");
  await editor.fill("Atlas plan");
  await page.keyboard.press("Enter");
  await expect(link(page, "Atlas roadmap")).toBeVisible();
  expect((await host(page)).renames).toMatchObject([{ id: "t4", title: "Atlas plan", source: "keyboard" }]);
  await expectAgentActions(page, "Chats", ["select", "newThread", "pin", "share", "delete"]);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.renames[0]?.reject());
  await expectAgentActions(page, "Chats", ["select", "newThread", "rename", "pin", "share", "delete"]);
  await expect(link(page, "Atlas roadmap")).toBeVisible();
});

test("Delete asks first, and focus goes to the next row once the host removes it", async ({ page }) => {
  await load(page);
  await more(page, "Atlas roadmap").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Delete chat?" });
  await expect(dialog).toContainText("Atlas roadmap");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog.getByRole("button", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  await page.evaluate(() => (window as unknown as Fixture).kindHost.deletes[0]?.reject());
  await expect(dialog).toContainText("Couldn't delete. Try again.");
  await dialog.getByRole("button", { name: "Delete" }).click();
  await page.evaluate(() => {
    const { kindHost, kindThreadList } = window as unknown as Fixture;
    kindThreadList.setThreads((threads) => threads.filter((thread) => thread.id !== "t4"));
    kindHost.deletes[1]?.resolve();
  });
  await expect(dialog).toBeHidden();
  await expect(more(page, "Fix the login redirect")).toBeFocused();
});

test("an agent's delete opens the dialog, whose Delete needs a person", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Chats", ["select", "newThread", "rename", "pin", "share", "delete"]);
  await act(page, "delete", ["t2"]);
  const dialog = page.getByRole("alertdialog", { name: "Delete chat?" });
  await expect(dialog).toContainText("Fix the login redirect");
  await expect(dialog.getByRole("button", { name: "Delete" })).toHaveAttribute("data-agent-confirm", /.+/);
  expect((await host(page)).deletes).toEqual([]);
});

test("agent actions report the agent and refuse unknown ids", async ({ page }) => {
  await load(page);
  await act(page, "pin", ["t5"]);
  await act(page, "share", ["t3"]);
  expect(JSON.stringify(await act(page, "pin", ["nope"]))).toContain("error");
  expect((await host(page)).calls).toEqual([
    { name: "pin", id: "t5", pinned: true, reason: "imperative", source: "agent" },
    { name: "share", id: "t3", reason: "imperative", source: "agent" },
  ]);
});

test("with confirmDelete off, Delete calls onDelete at once", async ({ page }) => {
  await load(page, "no-confirm");
  await more(page, "Atlas roadmap").click();
  await item(page, "Delete").click();
  await expect.poll(async () => (await host(page)).deletes.length).toBe(1);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expectAgentActions(page, "Chats", ["select", "newThread", "rename", "pin", "share"]);
});

test("an end reached while loading asks for more once loading stops", async ({ page }) => {
  await load(page, "thousand");
  await page.evaluate(() => (window as unknown as Fixture).kindThreadList.setStatus("loading"));
  await link(page, "Thread 1").focus();
  await page.keyboard.press("Control+End");
  await expect(more(page, "Thread 1000")).toBeFocused();
  const loads = async () => (await host(page)).calls.filter((call) => call.name === "loadMore");
  expect(await loads()).toEqual([]);
  await page.evaluate(() => (window as unknown as Fixture).kindThreadList.setStatus("idle"));
  await expect.poll(loads).toEqual([{ name: "loadMore", reason: "end-reached" }]);
});

test("the keys reach rows not yet rendered, and nearing the end asks for more once", async ({ page }) => {
  await load(page, "thousand");
  await link(page, "Thread 1").focus();
  await page.keyboard.press("Control+End");
  await expect(more(page, "Thread 1000")).toBeFocused();
  const loads = async () => (await host(page)).calls.filter((call) => call.name === "loadMore");
  await expect.poll(loads).toEqual([{ name: "loadMore", reason: "end-reached" }]);
  await page.keyboard.press("PageUp");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(":focus")).toHaveAttribute("data-slot", "kind-thread-list-link");
  await page.keyboard.press("Control+End");
  await expect(more(page, "Thread 1000")).toBeFocused();
  expect(await loads()).toHaveLength(1);
  await page.evaluate(() => (window as unknown as Fixture).kindThreadList.setStatus("error"));
  await page.getByRole("button", { name: "Retry" }).click();
  expect((await host(page)).calls.at(-1)).toEqual({ name: "loadMore", reason: "retry-press" });
});

test.describe("on a small touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the row menu is a sheet", async ({ page }) => {
    await load(page);
    await more(page, "Atlas roadmap").tap();
    await expect(page.locator('[data-slot="menu-content"]')).toHaveAttribute("data-presentation", "sheet");
    await expect(item(page, "Rename")).toBeVisible();
  });
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the menu open and with the dialog open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await more(page, "Atlas roadmap").click();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
    await item(page, "Delete").click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
  });
