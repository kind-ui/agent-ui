import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Settle = { resolve(): void; reject(): void };
type Fixture = {
  kindSteer: { steers: ({ text: string; mode: string; source: string } & Settle)[]; stops: number[] };
  kindComposer: { submissions: ({ draft: { text: string } } & Settle)[] };
  kindSend: { sends: ({ id: string; reason: string; source: string } & Settle)[] };
  kindQueue: { remove(id: string): void };
  setRunning(running: boolean): void;
  agent: { act(input: unknown): Promise<{ ok: boolean; error?: string }> };
};

const MOD = process.platform === "darwin" ? "Meta" : "Control";

const open = async (page: Page, query = "case=steer") => {
  await page.goto(`/?c=composer-steer&${query}`);
  const editor = page.getByRole("textbox", { name: "Prompt" });
  await expect(editor).toBeVisible();
  await editor.click();
  return editor;
};
const steers = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindSteer.steers.map(({ text, mode, source }) => ({ text, mode, source })),
  );
const settleSteer = (page: Page, how: "resolve" | "reject") =>
  page.evaluate((how) => (window as unknown as Fixture).kindSteer.steers.at(-1)?.[how](), how);
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0);
const steer = (page: Page) => page.getByRole("button", { name: /^(Steer|Queue)$/ });

test("while running, Send steers beside Stop: Enter steers, Mod+Enter queues", async ({ page }) => {
  const editor = await open(page);
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(steer(page)).toHaveText("Steer");
  await expect(page.getByRole("button", { name: "Send", exact: true })).toHaveCount(0);
  const stop = page.getByRole("button", { name: "Stop" });
  const box = () =>
    stop.evaluate(async (el) => {
      await Promise.all(el.getAnimations().map((animation) => animation.finished));
      return el.getBoundingClientRect().toJSON();
    });
  const before = await box();

  await page.keyboard.type("look at the tests");
  await page.keyboard.press("Enter");
  await expect(steer(page)).toHaveAttribute("aria-busy", "true");
  await settleSteer(page, "resolve");
  await expect(editor).toHaveText("");
  await page.keyboard.type("and the logs");
  await page.keyboard.press(`${MOD}+Enter`);
  expect(await steers(page)).toEqual([
    { text: "look at the tests", mode: "steer", source: "keyboard" },
    { text: "and the logs", mode: "queue", source: "keyboard" },
  ]);
  // Mod+Enter sends rather than starting a line.
  await expect(editor).toHaveText("and the logs");
  expect(await box()).toEqual(before);
});

test("a pending steer locks sending; resolving clears only what was sent, rejecting keeps it", async ({
  page,
}) => {
  const editor = await open(page);
  await page.keyboard.type("first");
  await page.keyboard.press("Enter");
  await page.keyboard.type(" and more");
  await page.keyboard.press("Enter");
  await steer(page).click({ force: true });
  expect((await steers(page)).length).toBe(1);
  await settleSteer(page, "resolve");
  await expect(editor).toHaveText("and more");
  await page.keyboard.press("Enter");
  await settleSteer(page, "reject");
  await expect(steer(page)).not.toHaveAttribute("aria-busy", "true");
  await expect(editor).toHaveText("and more");
  expect((await steers(page)).map(({ text }) => text)).toEqual(["first", "and more"]);
});

test("the chevron's menu offers both modes, by pointer and by keyboard", async ({ page }) => {
  await open(page);
  await page.keyboard.type("one");
  const chevron = page.getByRole("button", { name: "More send options" });
  await chevron.click();
  await page.getByRole("menuitem", { name: /Queue for next turn/ }).click();
  await settleSteer(page, "resolve");
  await page.getByRole("textbox", { name: "Prompt" }).click();
  await page.keyboard.type("two");
  await chevron.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: /Steer now/ })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: /Queue for next turn/ })).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await steers(page)).toEqual([
    { text: "one", mode: "queue", source: "mouse" },
    { text: "two", mode: "queue", source: "keyboard" },
  ]);
});

test("steerMode queue swaps the keys, and mod-enter composers steer on Alt+Enter", async ({ page }) => {
  await open(page, "case=steer&mode=queue");
  await expect(steer(page)).toHaveText("Queue");
  await page.keyboard.type("a");
  await page.keyboard.press("Enter");
  await settleSteer(page, "resolve");
  await page.keyboard.type("b");
  await page.keyboard.press(`${MOD}+Enter`);
  expect((await steers(page)).map(({ mode }) => mode)).toEqual(["queue", "steer"]);

  const editor = await open(page, "case=steer-mod-enter");
  await page.keyboard.type("c");
  await page.keyboard.press("Enter");
  await expect(editor).toContainText("c");
  expect(await steers(page)).toEqual([]);
  await page.keyboard.press(`${MOD}+Enter`);
  await settleSteer(page, "resolve");
  await page.keyboard.type("d");
  await page.keyboard.press("Alt+Enter");
  expect((await steers(page)).map(({ mode }) => mode)).toEqual(["steer", "queue"]);
});

test("composition sends nothing", async ({ page }) => {
  const editor = await open(page);
  await page.keyboard.type("ni");
  await editor.evaluate((el) => {
    el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }),
    );
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        metaKey: true,
        ctrlKey: true,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "" }));
  });
  expect(await steers(page)).toEqual([]);
});

test("without running, Stop replaces Send only while a submission is pending", async ({ page }) => {
  await open(page, "case=steer&idle");
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "More send options" })).toHaveCount(0);
  await page.keyboard.type("hi");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  expect(await steers(page)).toEqual([]);
  await page.evaluate(() => (window as unknown as Fixture).kindComposer.submissions.at(-1)?.resolve());
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();

  await page.evaluate(() => (window as unknown as Fixture).setRunning(true));
  await expect(steer(page)).toBeVisible();
  await page.evaluate(() => (window as unknown as Fixture).setRunning(false));
  await expect(steer(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});

test("running without onSteer: Stop takes Send's place", async ({ page }) => {
  await open(page, "case=steer&no-steer");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
  await expect(steer(page)).toHaveCount(0);
});

test("agents steer and queue through the composer's mark", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Message", [
    "setValue",
    "insertToken",
    "removeAttachment",
    "submit",
    "stop",
  ]);
  await page.keyboard.type("go");
  await expectAgentActions(page, "Message", [
    "setValue",
    "insertToken",
    "removeAttachment",
    "submit",
    "steer",
    "queue",
    "stop",
  ]);
  await expect(page.getByRole("form", { name: "Message" })).toHaveAttribute("data-agent-confirm", /.+/);
  const act = () =>
    page.evaluate(() =>
      (window as unknown as Fixture).agent.act({ steps: [{ ref: "Message", action: "queue" }] }),
    );
  expect((await act()).ok).toBe(false);
  expect(await steers(page)).toEqual([]);
  await page.evaluate(() => Object.assign(window, { permit: true }));
  await act();
  await expect.poll(() => steers(page)).toEqual([{ text: "go", mode: "queue", source: "agent" }]);
});

test("axe passes in light and dark, with the menu open", async ({ page }) => {
  await open(page);
  await page.keyboard.type("x");
  await page.getByRole("button", { name: "More send options" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").include('[role="menu"]').analyze();
    expect(violations).toEqual([]);
  }
});

test.describe("Queue's Send now", () => {
  const sends = (page: Page) =>
    page.evaluate(() =>
      (window as unknown as Fixture).kindSend.sends.map(({ id, reason, source }) => ({ id, reason, source })),
    );

  test("sends by pointer and Mod+Enter, locked until the host removes the item", async ({ page }) => {
    await page.goto("/?c=composer-steer&case=queue");
    const queue = page.getByRole("region", { name: "Queue" });
    await expect(queue.locator('[data-slot="kind-queue-item-send"]:not([hidden])')).toHaveCount(2);
    await expectAgentActions(page, "Queue", ["send"]);
    const first = queue.getByRole("listitem").filter({ hasText: "Also check the logs" });
    await first.hover();
    await first.locator('[data-slot="kind-queue-item-send"]').click();
    await expectAgentActions(page, "Queue", []);
    await page.evaluate(() => (window as unknown as Fixture).kindSend.sends.at(-1)?.resolve());
    await expectAgentActions(page, "Queue", []);
    await page.evaluate(() => (window as unknown as Fixture).kindQueue.remove("a"));
    await expectAgentActions(page, "Queue", ["send"]);
    await queue.getByRole("listitem").filter({ hasText: "Then open a PR" }).focus();
    await page.keyboard.press(`${MOD}+Enter`);
    await page.evaluate(() => (window as unknown as Fixture).kindSend.sends.at(-1)?.reject());
    await expectAgentActions(page, "Queue", ["send"]);
    expect(await sends(page)).toEqual([
      { id: "a", reason: "send-press", source: "mouse" },
      { id: "b", reason: "send-key", source: "keyboard" },
    ]);
  });
});
