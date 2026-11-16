import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { restores: { source: string; resolve(): void; reject(): void }[]; permit: boolean };
  kindCheckpoint: { restore(restored: boolean): void };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const checkpoint = (page: Page) => page.locator("#checkpoint");
const trigger = (page: Page) => checkpoint(page).getByRole("button", { name: "Restore checkpoint" });
// Firefox crashes running axe after a role query on these triggers (web decisions.md), so axe tests use this.
const triggerButton = (page: Page) => checkpoint(page).locator("[data-checkpoint-trigger]");
const dialog = (page: Page) => page.getByRole("alertdialog", { name: "Restore this checkpoint?" });
const confirm = (page: Page) => dialog(page).getByRole("button", { name: "Restore" });
const cancel = (page: Page) => dialog(page).getByRole("button", { name: "Cancel" });
const part = (page: Page, name: string) =>
  checkpoint(page).locator(`[data-slot="kind-checkpoint-${name}"]:not([hidden])`);
const restores = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindHost.restores.map(({ source }) => source));
const settle = (page: Page, index: number, outcome: "resolve" | "reject") =>
  page.evaluate(([i, o]) => (window as unknown as Fixture).kindHost.restores[i]?.[o](), [
    index,
    outcome,
  ] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string) =>
  page.evaluate(
    (a) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Checkpoint", action: a, args: [] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    action,
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
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
  await page.goto(`/?c=checkpoint&case=${name}`);
  await expect(triggerButton(page)).toBeVisible();
};

test("a group named by its label, with its description and Restore", async ({ page }) => {
  await open(page);
  const group = page.getByRole("group", { name: "Checkpoint" });
  await expect(group).toBeVisible();
  await expect(group).toHaveAccessibleDescription("Before editing auth.ts");
  await expect(group).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(part(page, "line")).toHaveAttribute("aria-hidden", "true");
});

test("Restore asks first, starting on Cancel, and Escape and Cancel close without restoring", async ({
  page,
}) => {
  await open(page);
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toHaveAccessibleDescription("Changes after it will be discarded.");
  await expect(cancel(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(cancel(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await restores(page)).toEqual([]);
});

test("a restore that rejects keeps the dialog open with the error, then works again", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await confirm(page).click();
  await expect(confirm(page)).toHaveAttribute("aria-disabled", "true");
  await expect(cancel(page)).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await cancel(page).evaluate((button) => (button as HTMLElement).click());
  await expect(dialog(page)).toBeVisible();
  await settle(page, 0, "reject");
  await expect(dialog(page).getByText("Couldn't restore. Try again.")).toBeVisible();
  await expect(confirm(page)).not.toHaveAttribute("aria-disabled");
  await expect.poll(() => announced(page)).toContain("Checkpoint not restored");
  await confirm(page).click();
  await expect(dialog(page).getByText("Couldn't restore. Try again.")).toBeHidden();
  await settle(page, 1, "resolve");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await restores(page)).toEqual(["mouse", "mouse"]);
});

test("a double press on the dialog's Restore calls the host once", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await confirm(page).evaluate((button: HTMLElement) => {
    button.click();
    button.click();
  });
  expect(await restores(page)).toHaveLength(1);
});

test("restored swaps Restore for Restored in place, and focus follows", async ({ page }) => {
  await open(page);
  const boxes = () =>
    page.evaluate(() =>
      ["above", "checkpoint", "below"].map((id) =>
        document.getElementById(id)?.getBoundingClientRect().toJSON(),
      ),
    );
  const before = await boxes();
  await trigger(page).click();
  await confirm(page).click();
  await settle(page, 0, "resolve");
  await expect(trigger(page)).toBeFocused();
  await page.evaluate(() => (window as unknown as Fixture).kindCheckpoint.restore(true));
  await expect(part(page, "restored")).toHaveText("Restored");
  await expect(part(page, "restored")).toBeFocused();
  await expect(trigger(page)).toHaveCount(0);
  expect(await boxes()).toEqual(before);
  await expect.poll(() => announced(page)).toContain("Checkpoint restored");
});

test("restored while the dialog is open closes it and frees the page", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await confirm(page).click();
  await page.evaluate(() => (window as unknown as Fixture).kindCheckpoint.restore(true));
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator("[inert]")).toHaveCount(0);
  await expect(part(page, "restored")).toBeVisible();
  await settle(page, 0, "resolve");
  await page.evaluate(() => (window as unknown as Fixture).kindCheckpoint.restore(false));
  await expect(trigger(page)).toBeVisible();
  await expect(dialog(page)).toBeHidden();
});

test("an agent pressing the dialog's Restore needs a person", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(confirm(page)).toHaveAttribute("data-agent-confirm", /.+/);
});

test("an agent's restore needs a person, then opens the dialog and restores nothing (D7)", async ({
  page,
}) => {
  await open(page);
  // The bridge adds its generic `press` to any component holding a button.
  await expectAgentActions(page, "Checkpoint", ["restore", "press"]);
  expect(await act(page, "restore")).toContain("The person said no");
  await expect(dialog(page)).toBeHidden();
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.permit = true;
  });
  expect(await act(page, "restore")).toContain('"ok":true');
  await expect(dialog(page)).toBeVisible();
  await expect(cancel(page)).toBeFocused();
  expect(await restores(page)).toEqual([]);
  await expectAgentActions(page, "Checkpoint", ["press"]);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expectAgentActions(page, "Checkpoint", ["restore", "press"]);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the dialog only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, fixture);
    await trigger(page).click();
    const content = page.locator('[data-slot="alert-dialog-content"]');
    await expect(content).toBeVisible();
    const transition = await content.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        property: style.transitionProperty,
        duration: style.transitionDuration,
        translate: style.translate,
      };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s", translate: "none" });
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the dialog open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const before = await new AxeBuilder({ page }).include("#root").analyze();
    expect(before.violations).toEqual([]);
    await triggerButton(page).click();
    await expect(page.locator('[data-slot="alert-dialog-content"]')).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
