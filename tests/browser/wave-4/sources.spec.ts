import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = { kindHost: { add(): void; rename(): void }; kindAnimated: Element[] };

const region = (page: Page) => page.getByRole("region", { name: /^Used \d sources$/ });
const trigger = (page: Page) => region(page).getByRole("button", { name: /^Used \d sources$/ });
const content = (page: Page) => page.locator('#sources [data-sources-part="content"]');
const items = (page: Page) => page.locator('#sources [data-sources-part="item"]');
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
const host = (page: Page, change: keyof Fixture["kindHost"]) =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), change);
const animated = (page: Page) =>
  page.evaluate(() =>
    [...new Set((window as unknown as Fixture).kindAnimated)].map(
      (item) => item.querySelector('[data-sources-part="title"]')?.textContent,
    ),
  );

const open = async (page: Page, name = "all") => {
  // Records each item an animation starts on.
  await page.addInitScript(() => {
    const animated: Element[] = [];
    Object.assign(window, { kindAnimated: animated });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      if (this.getAttribute("data-sources-part") === "item") animated.push(this);
      return animate.apply(this, args);
    };
  });
  await page.goto(`/?c=sources&case=${name}`);
  await expect(region(page)).toBeVisible();
};

// Transitions started while the list opens, collected until bindStepPanel settles the height to `auto`.
const openedProperties = async (page: Page) => {
  await content(page).evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await trigger(page).click();
  await expect(content(page)).toHaveCSS("--kind-step-content-height", "auto");
  return content(page).evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("Enter and Space open and close the list of links", async ({ page }) => {
  await open(page);
  await expect(region(page)).toHaveAccessibleName("Used 3 sources");
  await expect(content(page)).toHaveAttribute("hidden", "until-found");
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  const list = region(page).getByRole("list");
  await expect(list.getByRole("listitem")).toHaveCount(3);
  const link = list.getByRole("link", { name: /Rate limits for the REST API/ });
  await expect(link).toHaveAttribute("href", /^https:\/\/docs\.github\.com\//);
  await expect(link).toContainText("docs.github.com");
  await expect(list.getByRole("link", { name: /Exponential backoff/ })).toContainText("example.com");
  await page.keyboard.press("Space");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(content(page)).toBeHidden();
});

test("find in page opens the list", async ({ page }) => {
  await open(page);
  await content(page).evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(content(page)).toBeVisible();
});

test("a source with an unsafe URL is text, not a link", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  const unsafe = items(page).filter({ hasText: "Pasted notes" });
  await expect(unsafe).toBeVisible();
  await expect(unsafe.getByRole("link")).toHaveCount(0);
  await expect(page.locator('#sources [href^="javascript:"]')).toHaveCount(0);
  await expect(region(page).getByRole("link")).toHaveCount(2);
});

test("a new source fades up once and the count updates in place; an updated one doesn't replay", async ({
  page,
}) => {
  await open(page);
  await trigger(page).click();
  await settled(page);
  const before = await trigger(page).boundingBox();
  await host(page, "add");
  await expect(trigger(page)).toHaveText("Used 4 sources");
  const after = await trigger(page).boundingBox();
  expect([after?.y, after?.height]).toEqual([before?.y, before?.height]);
  await expect.poll(() => animated(page)).toEqual(["Rate limit headers"]);
  await settled(page);
  await host(page, "rename");
  await expect(items(page).first()).toContainText("REST API rate limits");
  await settled(page);
  expect(await animated(page)).toEqual(["Rate limit headers"]);
});

test("full motion animates the list's height; reduced motion only fades it", async ({ page }) => {
  await open(page);
  expect(await openedProperties(page)).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await openedProperties(page)).not.toContain("height");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  expect(await openedProperties(page)).not.toContain("height");
});

test("agents expand a closed list and collapse an open one", async ({ page }) => {
  await open(page);
  // The bridge adds its generic `press` to a component that holds a button.
  await expectAgentActions(page, "Used 3 sources", ["expand", "press"]);
  await trigger(page).click();
  await expectAgentActions(page, "Used 3 sources", ["collapse", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode, with the list open`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page).click();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
