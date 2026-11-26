import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindDiff: {
    set(id: string, next: Record<string, unknown>): void;
    append(id: string, text: string): void;
    settle(name: string): void;
  };
  kindHost: { copies: [string, string][]; decisions: [string, string][]; permit?: boolean };
  agent: { act(input: unknown): Promise<unknown> };
};

const diff = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  diff(page, id).locator(`[data-slot="kind-diff-${name}"]`);
const decisions = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.decisions);
const settle = (page: Page, name: string) =>
  page.evaluate((n) => (window as unknown as Fixture).kindDiff.settle(n), name);
const append = (page: Page, id: string, text: string) =>
  page.evaluate(([i, t]) => (window as unknown as Fixture).kindDiff.append(i, t), [id, text] as const);
const act = (page: Page, ref: string, action: string) =>
  page.evaluate(([r, a]) => (window as unknown as Fixture).agent.act({ steps: [{ ref: r, action: a }] }), [
    ref,
    action,
  ] as const);

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=diff&case=${name}`);
  await expect(page.locator('[data-slot="kind-diff"]').first()).toBeVisible();
};

test("names the file and reads the change in words", async ({ page }) => {
  await open(page);
  await expect(diff(page, "edit")).toHaveAttribute("aria-label", "src/values.ts");
  await expect(part(page, "edit", "stats")).toHaveText("+12 −3");
  await expect(part(page, "edit", "stats")).toHaveAttribute("aria-label", "12 added, 3 removed");
  await expect(part(page, "edit", "status")).toBeHidden();
  await expect(part(page, "rename", "path")).toHaveText("src/old-name.tssrc/new-name.ts");
  await expect(part(page, "rename", "status")).toHaveText("Renamed");
  await expect(part(page, "rename", "code").first()).toHaveText("@@ -1,3 +1,3 @@");
});

test("a screen reader reads each row's old number, new number, change and code", async ({ page }) => {
  await open(page);
  const table = part(page, "edit", "table");
  await expect(table).toHaveAttribute("role", "table");
  const removed = table.locator('[data-kind="remove"]').first();
  await expect(removed.getByRole("rowheader")).toHaveText(["3"]);
  await expect(removed.getByRole("cell")).toHaveText(["", "removed", "export const value3 = 3;"]);
  const added = table.locator('[data-kind="add"]').first();
  await expect(added.getByRole("rowheader")).toHaveText(["3"]);
  await expect(added.getByRole("cell")).toHaveText(["", "added", "export const value3 = three;"]);
  // Only the word that changed is marked, and the highlighter's colors still show.
  await expect(added.locator("mark")).toHaveText(["three"]);
  await expect(added.locator("span", { hasText: /^const$/ })).toHaveCSS("color", "rgb(160, 0, 160)");
});

test("Show 14 lines expands by Enter, keeping the rows above in place", async ({ page }) => {
  await open(page);
  const collapsed = part(page, "edit", "collapsed");
  await expect(collapsed).toHaveText(["Show 14 lines"]);
  const above = await part(page, "edit", "row").nth(5).boundingBox();
  await collapsed.focus();
  await page.keyboard.press("Enter");
  await expect(collapsed).toHaveCount(0);
  await expect(part(page, "edit", "table").getByText("export const value10 = 10;")).toBeVisible();
  expect(await part(page, "edit", "row").nth(5).boundingBox()).toEqual(above);
});

test("find in page shows the collapsed run it matched", async ({ page }) => {
  await open(page);
  const hidden = part(page, "edit", "collapsed-text");
  await expect(hidden).toHaveAttribute("hidden", "until-found");
  expect(await hidden.evaluate((el) => el.textContent)).toContain("export const value10 = 10;");
  await hidden.evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(part(page, "edit", "collapsed")).toHaveCount(0);
});

test("Accept and Revert lock while pending, and Revert asks an agent for a person", async ({ page }) => {
  await open(page);
  await expect(diff(page, "edit")).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(diff(page, "rename")).not.toHaveAttribute("data-agent-confirm", /.*/);
  const accept = part(page, "edit", "accept");
  const revert = part(page, "edit", "revert");
  await accept.click();
  await expect(accept).toHaveAttribute("aria-disabled", "true");
  await expect(revert).toHaveAttribute("aria-disabled", "true");
  await revert.click({ force: true });
  expect(await decisions(page)).toEqual([["accept", "mouse"]]);
  await settle(page, "accept");
  await expect(accept).not.toHaveAttribute("aria-disabled", /.*/);
  await revert.focus();
  await page.keyboard.press("Enter");
  expect(await decisions(page)).toEqual([
    ["accept", "mouse"],
    ["revert", "keyboard"],
  ]);
});

test("Copy writes the patch", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  await part(page, "edit", "copy").click();
  await expect.poll(() => readClipboard(page, browserName)).toContain("+export const value3 = three;");
  await part(page, "rename", "copy").click();
  const copies = await page.evaluate(() => (window as unknown as Fixture).kindHost.copies);
  expect(copies.at(-1)?.[0]).toContain("rename from src/old-name.ts");
  expect(copies.at(-1)?.[1]).toBe("copy-press");
});

test("a streamed hunk adds its rows and keeps the ones before", async ({ page }) => {
  await open(page, "stream-40");
  const rows = part(page, "stream", "row");
  const count = await rows.count();
  const first = await rows.first().elementHandle();
  await append(page, "stream", "@@ -50,2 +50,3 @@\n line a\n+line b\n line c\n");
  await expect(rows).toHaveCount(count + 4);
  expect(await rows.first().evaluate((el, old) => el === old, first)).toBe(true);
  await expect(part(page, "stream", "stats")).toHaveText("+21 −20");
});

test("a 2,000-line diff renders only the rows in view", async ({ page }) => {
  await open(page, "stream-2000");
  const table = part(page, "stream", "table");
  await expect(table).toHaveAttribute("data-virtual", "");
  await expect(table).toHaveAttribute("aria-rowcount", "3001");
  await expect.poll(() => part(page, "stream", "row").count()).toBeLessThan(40);
  // Rows are measured as they render, so the end moves until every row on the way has been.
  await expect
    .poll(() =>
      part(page, "stream", "viewport").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        return el.querySelector("[data-slot=kind-diff-row]:last-child")?.getAttribute("aria-rowindex");
      }),
    )
    .toBe("3001");
});

test("agents accept, expand every run and copy", async ({ page, context, browserName }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await allowClipboard(context, browserName);
  await open(page);
  await expectAgentActions(page, "src/values.ts", ["accept", "copy", "expandAll", "revert"]);
  await expectAgentActions(page, "src/new-name.ts", ["copy"]);
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.permit = true;
  });
  await act(page, "src/values.ts", "expandAll");
  await expect(part(page, "edit", "collapsed")).toHaveCount(0);
  await act(page, "src/values.ts", "accept");
  expect(await decisions(page)).toEqual([["accept", "agent"]]);
  await expectAgentActions(page, "src/values.ts", ["copy"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-diff put back in the page draws its rows", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  await diff(page, "edit").evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(el);
  });
  await expect(part(page, "edit", "collapsed")).toHaveText(["Show 14 lines"]);
  await part(page, "edit", "collapsed").click();
  await expect(part(page, "edit", "collapsed")).toHaveCount(0);
});
