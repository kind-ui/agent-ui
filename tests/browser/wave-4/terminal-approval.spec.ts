import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Wave 7 spec §8: the approval lives in the command's own block.

type Decision = { choice: string; decision: unknown; source: string; resolve(): void; reject(): void };

type Fixture = {
  kindTerminal: { set(id: string, next: Record<string, unknown>): void };
  kindHost: { decisions: Decision[] };
  kindAnnounced: string[];
};

const terminal = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  terminal(page, id).locator(`[data-slot="kind-terminal-${name}"]`);
const choice = (page: Page, id: string, name: string) =>
  terminal(page, id).locator(`[data-slot="kind-confirmation-${name}"]`);
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTerminal.set(i, n), [id, next] as const);
const choices = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindHost.decisions.map(({ choice }) => choice));
const resolve = (page: Page, index: number) =>
  page.evaluate((i) => (window as unknown as Fixture).kindHost.decisions[i]?.resolve(), index);

test.beforeEach(async ({ page }) => {
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
});

test("a new request is announced as waiting on the person", async ({ page }) => {
  await expect(part(page, "running", "icon")).toHaveAttribute("data-status", "running");
  await set(page, "running", {
    approval: { approvalId: "running", generation: 2, state: "requested" },
    output: "",
  });
  await expect(part(page, "running", "meta")).toHaveText("Waiting for approval");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindAnnounced))
    .toContainEqual(expect.stringContaining("needs input"));
});

test("a waiting command asks in full, says it waits in words, and can't fold", async ({ page }) => {
  await expect(part(page, "waiting", "title")).toHaveText("Run npm test -- --run src/lib/auth?");
  await expect(part(page, "waiting", "title").locator("code")).toHaveText("npm test -- --run src/lib/auth");
  await expect(part(page, "waiting", "meta")).toHaveText("Waiting for approval");
  await expect(part(page, "waiting", "icon")).toHaveAttribute("data-status", "awaiting-input");
  await expect(terminal(page, "waiting").locator("button:visible")).toHaveText([
    /Run npm test/,
    "Deny",
    "Always allow npm test",
    "Run",
  ]);
  await expect(choice(page, "waiting", "detail")).toHaveText(
    "Covers commands starting with npm test, in this project.",
  );
  await expect(part(page, "waiting", "viewport")).toBeHidden();

  const trigger = part(page, "waiting", "trigger");
  await expect(trigger).toHaveAttribute("aria-disabled", "true");
  await trigger.press("Enter");
  await expect(terminal(page, "waiting")).toHaveAttribute("data-open", "");

  // Danger: the risk in words, a danger Run, and no Always allow.
  await expect(choice(page, "danger", "risk")).toHaveText("Deletes files outside the project.");
  await expect(choice(page, "danger", "always")).toBeHidden();
  await expect(choice(page, "danger", "approve")).toHaveAttribute("data-kind-button", "danger");

  expect(
    (await new AxeBuilder({ page }).include("#waiting").include("#danger").analyze()).violations,
  ).toEqual([]);
});

test("Run swaps the choices for the outcome in place, and the result goes in the header", async ({
  page,
}) => {
  await choice(page, "waiting", "approve").click();
  expect(await choices(page)).toEqual(["approve"]);
  await resolve(page, 0);
  await set(page, "waiting", {
    approval: { approvalId: "waiting", generation: 1, state: "responded", decision: { approved: true } },
  });

  await expect(part(page, "waiting", "title")).toHaveText("npm test -- --run src/lib/auth");
  await expect(part(page, "waiting", "icon")).toHaveAttribute("data-status", "running");
  await expect(part(page, "waiting", "trigger")).not.toHaveAttribute("aria-disabled");
  const outcome = choice(page, "waiting", "outcome");
  await expect(outcome).toHaveText("Approved");
  await expect(outcome).toBeFocused();
  // The viewport holds a line before any output, so the first one moves nothing.
  await expect(part(page, "waiting", "viewport")).toBeVisible();

  await set(page, "waiting", { output: "ok\n", exitCode: 1, durationSeconds: 6 });
  await expect(part(page, "waiting", "icon")).toHaveAttribute("data-status", "error");
  await expect(part(page, "waiting", "exit")).toHaveText("Exit 1");
  await expect(part(page, "waiting", "meta")).toHaveText("6 sec");
  await expect(outcome).toHaveText("Approved");
});

test("a command that never ran says why with its header mark, and its outcome in words", async ({ page }) => {
  await expect(part(page, "denied", "icon")).toHaveAttribute("data-status", "denied");
  await expect(choice(page, "denied", "outcome")).toHaveText("Denied: not outside the project");
  await expect(choice(page, "denied", "outcome-icon")).toBeHidden();
  await expect(part(page, "expired", "icon")).toHaveAttribute("data-status", "expired");
  await expect(choice(page, "expired", "outcome")).toHaveText("Expired before a decision");
  await expect(part(page, "expired", "meta")).toBeEmpty();

  // An approval keeps a quiet check; the always-allowed one keeps its scope after the run.
  await expect(choice(page, "always", "outcome-icon")).toBeVisible();
  await expect(choice(page, "always", "outcome")).toHaveText("Always allowed npm test in this project");
  await expect(part(page, "always", "meta")).toHaveText("6 sec");
});
