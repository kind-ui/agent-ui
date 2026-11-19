import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindConversation: {
    append(n?: number): void;
    prepend(n?: number): void;
    stream(chunk: string): void;
    remove(n?: number): void;
  };
};

const act = (page: Page, action: string) =>
  page.evaluate(
    (name) =>
      (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
        steps: [{ ref: "Conversation", action: name }],
      }),
    action,
  );

const open = async (page: Page, name = "chat") => {
  await page.goto(`/?c=conversation&case=${name}`);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
};
const call = <K extends keyof Fixture["kindConversation"]>(page: Page, method: K, arg?: number | string) =>
  page.evaluate(([m, a]) => (window as unknown as Fixture).kindConversation[m as K](a as never), [
    method,
    arg,
  ] as const);
const viewport = (page: Page) => page.locator('[data-slot="kind-conversation-viewport"]');
const jump = (page: Page) => page.getByRole("button", { name: /^Jump to latest/ });
const distanceFromEnd = (page: Page) =>
  viewport(page).evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
const scrollTop = (page: Page) => viewport(page).evaluate((el) => el.scrollTop);
const scrollUp = async (page: Page, by: number) => {
  await viewport(page).hover();
  await page.mouse.wheel(0, -by);
  await expect(page.locator('[data-slot="kind-conversation"]')).not.toHaveAttribute("data-following");
  // Firefox scrolls a wheel smoothly, so wait for the whole distance before the next scroll.
  await expect.poll(() => distanceFromEnd(page)).toBeGreaterThanOrEqual(by - 1);
};
const atEnd = async (page: Page) => expect.poll(() => distanceFromEnd(page)).toBeLessThanOrEqual(1);
// One rendered frame between chunks: a replayed stream, with no timers.
const nextFrame = (locator: Locator) =>
  locator.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );

test("starts at the end and follows appended messages", async ({ page }) => {
  await open(page);
  await atEnd(page);
  await call(page, "append", 3);
  await atEnd(page);
  await expect(jump(page)).toHaveCount(0);
});

test("scrolling up shows the jump control with the new-message count and announces it", async ({ page }) => {
  await open(page);
  await atEnd(page);
  await scrollUp(page, 200);
  for (let i = 0; i < 3; i++) await call(page, "append");
  await expect(jump(page)).toHaveText("3 new messages");
  await expect(jump(page)).toHaveAccessibleName("Jump to latest, 3 new messages");
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll("[aria-live]")].map((el) => el.textContent).join("|"),
      ),
    )
    .toContain("3 new messages");
});

test("the jump control scrolls to the end, resumes following and hides", async ({ page }) => {
  await open(page);
  await scrollUp(page, 200);
  await call(page, "append");
  await jump(page).click();
  await atEnd(page);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
  await expect(jump(page)).toHaveCount(0);
  await call(page, "append");
  await atEnd(page);
});

test("removed messages never take the count below zero, and reaching the end resets it", async ({ page }) => {
  await open(page);
  await scrollUp(page, 200);
  await call(page, "append", 2);
  await expect(jump(page)).toHaveText("2 new messages");
  await call(page, "remove", 3);
  await expect(jump(page)).toHaveText("Jump to latest");
  await call(page, "append");
  await expect(jump(page)).toHaveText("1 new message");
  await viewport(page).evaluate((el) => el.scrollBy(0, el.scrollHeight));
  await expect(jump(page)).toHaveCount(0);
});

test("older messages added above keep the reader's place and aren't counted", async ({ page }) => {
  await open(page);
  await scrollUp(page, 200);
  const reading = page.locator(`[data-message="m28"]`);
  const before = await reading.evaluate((el) => el.getBoundingClientRect().top);
  await call(page, "prepend", 5);
  await expect(page.locator('[data-message="o0"]')).toBeAttached();
  await expect.poll(() => reading.evaluate((el) => el.getBoundingClientRect().top)).toBeCloseTo(before, 0);
  await expect(jump(page)).toHaveText("Jump to latest");
  await call(page, "append");
  await expect(jump(page)).toHaveText("1 new message");
});

test("streaming into the last row while scrolled up keeps the reader's place", async ({ page }) => {
  await open(page);
  await scrollUp(page, 200);
  const before = await scrollTop(page);
  for (let i = 0; i < 20; i++) {
    await call(page, "stream", " and a few more streamed words");
    await nextFrame(viewport(page));
  }
  expect(Math.abs((await scrollTop(page)) - before)).toBeLessThanOrEqual(1);
});

test("a replayed stream at the live edge causes no layout shift", async ({ page }) => {
  await open(page);
  await atEnd(page);
  await page.evaluate(() => {
    const shifts: number[] = [];
    Object.assign(window, { shifts });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        shifts.push((entry as PerformanceEntry & { value: number }).value);
    }).observe({ type: "layout-shift" });
  });
  const rows = page.locator('[data-slot="kind-conversation-row"]');
  const offsets = () =>
    rows.evaluateAll((els) => els.slice(0, -1).map((el) => (el as HTMLElement).offsetTop));
  const earlier = await offsets();
  await call(page, "append");
  for (let i = 0; i < 20; i++) {
    await call(page, "stream", " streamed");
    await nextFrame(viewport(page));
  }
  await atEnd(page);
  expect((await offsets()).slice(0, earlier.length)).toEqual(earlier);
  expect(await page.evaluate(() => (window as unknown as { shifts: number[] }).shifts)).toEqual([]);
});

test("new rows pop in once, on mount only", async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-slot="kind-conversation-row"]');
  const animating = () => rows.evaluateAll((els) => els.filter((el) => el.getAnimations().length > 0).length);
  expect(await animating()).toBe(0);
  await call(page, "append");
  await expect.poll(() => rows.last().evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
  await expect.poll(animating).toBe(0);
  await call(page, "stream", " more");
  await nextFrame(viewport(page));
  expect(await animating()).toBe(0);
});

test("virtualize renders only the rows in view", async ({ page }) => {
  await open(page, "virtual");
  const rows = page.locator('[data-slot="kind-conversation-row"]');
  await expect(rows.first()).toBeAttached();
  expect(await rows.count()).toBeLessThan(100);
  await atEnd(page);
  await expect(rows.last().locator("[data-message]")).toHaveAttribute("data-message", "m999");
});

test("shows the empty part with no messages", async ({ page }) => {
  await open(page, "empty");
  await expect(page.getByText("No messages yet.")).toBeVisible();
  await call(page, "append");
  await expect(page.getByText("No messages yet.")).toBeHidden();
});

test("has no axe violations", async ({ page }) => {
  await open(page);
  await scrollUp(page, 200);
  await call(page, "append");
  await expect(jump(page)).toBeVisible();
  // Axe reads colors mid-entrance otherwise. The edge fades run on scroll timelines, not time.
  const entering = () =>
    page.evaluate(() => document.getAnimations().filter((a) => a.timeline === document.timeline).length);
  await expect.poll(entering).toBe(0);
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

test("is a live UI SDK primitive agents can scroll to the end", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Conversation", ["scrollToEnd"]);
  await scrollUp(page, 200);
  expect(await act(page, "scrollToEnd")).toMatchObject({ ok: true });
  await atEnd(page);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
});

type States = {
  kindConversationStates: {
    set(status: string, count?: number, error?: string): void;
    resolveRetry(): void;
    rejectRetry(): void;
    retries: { reason: string; source: string }[];
  };
};

const states = <K extends keyof States["kindConversationStates"]>(
  page: Page,
  method: K,
  ...args: unknown[]
) =>
  page.evaluate(
    ([m, a]) => {
      const target = (window as unknown as States).kindConversationStates;
      const value = target[m as K];
      return typeof value === "function"
        ? (value as (...x: unknown[]) => unknown)(...(a as unknown[]))
        : value;
    },
    [method, args] as const,
  );
const openState = async (page: Page, name: "loading" | "error" | "error-plain" | "welcome") => {
  await page.goto(`/?c=conversation&case=${name}`);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
  await expect.poll(() => page.evaluate(() => "kindConversationStates" in window)).toBe(true);
};
const skeleton = (page: Page) => page.locator('[data-slot="kind-conversation-skeleton"]');
const retryButton = (page: Page) => page.getByRole("button", { name: "Retry" });
const box = (locator: Locator) => locator.evaluate((el) => JSON.stringify(el.getBoundingClientRect()));

test("loading swaps the skeleton for the rows without moving the viewport or replaying entrances", async ({
  page,
}) => {
  await openState(page, "loading");
  await expect(skeleton(page)).toBeVisible();
  await expect(skeleton(page)).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("status")).toHaveText("Loading conversation");
  await expect(page.getByText("What can I help with?")).toBeHidden();
  const before = await box(viewport(page));
  await states(page, "set", "ready", 31);
  await expect(page.locator('[data-message="m30"]')).toBeVisible();
  await expect(skeleton(page)).toBeHidden();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(await box(viewport(page))).toBe(before);
  await atEnd(page);
  const rows = page.locator('[data-slot="kind-conversation-row"]');
  expect(await rows.evaluateAll((els) => els.filter((el) => el.getAnimations().length > 0).length)).toBe(0);
});

test("an error shows its words and Retry, which locks while pending", async ({ page }) => {
  await openState(page, "error");
  const error = page.locator('[data-slot="kind-conversation-error"]');
  // The page loaded with this error, so it's a status, not an alert.
  await expect(error).toHaveRole("status");
  await expect(error).toContainText("Couldn't load this conversation");
  await expectAgentActions(page, "Conversation", ["scrollToEnd", "retry"]);
  await retryButton(page).click();
  await expect(retryButton(page)).toHaveAttribute("aria-disabled", "true");
  await expectAgentActions(page, "Conversation", ["scrollToEnd"]);
  // Playwright waits for an `aria-disabled` button to enable, so press it anyway.
  await retryButton(page).click({ force: true });
  expect(await states(page, "retries")).toEqual([{ reason: "retry-press", source: "mouse" }]);
  await states(page, "rejectRetry");
  await expect(retryButton(page)).not.toHaveAttribute("aria-disabled");
  await retryButton(page).focus();
  await states(page, "set", "loading");
  // Retry left while focused, so focus moves to the viewport.
  await expect(viewport(page)).toBeFocused();
  await states(page, "set", "error", 0, "The connection dropped.");
  await expect(page.getByRole("alert")).toContainText("The connection dropped.");
  await retryButton(page).click();
  await states(page, "resolveRetry");
  await states(page, "set", "ready", 3);
  await expect(page.locator('[data-message="m2"]')).toBeVisible();
});

test("an agent's retry waits for the host and succeeds once the error is gone", async ({ page }) => {
  await openState(page, "error");
  const result = act(page, "retry");
  await expect(retryButton(page)).toHaveAttribute("aria-disabled", "true");
  await states(page, "set", "loading");
  expect(await result).toMatchObject({ ok: true });
  expect(await states(page, "retries")).toEqual([{ reason: "imperative", source: "agent" }]);
});

test("without onRetry an error offers no Retry", async ({ page }) => {
  await openState(page, "error-plain");
  await expect(page.getByRole("status")).toContainText("Couldn't load this conversation");
  await expect(retryButton(page)).toHaveCount(0);
  await expectAgentActions(page, "Conversation", ["scrollToEnd"]);
});

test("web fills state parts written after it connects, and reads an unknown status as ready", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "Web Components only");
  await openState(page, "loading");
  await page.evaluate(() => {
    const content = document.querySelector("kind-conversation-content") as HTMLElement;
    for (const tag of ["kind-conversation-skeleton", "kind-conversation-loading"]) {
      content.querySelector(tag)?.remove();
      content.append(document.createElement(tag));
    }
  });
  await expect(skeleton(page).locator("span")).toHaveCount(3);
  await expect(page.getByRole("status")).toHaveText("Loading conversation");
  await page.locator("kind-conversation").evaluate((el) => el.setAttribute("status", "failed"));
  await expect(page.getByText("What can I help with?")).toBeVisible();
});

test("the empty part's title and description center at 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await openState(page, "welcome");
  const title = page.getByText("What can I help with?");
  const description = page.getByText("Ask about your code");
  await expect(title).toBeVisible();
  await expect(description).toBeVisible();
  const center = (locator: Locator) =>
    locator.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
  const middle = await viewport(page).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
  expect(Math.abs((await center(title)) - middle)).toBeLessThanOrEqual(1);
  expect(Math.abs((await center(description)) - middle)).toBeLessThanOrEqual(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const scheme of ["light", "dark"] as const)
  for (const name of ["loading", "error", "welcome"] as const)
    test(`has no axe violations ${name}, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await openState(page, name);
      // The fixture page has no background of its own, which axe reads as white.
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
      expect(violations).toEqual([]);
    });
