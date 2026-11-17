import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = { agent: { act(input: unknown): Promise<unknown> }; kindHost: { openings: string[] } };

const marker = (page: Page, id: "many" | "one") =>
  page.locator(`#${id} [data-slot="kind-inline-citation-trigger"]`);
const card = (page: Page, name: string) => page.getByRole("dialog", { name, exact: true });
const act = (page: Page, ref: string, action: string) =>
  page.evaluate(
    ([ref, name]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action: name, args: [] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action],
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=inline-citation&case=${name}`);
  await expect(marker(page, "many")).toBeVisible();
};

test("markers read their sources and keep the paragraph's line height", async ({ page }) => {
  await open(page);
  await expect(marker(page, "many")).toHaveText("docs.github.com +2");
  await expect(marker(page, "many")).toHaveAccessibleName("docs.github.com +2, Sources: 3");
  await expect(marker(page, "one")).toHaveText("1");
  await expect(marker(page, "one")).toHaveAccessibleName("1, Source: Rate limit headers");
  const { height, lineHeight } = await page.locator("#prose").evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    lineHeight: getComputedStyle(el).lineHeight,
  }));
  expect(`${height}px`).toBe(lineHeight);
});

test("markers keep even a line height of 1", async ({ page }) => {
  await open(page);
  const heights = await page.locator("#prose").evaluate((el) => {
    el.style.lineHeight = "1";
    const bare = el.cloneNode(true) as HTMLElement;
    for (const citation of bare.querySelectorAll("#many, #one")) citation.replaceWith("x");
    el.after(bare);
    const result = [el.getBoundingClientRect().height, bare.getBoundingClientRect().height];
    bare.remove();
    return result;
  });
  expect(heights[0]).toBe(heights[1]);
});

test("a press opens the card and Escape returns focus to the marker", async ({ page }) => {
  await open(page);
  await marker(page, "one").click();
  const one = card(page, "Source: Rate limit headers");
  await expect(one).toBeVisible();
  await expect(one.getByRole("link", { name: /Rate limit headers/ })).toHaveAttribute(
    "href",
    /^https:\/\/developer\.mozilla\.org\//,
  );
  await expect(one).toContainText("Retry-After says how long");
  await expect(one.locator('[data-slot="carousel"]')).toHaveCount(0);
  await expect(one.getByRole("button", { name: /source/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(one).toBeHidden();
  await expect(marker(page, "one")).toBeFocused();
});

test("keyboard focus opens the card and leaves focus on the marker", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(card(page, "Sources: 3")).toBeVisible();
  await expect(marker(page, "many")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(card(page, "Sources: 3").getByRole("link", { name: /Rate limits/ })).toBeFocused();
  await expect(card(page, "Sources: 3")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(card(page, "Sources: 3")).toBeHidden();
  await expect(marker(page, "many")).toBeFocused();
});

test("resting the pointer opens the card after a delay", async ({ page }) => {
  await open(page);
  await marker(page, "one").hover();
  await expect(card(page, "Source: Rate limit headers")).toBeHidden();
  await expect(card(page, "Source: Rate limit headers")).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(card(page, "Source: Rate limit headers")).toBeHidden();
});

test("Next and Previous page through three sources, and the unsafe one is text", async ({ page }) => {
  await open(page);
  await marker(page, "many").click();
  const many = card(page, "Sources: 3");
  const index = many.locator('[data-slot="kind-inline-citation-index"]');
  await expect(index).toHaveText("1 of 3");
  await expect(index).toHaveAttribute("aria-live", "off");
  const previous = many.getByRole("button", { name: "Previous source" });
  const next = many.getByRole("button", { name: "Next source" });
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await settled(page);
  const height = await many.evaluate((el) => el.getBoundingClientRect().height);
  await next.click();
  await expect(index).toHaveText("2 of 3");
  await next.click();
  await expect(index).toHaveText("3 of 3");
  await expect(many.getByText("Pasted notes")).toBeVisible();
  await expect(page.locator('#many [href^="javascript:"]')).toHaveCount(0);
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await settled(page);
  expect(await many.evaluate((el) => el.getBoundingClientRect().height)).toBe(height);
  await previous.click();
  await expect(index).toHaveText("2 of 3");
  await many.locator('[data-slot="carousel-viewport"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(index).toHaveText("3 of 3");
  await page.keyboard.press("Home");
  await expect(index).toHaveText("1 of 3");
  await page.keyboard.press("ArrowRight");
  await expect(index).toHaveText("2 of 3");
  await marker(page, "many").focus();
  await page.keyboard.press("Escape");
  await expect(many).toBeHidden();
  await marker(page, "many").click();
  await expect(index).toHaveText("2 of 3");
  await expect(many.getByText("Exponential backoff and jitter")).toBeVisible();
});

test("an owner that keeps the card closed is told of each opening, and it stays closed", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "controlled `open` is a React prop");
  await open(page, "refused");
  await marker(page, "one").click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindHost.openings))
    .toEqual(["trigger-press"]);
  await expect(card(page, "Source: Rate limit headers")).toBeHidden();
  await expect(marker(page, "one")).toHaveAttribute("aria-expanded", "false");
});

test("with reduced motion the card only fades", async ({ page }) => {
  await open(page, "reduced");
  await marker(page, "one").click();
  const one = card(page, "Source: Rate limit headers");
  await expect(one).toBeVisible();
  expect(await one.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("opacity");
});

test("an agent opens the card, pages it and closes it, each offered only when it applies", async ({
  page,
}) => {
  await open(page);
  // The bridge adds its generic `press` to a component that holds a button.
  await expectAgentActions(page, "docs.github.com +2, Sources: 3", ["open", "press"]);
  expect(await act(page, "docs.github.com +2, Sources: 3", "open")).toContain('"ok":true');
  await expect(card(page, "Sources: 3")).toBeVisible();
  await expectAgentActions(page, "docs.github.com +2, Sources: 3", ["close", "next", "press"]);
  expect(await act(page, "docs.github.com +2, Sources: 3", "next")).toContain('"ok":true');
  await expect(card(page, "Sources: 3").locator('[data-slot="kind-inline-citation-index"]')).toHaveText(
    "2 of 3",
  );
  await expectAgentActions(page, "docs.github.com +2, Sources: 3", ["close", "next", "previous", "press"]);
  expect(await act(page, "docs.github.com +2, Sources: 3", "close")).toContain('"ok":true');
  await expect(card(page, "Sources: 3")).toBeHidden();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the card open, in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await marker(page, "many").click();
    await expect(card(page, "Sources: 3")).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#prose").analyze()).violations).toEqual([]);
  });
}
