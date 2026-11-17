import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindAction: { set(next: Record<string, string | boolean | undefined>): void; append(chunk: string): void };
  kindHost: { openings: unknown[][] };
};

const action = (page: Page) => page.locator("#action");
const trigger = (page: Page) => action(page).getByRole("button", { name: "Explain" });
const content = (page: Page) => action(page).locator('[data-slot="kind-action-content"]');
const result = (page: Page) => action(page).locator('[data-slot="kind-action-result"]');
const set = (page: Page, next: Record<string, string | boolean | undefined>) =>
  page.evaluate((n) => (window as unknown as Fixture).kindAction.set(n), next);
const append = (page: Page, chunk: string) =>
  page.evaluate((c) => (window as unknown as Fixture).kindAction.append(c), chunk);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=action&case=${name}`);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
};

test("streams its result under the quote and collapses to its header on completion", async ({ page }) => {
  await open(page);
  // The fixture's quote ends in "\n\n", as a triple-click selection does.
  expect(
    await action(page)
      .locator("blockquote")
      .evaluate((el) => el.textContent),
  ).toBe("Rate limits reset every hour.");
  await append(page, "The limit **resets**");
  await expect(result(page).locator("strong")).toHaveText("resets");
  await append(page, " on the hour.\n\nRequests after that count again.");
  await expect(result(page).locator("p")).toHaveCount(2);
  await set(page, { status: "complete" });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(content(page)).toBeHidden();
});

// Transitions started while the content opens, collected until bindPanel settles the height to `auto`.
const openingTransitions = async (page: Page) => {
  await append(page, "Done.");
  await set(page, { status: "complete" });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await settled(page);
  await content(page).evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await trigger(page).click();
  await expect(content(page)).toHaveCSS("--kind-step-content-height", "auto");
  return content(page).evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("full motion animates the content's height; reduced motion has no slide", async ({ page }) => {
  await open(page);
  expect(await openingTransitions(page)).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const reduced = await openingTransitions(page);
  for (const property of ["height", "transform", "translate"]) expect(reduced).not.toContain(property);
});

test("agents collapse it while it's open", async ({ page }) => {
  await open(page);
  // The Step base offers `expand` and `collapse` whether open or closed; `press` is the bridge's own action for a
  // component that holds a button (here, the trigger).
  await expectAgentActions(page, "Explain", ["collapse", "expand", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await append(page, "The limit **resets** on the hour.");
    await expect(result(page).locator("strong")).toHaveText("resets");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("an owner of open is told of completion and the trigger, and it stays open until the owner closes it", async ({
  page,
}) => {
  await open(page, "owned");
  await set(page, { status: "complete" });
  await trigger(page).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindHost.openings))
    .toEqual([
      [false, "auto"],
      [false, "trigger-press"],
    ]);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(content(page)).toBeVisible();
  await set(page, { open: false });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});
