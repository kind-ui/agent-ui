import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// A sheet's drag runs on scroll-driven animations, which never finish, so only time-driven ones count.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document
        .getAnimations()
        .every(
          (animation) =>
            !(animation.timeline instanceof DocumentTimeline) || animation.playState !== "running",
        ),
  );

const send = (page: Page) => page.getByRole("button", { name: "Send" });
const triggers = (page: Page) => ({
  add: page.getByRole("button", { name: "Add", exact: true }),
  model: page.getByRole("button", { name: /^Model, Claude Opus 5.5/ }),
  approval: page.getByRole("button", { name: /^Approvals?, Ask every time/ }),
  settings: page.getByRole("button", { name: "Settings", exact: true }),
});

const load = async (page: Page, query = "") => {
  await page.goto(`/?c=full-composer&case=all${query}`);
  await expect(send(page)).toBeVisible();
  await settled(page);
};

// Overflow anywhere on the page, or inside the composer's grid.
const overflow = (page: Page) =>
  page.evaluate(() => {
    const dropzone = document.querySelector('[data-slot="file-input-dropzone"]') as HTMLElement;
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      composer: dropzone.scrollWidth - dropzone.clientWidth,
    };
  });

test.use({ hasTouch: true, isMobile: true });

for (const width of [390, 320])
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("nothing overflows, labelled triggers show their icon and keep their names, and Send ends the row", async ({
      page,
    }) => {
      await load(page);
      expect(await overflow(page)).toEqual({ page: 0, composer: 0 });
      const { model, approval } = triggers(page);
      await expect(approval).toBeVisible();
      await expect(approval.locator("[data-approval-mode-value]")).toBeHidden();
      await expect(model).toBeVisible();
      await expect(model.locator("[data-model-control-model]")).toBeHidden();
      for (const trigger of [model, approval])
        expect(await trigger.evaluate((el) => el.getBoundingClientRect().width)).toBe(32);
      const ends = await page.evaluate(() => {
        const dropzone = document.querySelector('[data-slot="file-input-dropzone"]') as HTMLElement;
        const button = document.querySelector('button[data-slot="kind-composer-submit"]') as HTMLElement;
        const box = dropzone.getBoundingClientRect();
        const style = getComputedStyle(dropzone);
        return {
          gap: box.right - Number.parseFloat(style.paddingRight) - button.getBoundingClientRect().right,
          bottom: box.bottom - Number.parseFloat(style.paddingBottom) - button.getBoundingClientRect().bottom,
        };
      });
      expect(ends).toEqual({ gap: 0, bottom: 0 });
    });

    test("every control opens a sheet that fits the screen", async ({ page }) => {
      await load(page);
      const { add, model, approval, settings } = triggers(page);
      for (const trigger of [
        add,
        model,
        approval,
        settings,
        page.getByRole("button", { name: /^\d+ more/ }),
      ]) {
        await trigger.click();
        const sheet = page.locator('[data-presentation="sheet"]:visible').first();
        await expect(sheet).toBeVisible();
        await settled(page);
        const box = await sheet.boundingBox();
        expect(box && box.x >= 0 && box.x + box.width <= width).toBe(true);
        expect((await overflow(page)).page).toBe(0);
        await page.keyboard.press("Escape");
        await expect(sheet).toBeHidden();
      }
    });
  });

test("a risky mode keeps its shield and warning mark whole at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await load(page);
  await triggers(page).approval.click();
  await page.getByRole("menuitemradio", { name: /^Full access/ }).click();
  const risky = page.getByRole("button", { name: /^Approvals?, Full access/ });
  await expect(risky).toBeVisible();
  expect(
    await risky.locator("[data-menu-trigger-icon]").evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(16);
  expect(await overflow(page)).toEqual({ page: 0, composer: 0 });
});

test("Discard, the mic and Send share the row; dictating hides Draft restored and moves nothing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "kind-drafts",
      JSON.stringify({ "chat-1": { text: "Fix the retry loop", tokens: [] } }),
    ),
  );
  await load(page, "&draft");
  const discard = page.getByRole("button", { name: "Discard" });
  const mic = page.locator('[data-dictation-part="start"]');
  await expect(discard).toBeVisible();
  const rect = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const { left, right, top } = el.getBoundingClientRect();
        return { left, right, top };
      });
  const before = {
    discard: await rect('[data-slot="kind-composer-discard"]'),
    mic: await rect('[data-dictation-part="start"]'),
    send: await rect('button[data-slot="kind-composer-submit"]'),
    controls: await rect('[data-menu-part="root"]'),
    composer: await page.locator('[data-slot="kind-composer"]').boundingBox(),
  };
  expect(before.discard.right).toBeLessThanOrEqual(before.mic.left);
  expect(before.mic.right).toBeLessThanOrEqual(before.send.left);
  await mic.click();
  await expect(page.locator('[data-dictation-part="stop"]')).toBeVisible();
  await expect(page.locator('[data-slot="kind-composer-restored"]')).toHaveCSS("visibility", "hidden");
  expect(await rect('button[data-slot="kind-composer-submit"]')).toEqual(before.send);
  expect(await rect('[data-menu-part="root"]')).toEqual(before.controls);
  expect(await page.locator('[data-slot="kind-composer"]').boundingBox()).toEqual(before.composer);
  expect((await rect('[data-dictation-part="stop"]')).right).toBeLessThanOrEqual(before.send.left);
  expect(await overflow(page)).toEqual({ page: 0, composer: 0 });
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes at 390px with a sheet open, ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await load(page);
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
    await triggers(page).settings.click();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
  });
