import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: {
    calls: { cancel: number; retry: number };
    resolve(): void;
    reject(): void;
    set(id: string, options: Record<string, unknown>): void;
  };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const job = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  page.locator(`#${id} [data-slot="kind-job-progress-${name}"]`).first();
const cancel = (page: Page, id = "build") => job(page, id).getByRole("button", { name: "Cancel" });
const retry = (page: Page, id = "deploy") => job(page, id).getByRole("button", { name: "Retry" });
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.calls);
const set = (page: Page, id: string, options: Record<string, unknown>) =>
  page.evaluate(([i, o]) => (window as unknown as Fixture).kindHost.set(i, o), [id, options] as const);
const settle = (page: Page, outcome: "resolve" | "reject") =>
  page.evaluate((o) => (window as unknown as Fixture).kindHost[o](), outcome);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, ref: string, action: string) =>
  page.evaluate(
    ([r, a]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action] as const,
  );

const open = async (page: Page, name = "all") => {
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
  await page.goto(`/?c=job-progress&case=${name}`);
  await expect(part(page, "build", "title")).toHaveText("Build docs");
};

test("the progressbar reads its value and stage, and the meta the time elapsed and left", async ({
  page,
}) => {
  await open(page);
  const bar = job(page, "build").getByRole("progressbar");
  await expect(bar).toHaveAccessibleName("3 of 7: Installing dependencies");
  await expect(bar).toHaveAttribute("aria-valuenow", "42");
  await expect(part(page, "build", "meta")).toHaveText("2 min elapsed, about 1 min left");
  await expect(part(page, "deploy", "meta")).toHaveText("1 min 35 sec");
  await expect(job(page, "export").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  // Outside the content, so it shows while the job is closed.
  await expect(job(page, "deploy").getByRole("progressbar")).toBeVisible();
  await expect(part(page, "deploy", "content")).toBeHidden();
});

test("an indeterminate bar has no value, is named by the title, and sweeps only while running", async ({
  page,
}) => {
  await open(page);
  const bar = job(page, "sync").getByRole("progressbar");
  await expect(bar).toHaveAccessibleName("Sync search index");
  await expect(bar).not.toHaveAttribute("aria-valuenow");
  const sweeping = () =>
    job(page, "sync")
      .locator('[data-slot="progress-indicator"]')
      .evaluate((el) => el.getAnimations().length > 0);
  expect(await sweeping()).toBe(true);
  await set(page, "sync", { status: "awaiting-input" });
  await expect.poll(sweeping).toBe(false);
});

for (const [name, setup] of [
  ["motion reduced", (page: Page) => open(page, "reduced")],
  [
    "prefers-reduced-motion",
    async (page: Page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page);
    },
  ],
] as const) {
  test(`with ${name}, an indeterminate bar is still`, async ({ page }) => {
    await setup(page);
    const indicator = job(page, "sync").locator('[data-slot="progress-indicator"]');
    expect(await indicator.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await indicator.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(100);
  });
}

test("Enter on the trigger closes and opens the log, and Tab reaches Cancel", async ({ page }) => {
  await open(page);
  const trigger = part(page, "build", "trigger");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(job(page, "build").locator("pre")).toContainText("npm ci");
  await page.keyboard.press("Tab");
  await expect(cancel(page)).toBeFocused();
});

test("Cancel locks while pending, unlocks on a rejection, and leaves with focus on the trigger", async ({
  page,
}) => {
  await open(page);
  await cancel(page).dblclick();
  await expect(cancel(page)).toHaveAttribute("aria-disabled", "true");
  await expect(job(page, "build")).toHaveAttribute("aria-busy", "true");
  expect((await calls(page)).cancel).toBe(1);
  await settle(page, "reject");
  await expect(cancel(page)).not.toHaveAttribute("aria-disabled");
  await cancel(page).focus();
  await page.keyboard.press("Enter");
  expect((await calls(page)).cancel).toBe(2);
  await settle(page, "resolve");
  await set(page, "build", { status: "cancelled" });
  await expect(cancel(page)).toBeHidden();
  await expect(part(page, "build", "trigger")).toBeFocused();
});

test("Retry shows on a failed job, and a new status releases it", async ({ page }) => {
  await open(page);
  await expect(retry(page)).toBeVisible();
  await expect(cancel(page, "deploy")).toBeHidden();
  await expect(retry(page, "export")).toBeHidden();
  await expect(cancel(page, "sync")).toBeHidden();
  await retry(page).click();
  expect((await calls(page)).retry).toBe(1);
  await expect(retry(page)).toHaveAttribute("aria-disabled", "true");
  await set(page, "deploy", { status: "running" });
  await expect(retry(page)).toBeHidden();
  await set(page, "deploy", { status: "error" });
  await expect(retry(page)).not.toHaveAttribute("aria-disabled");
});

test("finishing is announced once", async ({ page }) => {
  await open(page);
  await set(page, "build", { status: "complete", durationSeconds: 130 });
  await expect.poll(() => announced(page)).toEqual(["Build docs complete"]);
  await expect(part(page, "build", "meta")).toHaveText("2 min 10 sec");
  await set(page, "build", { value: 1 });
  expect(await announced(page)).toEqual(["Build docs complete"]);
});

test("agent actions follow what a person could press, with no confirmation", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Build docs", ["cancel", "collapse", "expand", "press"]);
  await expectAgentActions(page, "Deploy preview", ["collapse", "expand", "press", "retry"]);
  await expectAgentActions(page, "Export data", ["collapse", "expand", "press"]);
  expect(await act(page, "Build docs", "cancel")).toContain('"ok":true');
  expect((await calls(page)).cancel).toBe(1);
  await expectAgentActions(page, "Build docs", ["collapse", "expand", "press"]);
});

test("without now, the elapsed time ticks in the browser", async ({ page }) => {
  await page.goto("/?c=job-progress&case=clock");
  const meta = part(page, "clock", "meta");
  await expect(meta).toHaveText(/^\d+ sec elapsed$/);
  const first = await meta.textContent();
  await expect.poll(() => meta.textContent(), { timeout: 3000 }).not.toBe(first);
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
