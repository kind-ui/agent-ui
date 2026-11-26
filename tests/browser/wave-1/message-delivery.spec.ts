import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Wave 7 spec §7: a user message that isn't with the agent yet, and a request that's retrying.

type Row = { delivery?: string; retry?: Record<string, unknown>; status?: string };
type Fixture = {
  kindDelivery: {
    calls: string[];
    set(id: string, row: Row): void;
    remove(id: string): void;
    settle(ok: boolean): void;
  };
  kindAnnounced: string[];
};

const fixture = <T>(page: Page, run: (host: Fixture) => T) =>
  page.evaluate(`(${run.toString()})(window)`) as Promise<Awaited<T>>;
const set = (page: Page, id: string, row: Row) =>
  page.evaluate(([i, r]) => (window as unknown as Fixture).kindDelivery.set(i, r), [id, row] as const);
const settle = (page: Page, ok: boolean) =>
  page.evaluate((value) => (window as unknown as Fixture).kindDelivery.settle(value), ok);
const calls = (page: Page) => fixture(page, (host) => host.kindDelivery.calls);
const announced = (page: Page) => fixture(page, (host) => host.kindAnnounced);
/** A part's visible words: web keeps parts that aren't shown, with `hidden`. */
const shown = { useInnerText: true };
const part = (page: Page, id: string, name: string) =>
  page.locator(`#${id} [data-slot="kind-message-${name}"]`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const announced: string[] = [];
    Object.assign(window, { kindAnnounced: announced });
    new MutationObserver((mutations) => {
      for (const { target } of mutations)
        if (target instanceof Element && target.closest("[data-ui-sdk-announcer]") && target.textContent)
          announced.push(target.textContent);
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.goto("/?c=message&case=delivery");
  await expect(part(page, "retrying", "retrying-text")).toHaveText(/attempt 2 of 5/);
});

test("the footer says where each message is, describes it, and offers Withdraw or Retry", async ({
  page,
}) => {
  await expect(part(page, "steering", "delivery")).toHaveText(/^Steering…\s*Withdraw$/, shown);
  await expect(part(page, "queued", "delivery")).toHaveText(/^Queued, not sent\s*Withdraw$/, shown);
  await expect(part(page, "not-sent", "delivery")).toHaveText(/^Not sent\s*Retry$/, shown);
  await expect(page.getByRole("article", { name: "Steering message" })).toHaveAccessibleDescription(
    "Steering…",
  );
  await expect(page.locator("#queued")).toHaveAttribute("data-delivery", "queued");
  // Withdraw meets the 24px target.
  const box = await part(page, "steering", "withdraw").boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(24);
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(
    (await new AxeBuilder({ page }).include("#steering").include("#not-sent").analyze()).violations,
  ).toEqual([]);
});

test("Withdraw locks, then gives the text back to the composer once it resolves", async ({ page }) => {
  const withdraw = part(page, "steering", "withdraw");
  await withdraw.click();
  await expect(withdraw).toHaveAttribute("aria-disabled", "true");
  expect(await calls(page)).toEqual(["withdraw:withdraw-press:mouse"]);
  await settle(page, true);
  const editor = page.getByRole("textbox", { name: "Prompt" });
  await expect(editor).toHaveText("Use the session table, not a cookie");
  await expect(editor).toBeFocused();
  await expect(withdraw).toHaveAttribute("aria-disabled", "true");
  await page.evaluate(() => (window as unknown as Fixture).kindDelivery.remove("steering"));
  await expect(page.locator("#steering")).toBeHidden();

  // A rejection keeps the message and offers Withdraw again.
  await part(page, "queued", "withdraw").click();
  await settle(page, false);
  await expect(part(page, "queued", "withdraw")).not.toHaveAttribute("aria-disabled");
  await expect(editor).toHaveText("Use the session table, not a cookie");
});

test("delivered, the footer is gone and nothing says it was steered", async ({ page }) => {
  await set(page, "steering", {});
  await expect(part(page, "steering", "delivery")).toBeHidden();
  await expect(page.locator("#steering")).not.toHaveAttribute("aria-describedby");
  await set(page, "queued", { delivery: "not-sent" });
  await expect(part(page, "queued", "delivery")).toHaveText(/^Not sent\s*Retry$/, shown);
  await expect.poll(() => announced(page)).toContain("Not sent");
});

test("retrying leads with the reason, counts down unannounced, and ends in Failed after N attempts", async ({
  page,
}) => {
  await expect(part(page, "retrying", "retrying")).toHaveText(
    /^Rate limited\. Retrying in \d sec, attempt 2 of 5\s*Retry now\s*Cancel$/,
    shown,
  );
  await expect(part(page, "retrying", "retrying")).toHaveRole("status");
  await part(page, "retrying", "retry-now").click();
  expect(await calls(page)).toEqual(["retry-now:retry-now-press:mouse"]);
  await settle(page, true);
  await expect(part(page, "retrying", "retry-now")).toHaveAttribute("aria-disabled", "true");
  await expect(part(page, "retrying", "cancel-retry")).toHaveAttribute("aria-disabled", "true");

  await set(page, "retrying", { status: "streaming", retry: { attempt: 3, maxAttempts: 5 } });
  await expect(part(page, "retrying", "retrying")).toHaveText(
    /^Retrying, attempt 3 of 5\s*Retry now\s*Cancel$/,
    shown,
  );
  await expect(part(page, "retrying", "retry-now")).not.toHaveAttribute("aria-disabled");
  await expect.poll(() => announced(page)).toContain("Retrying, attempt 3");

  await part(page, "retrying", "retry-now").focus();
  await set(page, "retrying", { status: "error", retry: { attempt: 5, maxAttempts: 5 } });
  await expect(part(page, "retrying", "retrying")).toBeHidden();
  await expect(part(page, "retrying", "outcome")).toHaveText(/^Failed after 5 attempts\s*Retry$/, shown);
  await expect(page.locator("#retrying").getByRole("button", { name: "Retry", exact: true })).toBeFocused();
  await expect.poll(() => announced(page)).toContain("Failed after 5 attempts");
  expect((await announced(page)).some((text) => /sec/.test(text))).toBe(false);
});
