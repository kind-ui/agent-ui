import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Decision = { choice: string; decision: unknown; source: string; resolve(): void; reject(): void };
type Fixture = {
  kindHost: { decisions: Decision[] };
  kindTerminal: { set(id: string, next: Record<string, unknown>): void };
  kindAnnounced: string[];
};

const terminal = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  terminal(page, id).locator(`[data-slot="kind-terminal-${name}"]:not([hidden])`);
const choice = (page: Page, id: string, name: string) =>
  terminal(page, id).getByRole("button", { name, exact: true });
const outcome = (page: Page, id: string) =>
  terminal(page, id).locator('[data-slot="kind-confirmation-outcome"]:not([hidden])');
const screen = (page: Page, id: string) => terminal(page, id).locator("[data-terminal-screen]");
const decisions = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.decisions.map(({ choice, decision, source }) => ({
      choice,
      decision,
      source,
    })),
  );
const settle = (page: Page, index: number) =>
  page.evaluate((i) => (window as unknown as Fixture).kindHost.decisions[i]?.resolve(), index);
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTerminal.set(i, n), [id, next] as const);
const responded = (id: string, approved: boolean, reason?: string) => ({
  approvalId: id,
  generation: 1,
  state: "responded",
  decision: { approved, ...(reason && { reason }) },
});

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
  await page.goto("/?c=terminal&case=approval");
  await expect(choice(page, "run", "Approve")).toBeVisible();
};

test("a command waiting on its approval shows the command and the host's choices, and no output", async ({
  page,
}) => {
  await open(page);
  await expect(part(page, "run", "title")).toHaveText("npm test");
  await expect(terminal(page, "run")).toHaveAttribute("data-status", "awaiting-input");
  const group = terminal(page, "run").getByRole("group", { name: "Run npm test?" });
  await expect(group).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(group.getByRole("button")).toHaveText(["Approve", "Always allow", "Deny"]);
  await expect(part(page, "run", "viewport")).toHaveCount(0);
  await expect(screen(page, "run")).toBeHidden();
  // Always allow only with its callback.
  await expect(choice(page, "plain", "Approve")).toBeVisible();
  await expect(choice(page, "plain", "Always allow")).toHaveCount(0);
  await expectAgentActions(page, "Run npm test?", ["approve", "alwaysAllow", "deny"]);
  await expectAgentActions(page, "Run rm -rf build?", ["approve", "deny"]);
});

test("Approve runs the command: its output shows after the outcome, and nothing above moves", async ({
  page,
}) => {
  await open(page);
  const above = await page.locator("#above").boundingBox();
  const top = await terminal(page, "run").boundingBox();
  await choice(page, "run", "Approve").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => decisions(page))
    .toEqual([{ choice: "approve", decision: { approvalId: "run", generation: 1 }, source: "keyboard" }]);
  await expect(choice(page, "run", "Always allow")).toHaveAttribute("aria-disabled", "true");
  await settle(page, 0);
  await set(page, "run", { approval: responded("run", true), output: "> agent-ui test\nok" });
  await expect(outcome(page, "run")).toHaveText("Approved");
  await expect(terminal(page, "run")).toHaveAttribute("data-status", "running");
  await expect(part(page, "run", "viewport")).toContainText("ok");
  const approval = await part(page, "run", "approval").boundingBox();
  const output = await part(page, "run", "viewport").boundingBox();
  expect(output?.y).toBeGreaterThanOrEqual((approval?.y ?? 0) + (approval?.height ?? 0) - 1);
  expect(await page.locator("#above").boundingBox()).toEqual(above);
  expect((await terminal(page, "run").boundingBox())?.y).toBe(top?.y);
});

test("Deny sends its reason and keeps the command with what was decided", async ({ page }) => {
  await open(page);
  await choice(page, "run", "Deny").click();
  const reason = terminal(page, "run").getByRole("textbox", { name: "Reason for denying" });
  await expect(reason).toBeFocused();
  await expect(choice(page, "run", "Always allow")).toHaveCount(0);
  await reason.fill("Not on main");
  await choice(page, "run", "Deny").click();
  await expect
    .poll(() => decisions(page))
    .toEqual([
      {
        choice: "deny",
        decision: { approvalId: "run", generation: 1, reason: "Not on main" },
        source: "mouse",
      },
    ]);
  await settle(page, 0);
  await set(page, "run", { approval: responded("run", false, "Not on main") });
  await expect(outcome(page, "run")).toHaveText(/Denied\s*Not on main/);
  await expect(part(page, "run", "title")).toHaveText("npm test");
  await expect(terminal(page, "run")).toHaveAttribute("data-status", "cancelled");
  await expect(screen(page, "run")).toBeHidden();
  // Confirmation announces the denial; the step stays quiet, so the two don't replace each other.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindAnnounced))
    .toEqual(["Denied"]);
});

test("Always allow approves with always: true, on a Terminal and on a Tool", async ({ page }) => {
  await open(page);
  await choice(page, "run", "Always allow").click();
  await choice(page, "tool", "Always allow").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => decisions(page))
    .toEqual([
      { choice: "always", decision: { approvalId: "run", generation: 1, always: true }, source: "mouse" },
      { choice: "always", decision: { approvalId: "t1", generation: 1, always: true }, source: "keyboard" },
    ]);
  // One lock for every choice.
  for (const name of ["Approve", "Always allow", "Deny"])
    await expect(choice(page, "run", name)).toHaveAttribute("aria-disabled", "true");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the approvals open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
