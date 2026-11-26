import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Retried = {
  id: string;
  toolCallId: string;
  reason: string;
  source: string;
  resolve(): void;
  reject(): void;
};
type Fixture = {
  kindTool: { setCall(id: string, next: Record<string, unknown>): void };
  kindRetries: Retried[];
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const tool = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  tool(page, id).locator(`[data-slot="kind-tool-${name}"]`);
const retryButton = (page: Page, id: string) => tool(page, id).getByRole("button", { name: "Retry" });
const setCall = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTool.setCall(i, n), [id, next] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const retries = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindRetries.map(({ id, toolCallId, reason, source }) => ({
      id,
      toolCallId,
      reason,
      source,
    })),
  );
const settle = (page: Page, index: number, outcome: "resolve" | "reject") =>
  page.evaluate(([i, o]) => (window as unknown as Fixture).kindRetries[i]?.[o](), [index, outcome] as const);

// The installed clock runs while the page loads, so it pauses ahead of the page's own time, and the countdown is
// set from there.
const pauseClock = async (page: Page) => {
  const paused = (await page.evaluate(() => Date.now())) + 5000;
  await page.clock.pauseAt(paused);
  return (seconds: number) => new Date(paused + seconds * 1000).toISOString();
};

const open = async (page: Page) => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/?c=tool&case=retry");
  await expect(tool(page, "failed")).toHaveAttribute("data-status", "error");
};

test("Retry sits in a failed call's error, and stays locked until the call's status changes", async ({
  page,
}) => {
  await open(page);
  await expect(part(page, "failed", "error")).toContainText("Request timed out after 30 s.");
  await expect(part(page, "retrying", "retry-button")).toBeHidden();
  await retryButton(page, "failed").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => retries(page))
    .toEqual([{ id: "failed", toolCallId: "search_docs", reason: "retry-press", source: "keyboard" }]);
  await expect(retryButton(page, "failed")).toHaveAttribute("aria-disabled", "true");
  // A press while it's locked calls nothing.
  await page.keyboard.press("Enter");
  await settle(page, 0, "resolve");
  await expect(retryButton(page, "failed")).toHaveAttribute("aria-disabled", "true");
  expect(await retries(page)).toHaveLength(1);
  // Running again answers it, and Retry leaves with focus on the trigger.
  await setCall(page, "failed", { outcome: undefined });
  await expect(tool(page, "failed")).toHaveAttribute("data-status", "running");
  await expect(part(page, "failed", "retry-button")).toBeHidden();
  await expect(part(page, "failed", "trigger")).toBeFocused();
  await setCall(page, "failed", { outcome: "error" });
  await expect(retryButton(page, "failed")).not.toHaveAttribute("aria-disabled");
});

test("a rejected retry makes Retry available again", async ({ page }) => {
  await open(page);
  await retryButton(page, "failed").click();
  await expect(retryButton(page, "failed")).toHaveAttribute("aria-disabled", "true");
  await settle(page, 0, "reject");
  await expect(retryButton(page, "failed")).not.toHaveAttribute("aria-disabled");
  expect((await retries(page))[0]?.source).toBe("mouse");
});

test("two failed calls retry on their own", async ({ page }) => {
  await open(page);
  await retryButton(page, "failed").click();
  await expect(retryButton(page, "failed")).toHaveAttribute("aria-disabled", "true");
  await expect(retryButton(page, "other")).not.toHaveAttribute("aria-disabled");
  await retryButton(page, "other").click();
  await expect.poll(async () => (await retries(page)).map(({ id }) => id)).toEqual(["failed", "other"]);
});

test("a retrying call counts down without an announcement per tick, and announces each attempt once", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-25T12:00:00Z") });
  await open(page);
  const after = await pauseClock(page);
  const retry = part(page, "retrying", "retry");
  const input = part(page, "retrying", "input");
  const before = await input.boundingBox();
  await setCall(page, "retrying", {
    retry: { attempt: 2, maxAttempts: 5, retryAt: after(4), reason: "Rate limited" },
  });
  await expect(retry).toHaveText("Retrying, attempt 2 of 5, in 4 sec. Rate limited");
  await page.clock.runFor(1000);
  await expect(retry).toHaveText("Retrying, attempt 2 of 5, in 3 sec. Rate limited");
  await expect(retry.locator("[data-status-mark]")).toHaveAttribute("aria-hidden", "true");
  expect(await input.boundingBox()).toEqual(before);
  // It mounted on attempt 2, so a new `retryAt` alone announces nothing.
  expect(await announced(page)).toEqual([]);
  await setCall(page, "retrying", { retry: { attempt: 3, maxAttempts: 5, retryAt: after(8) } });
  await page.clock.runFor(1000);
  await expect.poll(() => announced(page)).toEqual(["Retrying, attempt 3"]);
  await page.clock.runFor(2000);
  expect(await announced(page)).toEqual(["Retrying, attempt 3"]);
  await setCall(page, "retrying", { retry: undefined });
  await expect(retry).toBeHidden();
});

test("agents retry a failed call while Retry is offered", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "search_docs", ["collapse", "copyInput", "expand", "press", "retry"]);
  await page.evaluate(() => {
    void (window as unknown as Fixture).agent.act({
      steps: [{ ref: "search_docs", action: "retry", args: [] }],
    });
  });
  await expect.poll(async () => (await retries(page))[0]?.source).toBe("agent");
  await expectAgentActions(page, "search_docs", ["collapse", "copyInput", "expand", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
