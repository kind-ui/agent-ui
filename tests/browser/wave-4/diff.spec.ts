import { expect, type Page, test } from "@playwright/test";

// Wave 7 spec §4: one component for one file or a run's changes. Keep and Undo judge edits already applied.

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
  calls: { action: string; path?: string; change?: number; reason: string; source: string }[];
  resolve(): void;
  reject(): void;
  decide(path: string, decision: string, change?: number): void;
  opens: { open: string[]; reason: string }[];
};
const host = <T>(page: Page, run: (handle: Handle) => T) =>
  page.evaluate(
    (source) =>
      new Function("handle", `return (${source})(handle)`)(
        (window as unknown as { kindDiff: Handle }).kindDiff,
      ) as T,
    run.toString(),
  );

const SIGN_IN = "src/lib/auth/sign-in.ts";
const SESSION = "src/lib/auth/session.ts";

test("the summary, file rows and change headers say what changed in words", async ({ page }) => {
  await page.goto("/?c=diff&case=all");
  const ready = page.locator("#ready");
  await expect(ready).toHaveRole("region");
  await expect(ready).toHaveAccessibleName("Changes");
  await expect(ready.getByRole("heading", { level: 3 })).toHaveText("4 files changed");
  await expect(ready.locator('[data-slot="kind-diff-summary-counts"]')).toContainText(
    "119 additions, 8 deletions",
  );
  await expect(ready.getByRole("button", { name: `${SIGN_IN} 3 additions, 2 deletions` })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(ready.getByRole("button", { name: `${SESSION} Added 38 additions` })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(ready.getByText("from src/lib/crypto/password.ts")).toBeAttached();
  // Change headers read in words, never `@@`.
  await expect(ready.getByRole("row", { name: /Change 1 of 2 · line 18/ })).toBeVisible();
  // Column headers for screen readers, and lines as `ins` and `del` with hidden words.
  await expect(ready.getByRole("columnheader")).toHaveText(["Old line", "New line", "Change", "Code"]);
  await expect(ready.locator("ins").first()).toBeVisible();
  await expect(
    ready
      .locator('[data-slot="kind-diff-code"]')
      .filter({ has: page.locator("del") })
      .first(),
  ).toContainText("Removed:");
  // Numbers and signs come from attributes, so a copy holds only code.
  const number = ready.locator('[data-slot="kind-diff-new-number"][data-line="19"]').first();
  await expect(number).toHaveText("");
  await expect(
    ready.getByRole("button", { name: "Show 17 lines, unchanged lines before change 1" }),
  ).toBeVisible();

  const partly = page.locator("#partly");
  await expect(partly.locator('[data-slot="kind-diff-summary-progress"]')).toHaveText("1 of 4 reviewed");
  await expect(partly.locator('[data-slot="kind-diff-change-outcome"]').first()).toHaveText("Undone");
  await expect(partly.locator('[data-slot="kind-diff-line"][data-undone]').first()).toBeAttached();
  await expect(partly.locator('[data-slot="kind-diff-file-outcome"]:visible').first()).toHaveText("Kept");

  const reviewed = page.locator("#reviewed");
  await expect(reviewed.getByRole("heading")).toHaveText("All changes reviewed");
  await expect(reviewed.locator('[data-slot="kind-diff-summary-outcome"]')).toHaveText("3 kept, 1 undone");
  await expect(reviewed.getByRole("button", { name: "Keep all" })).toHaveCount(0);

  const streaming = page.locator("#streaming");
  await expect(streaming.getByRole("heading")).toHaveText("Editing 2 files");
  await expect(streaming.getByRole("button", { name: /^Keep/ })).toHaveCount(0);
  await expect(streaming.locator('[data-slot="kind-diff-file-mark"][data-status="running"]')).toBeVisible();

  // One file: no summary, and the region is named by its path.
  await expect(page.locator("#single")).toHaveAccessibleName("package.json");
  await expect(page.locator('#single [data-slot="kind-diff-summary"]')).toBeHidden();
  await expect(page.locator("#binary").getByText("Binary file, not shown")).toBeVisible();
});

test("Keep shows Keeping… in place, locks until the host decides, then says Kept and keeps focus", async ({
  page,
}) => {
  await recordAnnouncements(page);
  await page.goto("/?c=diff&case=live");
  const keep = page.getByRole("button", { name: `Keep ${SESSION}` });
  await keep.focus();
  await page.keyboard.press("Enter");
  const outcome = page.locator('[data-slot="kind-diff-file-outcome"]').filter({ hasText: "Keeping…" });
  await expect(outcome).toBeFocused();
  expect(await host(page, (handle) => handle.calls)).toEqual([
    { action: "keep", path: SESSION, reason: "keep-press", source: "keyboard" },
  ]);
  // Resolved, it stays locked until the host reports the decision.
  await host(page, (handle) => handle.resolve());
  await expect(outcome).toHaveText("Keeping…");
  await host(page, (handle) => handle.decide("src/lib/auth/session.ts", "kept"));
  await expect(
    page.locator('[data-slot="kind-diff-file-outcome"]').filter({ hasText: "Kept" }),
  ).toBeFocused();
  await expect(page.locator('[data-slot="kind-diff-summary-progress"]')).toHaveText("1 of 4 reviewed");
  await expect.poll(() => announced(page)).toContain("Kept session.ts");
});

test("a failed Undo says so beside the row's buttons, which stay", async ({ page }) => {
  await page.goto("/?c=diff&case=live");
  await page.getByRole("button", { name: `Undo ${SESSION}` }).click();
  await host(page, (handle) => handle.reject());
  await expect(page.locator('[data-slot="kind-diff-file-error"]:not([hidden])')).toHaveText(
    "Couldn't undo session.ts",
  );
  await expect(page.getByRole("button", { name: `Undo ${SESSION}` })).toBeAttached();
});

test("a change has its own Keep and Undo, and an undone change dims in place", async ({ page }) => {
  await page.goto("/?c=diff&case=live");
  const header = page.getByRole("row", { name: /Change 2 of 2/ });
  await header.hover();
  await header.getByRole("button", { name: "Undo change 2" }).click();
  expect(await host(page, (handle) => handle.calls.at(-1))).toMatchObject({
    action: "undo",
    path: SIGN_IN,
    change: 1,
  });
  await host(page, (handle) => {
    handle.resolve();
    handle.decide("src/lib/auth/sign-in.ts", "undone", 1);
  });
  await expect(header.locator('[data-slot="kind-diff-change-outcome"]')).toHaveText("Undone");
  await expect(page.locator('[data-slot="kind-diff-line"][data-undone]').first()).toBeAttached();
});

test("Undo all asks first, in place, and Cancel takes focus", async ({ page }) => {
  await page.goto("/?c=diff&case=live");
  await page.getByRole("button", { name: "Undo all" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Undo all 4 files?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  expect(await host(page, (handle) => handle.calls.length)).toBe(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Undo all" })).toBeFocused();

  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Undo all" }).last().click();
  expect(await host(page, (handle) => handle.calls)).toEqual([
    { action: "undo", reason: "undo-press", source: "mouse" },
  ]);
  await expect(page.locator('[data-slot="kind-diff-undo-all-confirm"]')).toHaveAttribute("data-pending", "");
  await expect(
    page.locator('[data-slot="kind-diff-file-outcome"]').filter({ hasText: "Undoing…" }),
  ).toHaveCount(4);
  await host(page, (handle) => {
    handle.resolve();
    for (const path of [
      "src/lib/auth/sign-in.ts",
      "src/lib/auth/session.ts",
      "src/routes/(app)/settings/security/page.tsx",
      "src/lib/auth/password.ts",
    ])
      handle.decide(path, "undone");
  });
  await expect(page.getByRole("heading")).toHaveText("All changes reviewed");
  await expect(page.locator('[data-slot="kind-diff-summary-outcome"]')).toHaveText("4 undone");
  await expect(page.locator('[data-slot="kind-diff-summary-outcome"]')).toBeFocused();
});

test("file rows are one roving group; K keeps and U undoes the focused row", async ({ page }) => {
  await page.goto("/?c=diff&case=live");
  const first = page.getByRole("button", { name: new RegExp(`^${SIGN_IN}`) });
  await first.focus();
  await page.keyboard.press("ArrowDown");
  const second = page.getByRole("button", { name: new RegExp(`^${SESSION}`) });
  await expect(second).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: /^src\/lib\/auth\/password\.ts/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  expect(await host(page, (handle) => handle.opens.at(-1))).toEqual({ open: [], reason: "trigger-press" });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("k");
  expect(await host(page, (handle) => handle.calls.at(-1))).toMatchObject({
    action: "keep",
    path: SESSION,
    reason: "shortcut",
  });
});

test("Show 17 lines opens a collapsed run below it, and find in page opens it too", async ({ page }) => {
  await page.goto("/?c=diff&case=live");
  const lines = page.locator('[data-slot="kind-diff-line"]');
  const before = await lines.count();
  await page.getByRole("button", { name: /^Show 17 lines/ }).click();
  await expect(lines).toHaveCount(before + 16);
  await expect(page.locator('[data-slot="kind-diff-new-number"][data-line="1"]').first()).toBeVisible();
});

test("a streamed patch follows its end and waits for the counts and decisions", async ({ page }) => {
  await page.goto("/?c=diff&case=stream");
  await expect(page.getByRole("heading")).toHaveText("Editing 2 files");
  await expect(page.getByRole("button", { name: "Keep all" })).toHaveCount(0);
  const rows = page.locator('[data-slot="kind-diff-file"]').nth(1).locator('[data-slot="kind-diff-line"]');
  await expect(rows).toHaveCount(4);
  await host(page, (handle) =>
    (handle as unknown as { setFiles(files: unknown[]): void }).setFiles([
      { path: "src/lib/auth/sign-in.ts", before: "a\n", after: "b\n" },
      {
        path: "src/lib/auth/session.ts",
        status: "added",
        patch: `--- /dev/null\n+++ b/src/lib/auth/session.ts\n@@ -0,0 +1,3 @@\n+a\n+b\n+c\n`,
      },
    ]),
  );
  await expect(page.getByRole("heading")).toHaveText("2 files changed");
  await expect(page.getByRole("button", { name: "Keep all" })).toBeVisible();
});

test("at 390 px Keep and Undo are icon buttons named by the path, and paths lose their start", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/?c=diff&case=live");
  const keep = page.getByRole("button", { name: "Keep src/routes/(app)/settings/security/page.tsx" });
  await expect(keep).toBeVisible();
  const box = await keep.boundingBox();
  expect(box?.width).toBeLessThan(40);
  const path = page.locator('[data-slot="kind-diff-file-path"]').nth(2);
  expect(await path.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await path.evaluate((el) => getComputedStyle(el).direction)).toBe("rtl");
});
