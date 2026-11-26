import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { scheduleNow } from "../../../packages/agent-ui/tests/fixtures/shared/schedule-card.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindHost: {
    calls: { action: string; value?: unknown; reason: string; source?: string }[];
    resolve(): void;
    reject(): void;
  };
  kindAnnounced: string[];
  kindServerMarkup?: string;
  kindHydrationErrors?: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const card = (page: Page) => page.locator("#schedule");
const toggle = (page: Page) => card(page).getByRole("switch", { name: "Enabled" });
const runNow = (page: Page) => card(page).getByRole("button", { name: /^(Run now|Starting)$/ });
const next = (page: Page) => card(page).locator('[data-schedule-card-part="next"]');
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.calls);
const settle = (page: Page, how: "resolve" | "reject") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), how);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string, ...args: unknown[]) =>
  page.evaluate(
    ([action, args]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Daily triage", action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, args] as const,
  );

const load = async (page: Page, name = "all", time = scheduleNow, paused = false) => {
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
  // Paused, the countdown moves only as a spec runs the clock.
  await page.clock.install({ time: new Date(Date.parse(time) - (paused ? 1000 : 0)) });
  if (paused) await page.clock.pauseAt(new Date(time));
  await page.goto(`/?c=schedule-card&case=${name}`);
};

test("a group named by its label shows its schedule, next run and last run", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("group", { name: "Daily triage" })).toBeVisible();
  await expect(card(page)).toContainText("Weekdays at 9:00");
  await expect(next(page)).toHaveText("Next run Nov 26, 9:00 AM");
  const last = card(page).getByRole("link", { name: "Last run succeeded 9:00 AM" });
  await expect(last).toHaveAttribute("href", "#runs/41");
  await expect(card(page).locator('[data-status-mark][data-status="complete"]')).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
  await expect(card(page).getByRole("button", { name: "Edit schedule" })).toBeVisible();
});

test("an unsafe last run link reads as text, and a schedule without runs says so", async ({ page }) => {
  await load(page, "unsafe");
  await expect(card(page).getByRole("link")).toHaveCount(0);
  await expect(card(page)).toContainText("Last run succeeded 9:00 AM");
  await load(page, "new");
  await expect(next(page)).toHaveText("Not scheduled");
  await expect(card(page).locator('[data-schedule-card-part="last"]')).toBeHidden();
});

test("Space turns the switch off, the host takes it, and Next run reads Paused", async ({ page }) => {
  await load(page);
  await toggle(page).focus();
  await page.keyboard.press("Space");
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  await expect(next(page)).toHaveText("Paused");
  expect(await calls(page)).toEqual([
    { action: "enabled", value: false, reason: "switch-press", source: "keyboard" },
  ]);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
  await expect(next(page)).toHaveText("Next run Nov 26, 9:00 AM");
});

test("a change the host doesn't take leaves the switch as it was", async ({ page }) => {
  await load(page, "refusing");
  await toggle(page).click();
  expect(await calls(page)).toEqual([
    { action: "enabled", value: false, reason: "switch-press", source: "mouse" },
  ]);
  await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
  // The words beside the switch name it, and pressing them turns it too.
  await card(page).getByText("Enabled", { exact: true }).click();
  await expect.poll(() => calls(page).then((list) => list.length)).toBe(2);
  await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
});

test("Run now locks until its promise settles, and a failure is announced", async ({ page }) => {
  await load(page);
  await runNow(page).click();
  await expect(runNow(page)).toHaveText("Starting");
  await expect(runNow(page)).toHaveAttribute("aria-disabled", "true");
  await runNow(page).click({ force: true });
  expect(await calls(page)).toEqual([{ action: "runNow", reason: "run-now-press", source: "mouse" }]);
  await settle(page, "resolve");
  await expect(runNow(page)).toHaveText("Run now");
  await expect(runNow(page)).not.toHaveAttribute("aria-disabled");
  await runNow(page).click();
  await settle(page, "reject");
  await expect(runNow(page)).toHaveText("Run now");
  await expect.poll(() => announced(page)).toContain("Run didn't start");
});

test("Edit reports the schedule's id", async ({ page }) => {
  await load(page);
  await card(page).getByRole("button", { name: "Edit schedule" }).press("Enter");
  expect(await calls(page)).toEqual([
    { action: "edit", value: "triage", reason: "edit-press", source: "keyboard" },
  ]);
});

test("within the hour Next run counts down, and the count is never announced", async ({ page }) => {
  await load(page, "soon", scheduleNow, true);
  await expect(next(page)).toHaveText("Next run in 30 min");
  await page.clock.runFor(5_000);
  await expect(next(page)).toHaveText("Next run in 29 min 55 sec");
  expect((await announced(page)).filter((text) => text.includes("min"))).toEqual([]);
});

test("server markup shows the full date and hydrates into today's words without an error", async ({
  page,
}, testInfo) => {
  test.skip(
    layerOf(testInfo) !== "react",
    "React renders server markup here; the other layers' ?ssr pages cover theirs",
  );
  await load(page, "hydrate", "2026-11-26T07:00:00Z");
  await expect(page.locator('#hydrated [data-schedule-card-part="next"]')).toHaveText("Next run 9:00 AM");
  const { kindServerMarkup, kindHydrationErrors } = await page.evaluate(() => {
    const { kindServerMarkup, kindHydrationErrors } = window as unknown as Fixture;
    return { kindServerMarkup, kindHydrationErrors };
  });
  expect(kindServerMarkup).toContain("Next run Nov 26, 2026, 9:00 AM");
  expect(kindHydrationErrors).toEqual([]);
});

test("agents get setEnabled, runNow and edit, each needing a person", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page);
  await expect(card(page)).toHaveAttribute("data-agent-confirm", /.+/);
  await expectAgentActions(page, "Daily triage", ["setEnabled", "runNow", "edit"]);
  expect(await act(page, "runNow")).toContain("Needs a person");
  expect(await calls(page)).toEqual([]);
});

test("with agentConfirm off an agent turns the schedule off and runs it", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page, "unconfirmed");
  await expect(card(page)).not.toHaveAttribute("data-agent-confirm");
  expect(await act(page, "setEnabled", false)).toContain('"ok":true');
  await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  expect(await act(page, "runNow")).toContain('"ok":true');
  await expectAgentActions(page, "Daily triage", ["setEnabled", "edit"]);
  expect(await calls(page)).toEqual([
    { action: "enabled", value: false, reason: "imperative", source: "agent" },
    { action: "runNow", reason: "imperative", source: "agent" },
  ]);
});

test("without callbacks it offers only setEnabled", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page, "bare");
  await expect(runNow(page)).toHaveCount(0);
  await expect(card(page).getByRole("button", { name: "Edit schedule" })).toHaveCount(0);
  await expectAgentActions(page, "Daily triage", ["setEnabled"]);
});

for (const scheme of ["light", "dark"] as const)
  test(`has no axe violations in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page, "paused");
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await expect(next(page)).toHaveText("Paused");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
