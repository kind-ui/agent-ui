import { expect, type Page, test } from "@playwright/test";

// Wave 7 spec §5: one line that names a turn's work and opens to the host's own rows.

const recordAnnouncements = (page: Page) =>
  page.addInitScript(() => {
    const announced: string[] = [];
    Object.assign(window, { kindAnnounced: announced });
    new MutationObserver((mutations) => {
      for (const { target } of mutations)
        if (target instanceof Element && target.closest("[data-ui-sdk-announcer]") && target.textContent)
          announced.push(target.textContent);
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });

const announced = (page: Page) =>
  page.evaluate(() => (window as unknown as { kindAnnounced: string[] }).kindAnnounced);

type Handle = {
  set(id: string, status: string): void;
  setAll(statuses: Record<string, string>): void;
  changes: { open: boolean; reason: string }[];
};
const live = (page: Page, run: (handle: Handle) => void) =>
  page.evaluate(
    (source) =>
      new Function("handle", `(${source})(handle)`)(
        (window as unknown as { kindStepGroup: Handle }).kindStepGroup,
      ),
    run.toString(),
  );

const trigger = (page: Page, id: string) =>
  page.locator(`#${id} > [data-step-part="trigger"], #${id} > * > [data-step-part="trigger"]`).first();

test("each state names the work and says its status in words", async ({ page }) => {
  await page.goto("/?c=step-group&case=all");
  const names: Record<string, string> = {
    "running-closed": "Running npm test, 3 of 5",
    "running-open": "Running npm test, 3 of 5",
    waiting: "Read package.json and build.ts, 1 waiting",
    done: "Read sign-in.ts, session.ts and ran npm test, 41 sec",
    "done-many": "Read 6 files, edited 2 files and 3 other steps, 1 min 12 sec",
    failed: "Read sign-in.ts, session.ts and ran npm test, 1 failed, 41 sec",
    stopped: "Read 3 files and edited sign-in.ts, Stopped after 41 sec",
    "turn-failed": "Searched the docs, Failed after 12 sec",
    agents: "Running 3 agents, 1 of 3",
    "agents-done": "Ran 3 agents, 1 failed, 2 min 4 sec",
  };
  for (const [id, name] of Object.entries(names)) {
    await expect(page.locator(`#${id}`).getByRole("button", { name, exact: true })).toBeVisible();
  }
  // Targets show as code, and the meta's separator is a dot.
  await expect(page.locator('#done [data-step-part="title"] code').first()).toHaveText("sign-in.ts");
  await expect(page.locator('#failed [data-step-part="meta"]').first()).toHaveText("1 failed · 41 sec");
  // A running group opens; one that starts closed, or finished, stays closed.
  await expect(trigger(page, "running-open")).toHaveAttribute("aria-expanded", "true");
  await expect(trigger(page, "running-closed")).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page, "done")).toHaveAttribute("aria-expanded", "false");
  // A waiting group is open, so the question shows.
  await expect(trigger(page, "waiting")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#waiting").getByRole("button", { name: "Approve" })).toBeVisible();
  // The group takes its most urgent child's status.
  await expect(page.locator('#failed [data-step-part="icon"]').first()).toHaveAttribute(
    "data-status",
    "error",
  );
  await expect(page.locator('#waiting [data-step-part="icon"]').first()).toHaveAttribute(
    "data-status",
    "awaiting-input",
  );
});

test("complete rows inside are quiet: a dot, not a check", async ({ page }) => {
  await page.goto("/?c=step-group&case=all");
  const mark = page
    .locator('#running-open [data-slot="kind-step-group-content"] [data-step-part="icon"]')
    .first();
  await expect(mark).toHaveAttribute("data-status", "complete");
  const after = await mark.evaluate((el) => getComputedStyle(el, "::after").opacity);
  expect(after).toBe("0");
  const groupMark = page.locator('#done [data-step-part="icon"]').first();
  expect(await groupMark.evaluate((el) => getComputedStyle(el, "::after").opacity)).toBe("1");
});

test("too few steps show flat, with no row of their own", async ({ page }) => {
  await page.goto("/?c=step-group&case=all");
  await expect(
    page.locator('#flat [data-slot="kind-step-group-trigger"], #flat > [data-step-part="trigger"]'),
  ).toBeHidden();
  await expect(page.locator("#flat").getByRole("button", { name: "Running npm test" })).toBeVisible();
});

test("a waiting step opens the group, even one a person closed; folded, it says Waiting for approval", async ({
  page,
}) => {
  await page.goto("/?c=step-group&case=live");
  const button = trigger(page, "live");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await live(page, (handle) => handle.set("writer", "awaiting-input"));
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(button).toHaveAccessibleName("Running 3 agents, 1 waiting");
  await button.click();
  await expect(button).toHaveAccessibleName("Running 3 agents, Waiting for approval");
});

test("it folds a second after finishing, but not while someone reads inside", async ({ page }) => {
  await recordAnnouncements(page);
  await page.goto("/?c=step-group&case=live");
  const button = trigger(page, "live");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  // Focus inside holds it open.
  await page.locator('#live [data-slot="kind-step-group-content"]').getByRole("button").first().focus();
  await live(page, (handle) => handle.setAll({ reviewer: "complete", writer: "error", docs: "complete" }));
  await expect(button).toHaveAccessibleName("Ran 3 agents, 1 failed, 2 min 4 sec");
  await expect.poll(() => announced(page)).toContain("3 agents finished, 1 failed");
  await page.waitForTimeout(1500);
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "After" }).focus();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  const changes = await page.evaluate(
    () => (window as unknown as { kindStepGroup: Handle }).kindStepGroup.changes,
  );
  expect(changes.at(-1)).toEqual({ open: false, reason: "auto" });
});

test("it doesn't fold once a person opened it", async ({ page }) => {
  await page.goto("/?c=step-group&case=live");
  const button = trigger(page, "live");
  await button.click();
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await live(page, (handle) => handle.setAll({ reviewer: "complete", writer: "complete", docs: "complete" }));
  await expect(button).toHaveAccessibleName("Ran 3 agents, 2 min 4 sec");
  await page.waitForTimeout(1500);
  await expect(button).toHaveAttribute("aria-expanded", "true");
});

test("Tool titles follow the call in words, and keep the tool's name where it's the identifier", async ({
  page,
}) => {
  await page.goto("/?c=step-group&case=titles");
  await expect(page.locator("#titled").getByRole("button").first()).toHaveText("Reading sign-in.ts");
  await expect(page.locator('#titled [data-step-part="title"] code')).toHaveText("sign-in.ts");
  await expect(page.locator("#titled-done").getByRole("button").first()).toHaveText("Read sign-in.ts");
  await expect(page.locator("#bare").getByRole("button").first()).toContainText("Search code");
  await expect(page.locator("#bare").getByRole("button", { name: "Copy search_code input" })).toBeAttached();
});
