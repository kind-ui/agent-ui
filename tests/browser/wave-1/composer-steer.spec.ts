import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

// Wave 7 spec §6: sending while a turn runs, and the Queue docked to the Composer.

type Call = { type: string; text?: string; id?: string; mode?: string; reason: string; source: string };
type Fixture = {
  kindSteer: { calls: Call[]; held: { resolve(): void; reject(): void }[] };
  setRunning(running: boolean): void;
};

const MOD = process.platform === "darwin" ? "Meta" : "Control";

const open = async (page: Page, query = "") => {
  await page.goto(`/?c=composer-steer&case=steer&${query}`);
  const editor = page.getByRole("textbox", { name: "Prompt" });
  await expect(editor).toBeVisible();
  await editor.click();
  return editor;
};
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindSteer.calls);
const settle = (page: Page, how: "resolve" | "reject") =>
  page.evaluate((how) => (window as unknown as Fixture).kindSteer.held.at(-1)?.[how](), how);
const send = (page: Page) => page.getByRole("button", { name: /^(Steer|Queue)$/ });
const stop = (page: Page) => page.locator('[data-slot="kind-composer-stop"]');
const rows = (page: Page) => page.locator('[data-slot="kind-queue-item"]');

test("while running, Stop shows alone until there's text; then Send joins it and Stop turns quiet", async ({
  page,
}) => {
  await open(page);
  await expect(stop(page)).toHaveAccessibleName("Stop generating");
  await expect(stop(page)).not.toHaveAttribute("data-quiet");
  await expect(send(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send", exact: true })).toHaveCount(0);
  // Enter never stops a turn, and with nothing to send it sends nothing.
  await page.keyboard.press("Enter");
  expect(await calls(page)).toEqual([]);

  await page.keyboard.type("Use the session table");
  await expect(send(page)).toHaveText("Steer");
  await expect(send(page)).toHaveAttribute("title", /^Send into the current turn · /);
  await expect(stop(page)).toHaveAttribute("data-quiet", "");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await expect(send(page)).toHaveCount(0);
});

test("Enter steers, Alt+Enter queues into the docked Queue, Shift+Mod+Enter stops and sends", async ({
  page,
}) => {
  const editor = await open(page);
  await page.keyboard.type("look at the tests");
  await page.keyboard.press("Enter");
  await expect(editor).toHaveText("");
  await page.keyboard.type("then the logs");
  await page.keyboard.press("Alt+Enter");
  await expect(editor).toHaveText("");
  await expect(page.locator('[data-slot="kind-queue-section-trigger"]').first()).toHaveAccessibleName(
    "1 queued",
  );
  await expect(rows(page)).toHaveText(["then the logs"]);
  await editor.click();
  await page.keyboard.type("start over");
  await page.keyboard.press(`Shift+${MOD}+Enter`);
  expect(
    (await calls(page)).map(({ text, mode, reason, source }) => ({ text, mode, reason, source })),
  ).toEqual([
    { text: "look at the tests", mode: "steer", reason: "send-key", source: "keyboard" },
    { text: "then the logs", mode: "queue", reason: "send-key", source: "keyboard" },
    { text: "start over", mode: "stop-and-send", reason: "send-key", source: "keyboard" },
  ]);
});

test("a pending send locks sending; resolving clears only what was sent, rejecting keeps it", async ({
  page,
}) => {
  const editor = await open(page, "hold");
  await page.keyboard.type("first");
  await page.keyboard.press("Enter");
  await expect(send(page)).toHaveAttribute("aria-busy", "true");
  await page.keyboard.type(" and more");
  await page.keyboard.press("Enter");
  expect(await calls(page)).toHaveLength(1);
  await settle(page, "resolve");
  await expect(editor).toHaveText("and more");
  await page.keyboard.press("Enter");
  await settle(page, "reject");
  await expect(send(page)).not.toHaveAttribute("aria-busy", "true");
  await expect(editor).toHaveText("and more");
});

test("Send's menu offers the other mode and Stop and send, each with its keys, the current mode checked", async ({
  page,
}) => {
  await open(page, "text");
  await page.getByRole("button", { name: "More ways to send" }).click();
  const items = page.getByRole("menuitem");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("Steer now");
  await expect(items.nth(0)).toContainText("Deliver at the agent's next step");
  await expect(items.nth(0)).toHaveAttribute("data-current", "");
  await expect(items.nth(1)).toContainText("Queue for later");
  await expect(items.nth(1)).not.toHaveAttribute("data-current", "");
  await expect(items.nth(2)).toContainText("Stop and send");
  await expect(items.nth(1).locator("kbd")).toHaveText(/(⌥ Enter|Alt\+Enter)/);
  expect(await new AxeBuilder({ page }).include('[data-slot="menu-content"]').analyze()).toHaveProperty(
    "violations",
    [],
  );
  await items.nth(1).click();
  expect((await calls(page)).map(({ mode, reason }) => ({ mode, reason }))).toEqual([
    { mode: "queue", reason: "item-press" },
  ]);
});

test("steerMode queue makes Send read Queue, and Enter queue", async ({ page }) => {
  await open(page, "mode=queue&text");
  await expect(send(page)).toHaveText("Queue");
  await expect(send(page)).toHaveAttribute("title", /^Send after this turn · /);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  expect((await calls(page)).map(({ mode }) => mode)).toEqual(["queue"]);
});

test("the docked Queue names its rows, sends now, and gives an edited message back to the composer", async ({
  page,
}) => {
  const editor = await open(page, "queue");
  await expect(page.locator('[data-slot="kind-queue"]')).toHaveAttribute("data-docked", "");
  await expect(rows(page).first()).toHaveAccessibleName("Queued message 1 of 2, not sent");
  await expect(rows(page).first()).toHaveAccessibleDescription(
    /Then add a test for the expired session case/,
  );
  await expect(page.getByRole("button", { name: "Send now" }).first()).toHaveAttribute(
    "title",
    "Send into the current turn",
  );

  await page.keyboard.type("Draft");
  await rows(page).first().hover();
  await rows(page).first().getByRole("button", { name: "Edit" }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(editor).toHaveText(/^Draft\s+Then add a test for the expired session case$/, {
    useInnerText: true,
  });
  await expect(editor).toBeFocused();

  await rows(page).first().getByRole("button", { name: "Send now" }).click();
  await expect(rows(page)).toHaveCount(0);
  expect((await calls(page)).map(({ type, id, reason }) => ({ type, id, reason }))).toEqual([
    { type: "edit", id: "q1", reason: "edit-press" },
    { type: "send", id: "q2", reason: "send-press" },
  ]);
});

test("Alt+Up in an empty composer takes back the last queued message", async ({ page }) => {
  const editor = await open(page, "queue");
  await page.keyboard.press("Alt+ArrowUp");
  await expect(editor).toHaveText("Update the README section on auth once tests pass");
  await expect(rows(page)).toHaveCount(1);
  // With text in the draft, Alt+Up takes nothing.
  await page.keyboard.press("Alt+ArrowUp");
  await expect(rows(page)).toHaveCount(1);
  expect((await calls(page)).map(({ type, id, reason, source }) => ({ type, id, reason, source }))).toEqual([
    { type: "edit", id: "q2", reason: "take-back", source: "keyboard" },
  ]);
});

test("the row's buttons follow it in Tab order; Send now waits for a pending request", async ({ page }) => {
  await open(page, "queue&pending");
  const first = rows(page).first();
  await first.focus();
  await page.keyboard.press("Tab");
  await expect(first.getByRole("button", { name: "Send now" })).toBeFocused();
  await expect(first.getByRole("button", { name: "Send now" })).toHaveAttribute("aria-disabled", "true");
  await expect(first.getByRole("button", { name: "Send now" })).toHaveAttribute(
    "title",
    "Available after you answer the pending request",
  );
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(first.getByRole("button", { name: "Edit" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first.getByRole("button", { name: "Remove" })).toBeFocused();
  // Arrows move between rows from a row's button too.
  await page.keyboard.press("ArrowDown");
  await expect(rows(page).nth(1)).toBeFocused();
  expect(await calls(page)).toEqual([]);
  expect(await new AxeBuilder({ page }).include('[data-slot="kind-composer"]').analyze()).toHaveProperty(
    "violations",
    [],
  );
});

test("stopping never sends the next queued message, and the folded Queue stays docked", async ({ page }) => {
  await open(page, "queue");
  await stop(page).click();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(2);
  expect((await calls(page)).map(({ type }) => type)).toEqual(["stop"]);
  await page.getByRole("button", { name: "2 queued" }).click();
  await expect(page.getByRole("button", { name: "2 queued" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('[data-slot="kind-queue"]')).toHaveAttribute("data-docked", "");
});

test("agents steer, queue and stop and send only while there's text, and send or edit queued items", async ({
  page,
}) => {
  await open(page, "queue");
  // `submit` refuses while a turn runs.
  await expectAgentActions(page, "Message", [
    "setValue",
    "insertToken",
    "removeAttachment",
    "submit",
    "stop",
  ]);
  await page.keyboard.type("x");
  await expectAgentActions(page, "Message", [
    "setValue",
    "insertToken",
    "removeAttachment",
    "submit",
    "steer",
    "queue",
    "stopAndSend",
    "stop",
  ]);
  await expectAgentActions(page, "Queued messages", ["remove", "send", "edit"]);
});
