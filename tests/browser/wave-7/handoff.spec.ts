import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { decisions: { choice: string; decision: unknown; source: string }[] };
  kindHandoff: { set(id: string, next: Record<string, unknown>): void };
  kindAnnounced: string[];
};

const handoff = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  handoff(page, id).locator(`[data-slot="kind-handoff-${name}"]:not([hidden])`);
const choice = (page: Page, name: string) =>
  handoff(page, "billing").getByRole("button", { name, exact: true });
const decisions = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.decisions.map(({ choice, decision, source }) => ({
      choice,
      decision,
      source,
    })),
  );
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindHandoff.set(i, n), [id, next] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

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
  await page.goto("/?c=handoff&case=all");
  await expect(choice(page, "Approve")).toBeVisible();
};

test("the text and the status read in words, beside the mark", async ({ page }) => {
  await open(page);
  const billing = page.getByRole("group", { name: "Handoff to Billing" });
  await expect(billing).toHaveAttribute("data-status", "pending");
  await expect(part(page, "billing", "text")).toHaveText("Support handed off to Billing");
  await expect(part(page, "billing", "reason")).toHaveText("The customer asked for a refund");
  await expect(part(page, "billing", "status")).toHaveText("Waiting");
  await expect(part(page, "billing", "status-icon")).toHaveAttribute("data-status", "awaiting-input");
  for (const [id, words, mark] of [
    ["wait", "Waiting", "pending"],
    ["declined", "Declined", "cancelled"],
    ["done", "Done", "complete"],
  ] as const) {
    await expect(part(page, id, "status")).toHaveText(words);
    await expect(part(page, id, "status-icon")).toHaveAttribute("data-status", mark);
  }
  await expect(part(page, "declined", "text")).toHaveText("Billing handed off to Legal");
  // Both agents show an avatar, with the arrow between them.
  await expect(part(page, "billing", "from-avatar")).toHaveAttribute("aria-hidden", "true");
  await expect(part(page, "billing", "to-avatar")).toHaveText("B");
  await expect(part(page, "wait", "reason")).toHaveCount(0);
});

test("a handoff to a person names them in words and shows no avatar for them", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("group", { name: "Handoff to Dana Reyes" })).toBeVisible();
  await expect(part(page, "person", "text")).toHaveText("Support handed off to Dana Reyes");
  await expect(part(page, "person", "status")).toHaveText("Accepted");
  await expect(part(page, "person", "from-avatar")).toHaveCount(1);
  await expect(part(page, "person", "to-avatar")).toHaveCount(0);
  await expect(part(page, "done", "from-avatar")).toHaveCount(0);
  await expect(part(page, "done", "to-avatar")).toHaveCount(1);
});

test("the approval inside approves by keyboard, and its Confirmation is the handoff's agent actions", async ({
  page,
}) => {
  await open(page);
  const confirmation = handoff(page, "billing").getByRole("group", { name: "Let Billing take over?" });
  await expect(confirmation).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(confirmation.getByRole("button")).toHaveText(["Approve", "Always allow", "Deny"]);
  await expectAgentActions(page, "Let Billing take over?", ["approve", "alwaysAllow", "deny"]);
  await expectAgentActions(page, "Handoff to Billing", []);
  await choice(page, "Approve").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => decisions(page))
    .toEqual([{ choice: "approve", decision: { approvalId: "billing", generation: 1 }, source: "keyboard" }]);
});

test("the approval inside denies by keyboard", async ({ page }) => {
  await open(page);
  await choice(page, "Deny").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => decisions(page))
    .toEqual([{ choice: "deny", decision: { approvalId: "billing", generation: 1 }, source: "keyboard" }]);
});

test("accepting announces the handoff once; declining announces it too", async ({ page }) => {
  await open(page);
  await set(page, "wait", { status: "accepted" });
  await expect(part(page, "wait", "status")).toHaveText("Accepted");
  await expect.poll(() => announced(page)).toEqual(["Handed off to Research"]);
  await set(page, "wait", { status: "complete" });
  await set(page, "wait", { status: "accepted" });
  await expect(part(page, "wait", "status")).toHaveText("Accepted");
  await set(page, "billing", { status: "declined", approval: undefined });
  await expect(part(page, "billing", "status")).toHaveText("Declined");
  await expect.poll(() => announced(page)).toEqual(["Handed off to Research", "Billing declined"]);
  // One the page loaded with stays quiet.
  await set(page, "person", { status: "complete" });
  await expect(part(page, "person", "status")).toHaveText("Done");
  expect(await announced(page)).toEqual(["Handed off to Research", "Billing declined"]);
});

test("the arrow between the avatars points from one to the other in right-to-left text too", async ({
  page,
}) => {
  await open(page);
  const arrow = () =>
    part(page, "billing", "to-avatar").evaluate((el) => getComputedStyle(el, "::before").scale);
  expect(await arrow()).toBe("none");
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
  expect(await arrow()).toBe("-1 1");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
