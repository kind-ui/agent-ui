import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { rootIdGap } from "../svelte-root-id.js";

type Retry = { attempt: number; maxAttempts?: number; retryAt?: string; reason?: string };
type Fixture = {
  kindDelivery: {
    calls: string[];
    deliver(id: string, value: string | null): void;
    retry(value: Retry | null): void;
    status(value: string): void;
    settle(ok: boolean): void;
  };
  kindAnnounced: string[];
  kindWrites(): number;
};

const fixture = (page: Page) => ({
  calls: () => page.evaluate(() => (window as unknown as Fixture).kindDelivery.calls),
  deliver: (id: string, value: string | null) =>
    page.evaluate(([id, value]) => (window as unknown as Fixture).kindDelivery.deliver(id, value), [
      id,
      value,
    ] as const),
  retry: (value: Retry | null) =>
    page.evaluate((value) => (window as unknown as Fixture).kindDelivery.retry(value), value),
  status: (value: string) =>
    page.evaluate((value) => (window as unknown as Fixture).kindDelivery.status(value), value),
  settle: (ok: boolean) => page.evaluate((ok) => (window as unknown as Fixture).kindDelivery.settle(ok), ok),
  announced: () => page.evaluate(() => (window as unknown as Fixture).kindAnnounced),
});

const steered = (page: Page) => page.getByRole("article", { name: "Steered message" });
const queued = (page: Page) => page.getByRole("article", { name: "Queued message" });
const answer = (page: Page) => page.getByRole("article", { name: "Retrying answer" });
const withdraw = (page: Page) => queued(page).getByRole("button", { name: "Withdraw" });
const retrying = (page: Page) => answer(page).locator('[data-slot="kind-message-retrying"]');

const open = async (page: Page) => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations)
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/?c=message&case=delivery");
  await expect(retrying(page)).toBeVisible();
  return fixture(page);
};

test("a steered or queued message says so in its header and its description", async ({ page }, testInfo) => {
  const host = await open(page);
  await expect(steered(page).locator('[data-slot="kind-message-delivery-text"]')).toHaveText("Steered");
  await expect(steered(page)).toHaveAccessibleDescription("Steered");
  await expect(queued(page).locator('[data-slot="kind-message-delivery-text"]')).toHaveText("Queued");
  await expect(queued(page)).toHaveAccessibleDescription("Queued");
  await expect(steered(page).getByRole("button", { name: "Withdraw" })).toHaveCount(0);
  // The Messages have ids, which unname them on Svelte.
  if (!rootIdGap(testInfo)) {
    await expectAgentActions(page, "Steered message", ["copy"]);
    await expectAgentActions(page, "Queued message", ["copy", "withdraw"]);
  }

  await host.deliver("steered", null);
  await expect(steered(page)).not.toHaveAttribute("aria-describedby");
  await expect(steered(page).locator('[data-slot="kind-message-delivery"]')).toBeHidden();
});

test("Withdraw by keyboard locks until the delivery changes, and a rejection frees it", async ({
  page,
}, testInfo) => {
  const host = await open(page);
  await withdraw(page).focus();
  await page.keyboard.press("Enter");
  expect(await host.calls()).toEqual(["withdraw:withdraw-press:keyboard"]);
  await expect(withdraw(page)).toHaveAttribute("aria-disabled", "true");
  if (!rootIdGap(testInfo)) await expectAgentActions(page, "Queued message", ["copy"]);

  await host.settle(false);
  await expect(withdraw(page)).not.toHaveAttribute("aria-disabled");

  await page.keyboard.press("Enter");
  await host.settle(true);
  // A withdraw that went through waits for the host.
  await expect(withdraw(page)).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  expect(await host.calls()).toHaveLength(2);

  await host.deliver("queued", null);
  await expect(withdraw(page)).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Reply" })).toBeFocused();
  await host.deliver("queued", "queued");
  await expect(withdraw(page)).toBeVisible();
  await expect(withdraw(page)).not.toHaveAttribute("aria-disabled");
});

test("retrying counts down under the text without moving it, and announces each attempt once", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00Z") });
  const host = await open(page);
  await expect(retrying(page)).toHaveText("Retrying, attempt 1 of 5. Rate limited");
  const content = answer(page).locator('[data-slot="kind-message-content"]');
  const box = await content.boundingBox();

  // Paused ahead of the page's own time, which runs while it loads.
  const paused = (await page.evaluate(() => Date.now())) + 5000;
  await page.clock.pauseAt(paused);
  await host.retry({
    attempt: 2,
    maxAttempts: 5,
    retryAt: new Date(paused + 4000).toISOString(),
    reason: "Rate limited",
  });
  await expect(retrying(page)).toHaveText("Retrying, attempt 2 of 5, in 4 sec. Rate limited");

  await retrying(page).evaluate((el) => {
    let writes = 0;
    const observer = new MutationObserver((records) => {
      writes += records.length;
    });
    observer.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });
    Object.assign(window, {
      kindWrites: () => {
        writes += observer.takeRecords().length;
        observer.disconnect();
        return writes;
      },
    });
  });
  await page.clock.runFor(1000);
  await expect(retrying(page)).toHaveText("Retrying, attempt 2 of 5, in 3 sec. Rate limited");
  // A tick writes the one text node that holds the words.
  expect(await page.evaluate(() => (window as unknown as Fixture).kindWrites())).toBe(1);
  expect(await host.announced()).toEqual(["Retrying, attempt 2"]);

  for (const text of ["in 2 sec", "in 1 sec"]) {
    await page.clock.runFor(1000);
    await expect(retrying(page)).toContainText(text);
  }
  await page.clock.runFor(1000);
  await expect(retrying(page)).toHaveText("Retrying, attempt 2 of 5. Rate limited");
  expect(await host.announced()).toEqual(["Retrying, attempt 2"]);
  expect(await content.boundingBox()).toEqual(box);
  await expect(retrying(page).locator("[aria-live], [role]")).toHaveCount(0);
});

test("an outcome takes the retrying line's place", async ({ page }) => {
  const host = await open(page);
  await host.status("error");
  await expect(retrying(page)).toBeHidden();
  await expect(answer(page).getByRole("button", { name: "Retry" })).toBeVisible();
  await host.retry(null);
  await host.status("streaming");
  await expect(retrying(page)).toBeHidden();
});

for (const scheme of ["light", "dark"] as const)
  test(`passes axe in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
