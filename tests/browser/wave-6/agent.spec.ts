import { expect, type Page, test } from "@playwright/test";
import {
  act,
  actionsOf,
  type Conformance,
  components,
  entry,
  expectSameAsPerson,
  host,
  setConfirm,
  setHost,
  settled,
  snapshot,
} from "../agent-conformance.js";
import { allowClipboard } from "../clipboard.js";
import { isWebElements, layerOf } from "../layer.js";

const threads = { component: "kind-thread-list", label: "Chats", id: "thread-list" };
const search = { component: "kind-thread-search", label: "Search chats", id: "thread-search" };
const sidebar = { component: "kind-sidebar", label: "History", id: "sidebar" };
const share = { component: "kind-share-dialog", label: "Share", id: "share" };
const failed = { component: "kind-message", label: "Failed answer", id: "failed" };
const earlier = { component: "kind-conversation", label: "Earlier chat", id: "earlier" };
const connection = { component: "kind-connection-status", label: "Offline", id: "connection" };
const find = { component: "kind-conversation-search", label: "Search in conversation", id: "find" };

type Target = typeof threads;

const wave6 = [threads, search, sidebar, share, failed, earlier, connection, find];

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-6");
  await expect.poll(() => components(page)).toContain("kind-conversation-search");
  await settled(page);
};
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);
const button = (id: string, name: string | RegExp) => (page: Page) =>
  byId(id)(page)
    .getByRole("button", { name, exact: typeof name === "string" })
    .first();
const press = (id: string, name: string | RegExp) => (page: Page) => button(id, name)(page).click();
const opened = (target: Target) => (page: Page) =>
  expect.poll(async () => (await entry(page, target.component, target.label))?.open);

// A row's menu, driven with the keyboard, where a pointer would leave a row under it highlighted.
const rowMenu = (title: string, item: string) => async (page: Page) => {
  await button("thread-list", `More actions for ${title}`)(page).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: item }).focus();
  await page.keyboard.press("Enter");
};
const searchTrigger = (page: Page) =>
  byId("thread-search")(page).locator('[data-slot="kind-thread-search-trigger"]');
const openSearch = async (page: Page) => {
  await searchTrigger(page).click();
  await opened(search)(page).toBe(true);
};
const openShare = async (page: Page) => {
  await press("share", "Share")(page);
  await opened(share)(page).toBe(true);
  await settled(page);
};
const findField = (page: Page) => byId("find")(page).getByRole("searchbox");

// The person opened a row's menu or editor on the way, and its parts keep what UI SDK wrote then.
const rowParts =
  '[data-slot="menu-content"], [data-slot="kind-thread-list-more"], [data-slot="kind-thread-list-editor"]';
const searchContent = '[data-slot="kind-thread-search-content"], [data-slot="kind-thread-search-backdrop"]';

const conformance: Conformance[] = [
  {
    target: threads,
    action: "select",
    args: ["t3"],
    pointer: (page) => byId("thread-list")(page).getByRole("link", { name: "Draft the launch post" }).click(),
  },
  { target: threads, action: "newThread", pointer: press("thread-list", "New chat") },
  {
    target: threads,
    action: "pin",
    args: ["t5"],
    ignore: rowParts,
    pointer: rowMenu("Why the build is slow", "Pin"),
  },
  {
    target: threads,
    action: "share",
    args: ["t5"],
    ignore: rowParts,
    pointer: rowMenu("Why the build is slow", "Share"),
  },
  {
    target: threads,
    action: "rename",
    args: ["t5", "Slow builds"],
    ignore: rowParts,
    pointer: async (page) => {
      await rowMenu("Why the build is slow", "Rename")(page);
      await page.getByRole("textbox", { name: "Rename Why the build is slow" }).fill("Slow builds");
      await page.keyboard.press("Enter");
    },
  },
  {
    target: threads,
    action: "delete",
    args: ["t5"],
    ignore: rowParts,
    pointer: rowMenu("Why the build is slow", "Delete"),
  },
  { target: search, action: "open", ignore: searchContent, pointer: (page) => searchTrigger(page).click() },
  {
    target: search,
    action: "close",
    ignore: searchContent,
    before: openSearch,
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: search,
    action: "search",
    args: ["login"],
    ignore: searchContent,
    before: openSearch,
    pointer: (page) => page.keyboard.type("login"),
  },
  {
    target: search,
    action: "select",
    args: ["t3"],
    ignore: searchContent,
    pointer: async (page) => {
      await openSearch(page);
      await page.getByRole("option", { name: /^Draft the launch post/ }).click();
    },
  },
  {
    target: search,
    action: "newThread",
    ignore: searchContent,
    pointer: async (page) => {
      await openSearch(page);
      await page.getByRole("option", { name: /^New chat/ }).click();
    },
  },
  { target: sidebar, action: "close", pointer: press("sidebar", "Hide History") },
  {
    target: sidebar,
    action: "open",
    before: async (page) => {
      await press("sidebar", "Hide History")(page);
      await opened(sidebar)(page).toBe(false);
      await settled(page);
    },
    pointer: press("sidebar", "Show History"),
  },
  { target: share, action: "open", pointer: press("share", "Share") },
  { target: share, action: "close", before: openShare, pointer: (page) => page.keyboard.press("Escape") },
  {
    target: share,
    action: "setVisibility",
    args: ["private"],
    before: openShare,
    pointer: (page) => byId("share")(page).getByRole("radio", { name: "Only you" }).click(),
  },
  { target: share, action: "createLink", before: openShare, pointer: press("share", "Create link") },
  {
    target: share,
    action: "copyLink",
    before: async (page) => {
      await openShare(page);
      await press("share", "Create link")(page);
      await expect(button("share", /^Copy/)(page)).toBeVisible();
    },
    pointer: press("share", /^Copy/),
  },
  {
    target: share,
    action: "revoke",
    before: async (page) => {
      await openShare(page);
      await press("share", "Create link")(page);
      await expect(button("share", "Stop sharing")(page)).toBeVisible();
    },
    pointer: press("share", "Stop sharing"),
  },
  { target: failed, action: "retry", pointer: press("failed", "Retry") },
  { target: earlier, action: "retry", pointer: press("earlier", "Retry") },
  { target: connection, action: "retry", pointer: press("connection", "Retry") },
  { target: find, action: "search", args: ["rollout"], pointer: (page) => findField(page).fill("rollout") },
  {
    target: find,
    action: "next",
    before: (page) => findField(page).fill("rollout"),
    pointer: press("find", /^Next/),
  },
  {
    target: find,
    action: "previous",
    before: (page) => findField(page).fill("rollout"),
    pointer: press("find", /^Previous/),
  },
  { target: find, action: "close", pointer: press("find", /^Close/) },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

// Composed UI SDK components a Wave 6 component holds, none of which may be an entry of its own. Since UI SDK
// 0.1.0-beta.6 the Input inside Conversation Search's Input Group is no entry either.
const composed = ["resizable", "drawer", "command", "menu", "segmented-control", "input"];
const field: string[] = [];
const listed = async (page: Page) =>
  (await snapshot(page))
    .filter((item) =>
      wave6.some((target) => target.component === item.component && target.label === item.label),
    )
    .map((item) => `${item.component} "${item.label}": ${[...item.actions].sort().join(" ")}`)
    .sort();
const composedEntries = async (page: Page) =>
  (await snapshot(page)).filter((item) => composed.includes(item.component)).map((item) => item.component);

test("one snapshot lists each Wave 6 component once by name with its actions, and no composed part", async ({
  page,
}) => {
  await open(page);
  expect((await snapshot(page)).map((item) => item.component)).not.toContain("more");
  expect(await listed(page)).toEqual([
    'kind-connection-status "Offline": retry',
    'kind-conversation "Earlier chat": retry scrollToEnd',
    'kind-conversation-search "Search in conversation": close press search',
    'kind-message "Failed answer": copy retry',
    'kind-share-dialog "Share": open press',
    'kind-sidebar "History": close press',
    'kind-thread-list "Chats": delete newThread pin rename select share',
    'kind-thread-search "Search chats": newThread open press search select',
  ]);
  // A Day Separator is content: listed by kind, with nothing to do.
  expect((await snapshot(page)).filter((item) => item.component === "kind-day-separator")).toEqual([
    expect.objectContaining({ actions: [] }),
  ]);
  expect(await composedEntries(page)).toEqual(field);

  // Popups mount their composed parts only while open.
  await act(page, search.component, search.label, "open");
  await opened(search)(page).toBe(true);
  await act(page, search.component, search.label, "search", ["login"]);
  expect(await composedEntries(page)).toEqual(field);
  await act(page, search.component, search.label, "close");
  await act(page, share.component, share.label, "open");
  await opened(share)(page).toBe(true);
  expect(await composedEntries(page)).toEqual(field);
  await act(page, share.component, share.label, "close");
  await act(page, threads.component, threads.label, "delete", ["t5"]);
  await expect(page.getByRole("alertdialog", { name: "Delete chat?" })).toBeVisible();
  expect(await composedEntries(page)).toEqual(field);
});

test("only Share Dialog, while agentConfirm, and Thread List's delete dialog ask for a person", async ({
  page,
}) => {
  await open(page);
  const asking = () =>
    page.evaluate(
      (ids) =>
        ids.flatMap((id) =>
          [...(document.getElementById(id)?.querySelectorAll("[data-agent-confirm]") ?? [])].map(
            (el) => `${id} ${el.getAttribute("data-slot") ?? el.localName}`,
          ),
        ),
      wave6.map(({ id }) => id),
    );
  // Web keeps the delete dialog in the page, closed; React mounts it on open.
  const deleteButton = "thread-list kind-thread-list-dialog-delete";
  const atRest = (await asking()).filter((item) => item !== deleteButton);
  expect(atRest).toEqual(["share kind-share-dialog"]);
  await act(page, threads.component, threads.label, "delete", ["t5"]);
  await expect.poll(asking).toEqual([deleteButton, "share kind-share-dialog"]);
  await setConfirm(page, false);
  await expect.poll(asking).toEqual([deleteButton]);
});

// `@ui-sdk/svelte` writes a Segmented Control's hidden radio `checked` as an
// attribute when a person's press renders the item again, and only the property when its controller sets the value,
// so the Share Dialog's hidden inputs are compared by the items' `aria-checked` alone there.
const svelteIgnore: Partial<Record<string, string>> = { [share.id]: '[data-slot="segmented-control-input"]' };

for (const item of conformance) {
  const { target, action: name, args } = item;
  test(`${target.component} "${target.label}".${name}(${args?.join(", ") ?? ""}) leaves the page as a person's input does`, ({
    page,
  }, testInfo) =>
    expectSameAsPerson(page, open, {
      ...item,
      ignore: (layerOf(testInfo) === "svelte" && svelteIgnore[target.id]) || item.ignore,
    }));
}

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await setHost(page, { refuse: true });
  await act(page, threads.component, threads.label, "select", ["t3"]);
  await act(page, search.component, search.label, "open");
  await act(page, sidebar.component, sidebar.label, "close");
  await act(page, share.component, share.label, "open");
  await act(page, find.component, find.label, "search", ["rollout"]);
  await act(page, find.component, find.label, "close");
  expect((await host(page)).changes).toEqual(
    ["thread-select", "thread-search", "sidebar", "share", "find-query", "find"].map(
      (name) => `${name}:agent`,
    ),
  );
  await settled(page);
  expect(page.url()).not.toContain("#t3");
  for (const [target, open] of [
    [search, false],
    [sidebar, true],
    [share, false],
  ] as const)
    expect((await entry(page, target.component, target.label))?.open, target.label).toBe(open);
  await expect(findField(page)).toHaveValue("");
  await expect(byId("find")(page).getByRole("search")).toBeVisible();
});

test("action callbacks hear source agent", async ({ page }) => {
  await open(page);
  await act(page, threads.component, threads.label, "newThread");
  await act(page, threads.component, threads.label, "rename", ["t5", "Slow builds"]);
  await act(page, threads.component, threads.label, "pin", ["t5"]);
  await act(page, threads.component, threads.label, "share", ["t5"]);
  await act(page, search.component, search.label, "newThread");
  await act(page, failed.component, failed.label, "retry");
  await act(page, earlier.component, earlier.label, "retry");
  await act(page, connection.component, connection.label, "retry");
  // Last: an open modal makes the page behind it inert, which the agent leaves alone.
  await act(page, share.component, share.label, "open");
  await act(page, share.component, share.label, "createLink");
  await expect
    .poll(async () => (await host(page)).sources)
    .toEqual(
      [
        "thread-new",
        "thread-rename",
        "thread-pin",
        "thread-share",
        "thread-search-new",
        "message-retry",
        "conversation-retry",
        "connection-retry",
        "share-create",
      ].map((name) => `${name}:agent`),
    );
});

type Steps = { ok: boolean; steps?: { result?: unknown }[] };
const refused = (result: Steps) => !result.ok || result.steps?.[0]?.result === false;

test("actions that take an id refuse an unknown one", async ({ page }) => {
  await open(page);
  const results = [
    await act(page, threads.component, threads.label, "select", ["nope"]),
    await act(page, threads.component, threads.label, "rename", ["nope", "Title"]),
    await act(page, threads.component, threads.label, "pin", ["nope"]),
    await act(page, threads.component, threads.label, "share", ["nope"]),
    await act(page, threads.component, threads.label, "delete", ["nope"]),
    await act(page, search.component, search.label, "select", ["nope"]),
  ];
  // Last: the open dialog makes the page behind it inert.
  await act(page, share.component, share.label, "open");
  results.push(await act(page, share.component, share.label, "setVisibility", ["nope"]));
  expect(results.map(refused)).toEqual(results.map(() => true));
  const { calls, changes } = await host(page);
  expect(calls).toEqual([]);
  expect(changes).toEqual(["share:agent"]);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("can-* attributes offer their actions", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web attributes only");
  await open(page);
  const cases = [
    ...(["select", "newThread", "rename", "pin", "share", "delete"] as const).map((action) => ({
      target: threads,
      attribute: `can-${action === "newThread" ? "new" : action}`,
      action,
    })),
    { target: search, attribute: "can-select", action: "select" },
    { target: search, attribute: "can-new", action: "newThread" },
    { target: failed, attribute: "can-retry", action: "retry" },
    { target: earlier, attribute: "can-retry", action: "retry" },
    { target: connection, attribute: "can-retry", action: "retry" },
  ];
  const check = async ({ target, attribute, action: name }: (typeof cases)[number]) => {
    const element = page.locator(`[id="${target.id}"] ${target.component}`);
    const actions = () => actionsOf(page, target.component, target.label);
    await element.evaluate((el, attr) => el.removeAttribute(attr), attribute);
    await expect.poll(actions, `#${target.id} without ${attribute}`).not.toContain(name);
    await element.evaluate((el, attr) => el.setAttribute(attr, ""), attribute);
    await expect.poll(actions, `#${target.id} with ${attribute}`).toContain(name);
  };
  for (const item of cases) await check(item);
  // Last: the open dialog makes the page behind it inert.
  await act(page, share.component, share.label, "open");
  await opened(share)(page).toBe(true);
  await check({ target: share, attribute: "can-create-link", action: "createLink" });
  await act(page, share.component, share.label, "createLink");
  await check({ target: share, attribute: "can-revoke", action: "revoke" });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("an open Sidebar is one entry, without its Drawer", async ({ page }) => {
    await page.goto("/?c=sidebar&case=all");
    await page.getByRole("button", { name: "Show Chats" }).click();
    await expect
      .poll(async () => (await entry(page, "kind-sidebar", "Chats"))?.actions.sort())
      .toEqual(["close", "press"]);
    // A narrow React Sidebar still lists its Resizable (react decisions.md, "A narrow React Sidebar").
    expect((await snapshot(page)).map((item) => item.component)).not.toContain("drawer");
  });
});
