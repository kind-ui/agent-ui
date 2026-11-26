import { expect, type Page, test } from "@playwright/test";

// Wave 7 spec §10: "No update for 2 min" over a running state; the mark keeps running.

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
  await page.goto("/?c=stalled&case=all");
});

const meta = (page: Page, id: string) => page.locator(`#${id} [data-step-part="meta"]`);
const announced = (page: Page) =>
  page.evaluate(() => (window as unknown as { kindAnnounced: string[] }).kindAnnounced);

test("a running row reads its own meta until nothing arrives for stalledAfter, then No update for N min", async ({
  page,
}) => {
  await expect(meta(page, "stalled")).toHaveAttribute("data-stalled", "No update for 2 min");
  await expect(meta(page, "running")).not.toHaveAttribute("data-stalled");
  await expect(page.locator('#stalled [data-step-part="icon"]')).toHaveAttribute("data-status", "running");
  // The generated words join the trigger's name after the meta's own, which only collapse.
  await expect(page.locator("#stalled").getByRole("button")).toHaveAccessibleName(
    /^Searching the docs\s*3 min\s*No update for 2 min$/,
  );
  await expect(page.locator("#status")).toHaveText("Deploying to stagingNo update for 5 min");
  await expect(page.getByRole("status", { name: "Still working · no update for 2 min" })).toBeVisible();
  // Mounted stalled, so nothing was announced.
  expect(await announced(page)).toEqual([]);

  await page.evaluate(() =>
    (window as unknown as { kindStalled: { touch(id: string): void } }).kindStalled.touch("stalled"),
  );
  await expect(meta(page, "stalled")).not.toHaveAttribute("data-stalled");
  await expect(meta(page, "stalled")).toHaveText("3 min");
  await expect.poll(() => announced(page)).toEqual(["Working again"]);
});
