import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindConversation: {
    append(n?: number): void;
    prepend(n?: number): void;
    stream(chunk: string): void;
    remove(n?: number): void;
  };
};

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
  await page.evaluate(() =>
    (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
      steps: [{ ref: "Conversation", action: "scrollToEnd" }],
    }),
  );
  await atEnd(page);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
});
