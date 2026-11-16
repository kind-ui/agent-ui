import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { dismisses: string[]; add(): void };
  kindAnnounced: string[];
};

const blocking = (page: Page) => page.getByRole("alert", { name: "Model output withheld" });
const why = (page: Page) => blocking(page).getByRole("button", { name: "Why?" });
const detail = (page: Page) => page.locator('#guardrail-blocking [data-notice-part="detail"]');
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
const afterFrames = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

const open = async (page: Page, name = "all") => {
  // Records each text UI SDK's live regions are given, with their politeness.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(`${target.getAttribute("aria-live")}: ${target.textContent}`);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`/?c=guardrail-notice&case=${name}`);
  await expect(blocking(page)).toBeVisible();
};

// Transitions started while the detail opens, collected until bindStepPanel settles the height to `auto`.
const openedProperties = async (page: Page) => {
  await detail(page).evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await why(page).click();
  await expect(detail(page)).toHaveCSS("--kind-step-content-height", "auto");
  return detail(page).evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("a blocking guardrail is an alert with its reason; one that only filtered is a note", async ({
  page,
}) => {
  await open(page);
  await expect(blocking(page)).toContainText("The response included personal data.");
  await expect(blocking(page).getByRole("img", { name: "Warning" })).toBeVisible();
  const filtered = page.getByRole("note", { name: "Some results hidden" });
  await expect(filtered).toBeVisible();
  await expect(filtered.getByRole("img", { name: "Info" })).toBeVisible();
  await expect(page.getByRole("alert", { name: "Some results hidden" })).toHaveCount(0);
});

test("Why? opens and closes the detail from the keyboard", async ({ page }) => {
  await open(page);
  await expect(detail(page)).toHaveAttribute("hidden", "until-found");
  await why(page).focus();
  await page.keyboard.press("Enter");
  await expect(why(page)).toHaveAttribute("aria-expanded", "true");
  await expect(detail(page)).toBeVisible();
  await expect(detail(page)).toContainText("email addresses or phone numbers");
  await page.keyboard.press("Space");
  await expect(why(page)).toHaveAttribute("aria-expanded", "false");
  await expect(detail(page)).toBeHidden();
});

test("find in page opens the detail", async ({ page }) => {
  await open(page);
  await detail(page).evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(why(page)).toHaveAttribute("aria-expanded", "true");
  await expect(detail(page)).toBeVisible();
});

test("full motion animates the detail's height; reduced motion only fades it", async ({ page }) => {
  await open(page);
  expect(await openedProperties(page)).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await openedProperties(page)).not.toContain("height");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  expect(await openedProperties(page)).not.toContain("height");
});

test("a blocking guardrail added later is announced at once; those on the page as it loads aren't", async ({
  page,
}) => {
  await open(page);
  await afterFrames(page);
  expect(await announced(page)).toEqual([]);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.add());
  await expect(page.getByRole("alert", { name: "Request blocked" })).toBeVisible();
  await expect.poll(() => announced(page)).toEqual(["assertive: Request blocked"]);
});

test("Dismiss moves focus on, fades the guardrail out, then calls the host", async ({ page }) => {
  await open(page);
  await blocking(page).getByRole("button", { name: "Dismiss" }).press("Enter");
  await expect(
    page.getByRole("note", { name: "Some results hidden" }).getByRole("button", { name: "Why?" }),
  ).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindHost.dismisses))
    .toEqual(["blocking"]);
  await expect(blocking(page)).toHaveCount(0);
});

test("agents dismiss, expand and collapse a guardrail with a detail", async ({ page }) => {
  await open(page);
  // The bridge adds its generic `press` to a component that holds a button.
  await expectAgentActions(page, "Model output withheld", ["collapse", "dismiss", "expand", "press"]);
  await expectAgentActions(page, "Some results hidden", ["collapse", "expand", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode, with the detail open`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await why(page).click();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
