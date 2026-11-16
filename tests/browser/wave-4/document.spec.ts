import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";

type Host = { kindHost: { downloads: [string | undefined, string][]; next(): void } };

const region = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const part = (page: Page, id: string, slot: string) =>
  page.locator(`#${id} [data-slot="kind-document-${slot}"]`);
const viewport = (page: Page, id: string) =>
  page.locator(`#${id} [data-slot="kind-document-body"] > * [data-slot="scroll-area-viewport"]`).first();
const downloads = (page: Page) => page.evaluate(() => (window as unknown as Host).kindHost.downloads);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=document&case=${name}`);
  await expect(part(page, name === "streaming" ? "streaming" : "readme", "title")).toBeVisible();
};

test("each format renders, with its kind and size beside the title", async ({ page }) => {
  await open(page);
  const readme = region(page, "README.md");
  await expect(readme.getByRole("heading", { name: "Rate limits" })).toBeVisible();
  await expect(part(page, "readme", "meta")).toHaveText(/^Markdown · \d+ bytes$/);
  await expect(part(page, "code", "meta")).toHaveText(/^ts · \d+ bytes$/);
  await expect(part(page, "code", "content").locator('[data-slot="kind-code-block"]')).toContainText(
    "withBackoff",
  );
  await expect(page.locator('#code [data-slot="kind-code-block-header"]')).toHaveCount(0);
  await expect(part(page, "notes", "meta")).toHaveText(/^Text · \d+ bytes$/);
  await expect(part(page, "notes", "content").locator(":scope > pre")).toHaveText(
    /Rate limits reset hourly\./,
  );
});

test("the toolbar is one Tab stop, and Download reports the format and who chose it", async ({ page }) => {
  await open(page);
  const readme = region(page, "README.md");
  await readme.getByRole("button", { name: "Copy", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(readme.getByRole("button", { name: "Download Markdown" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const text = readme.getByRole("button", { name: "Download Text" });
  await expect(text).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(readme.getByRole("button", { name: "Copy table" })).toBeFocused();
  await readme.getByRole("button", { name: "Download Markdown" }).click();
  expect(await downloads(page)).toEqual([
    ["txt", "keyboard"],
    ["md", "mouse"],
  ]);
  await expect(region(page, "notes.txt").getByRole("button", { name: /^Download/ })).toHaveCount(0);
});

test("Copy writes the source and shows it copied", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  const copy = region(page, "notes.txt").getByRole("button", { name: "Copy", exact: true });
  await copy.click();
  await expect(part(page, "notes", "copy")).toHaveAttribute("data-copied", "");
  expect(await readClipboard(page, browserName)).toBe(
    "Rate limits reset hourly.\nSecondary limits apply to bursts of writes.",
  );
});

test("Show more appears only past the collapsed height and shows the whole document", async ({ page }) => {
  await open(page);
  await expect(part(page, "code", "expand")).toBeHidden();
  await expect(part(page, "notes", "expand")).toBeHidden();
  const expand = part(page, "readme", "expand");
  await expect(expand).toHaveText("Show more");
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  const collapsed = (await viewport(page, "readme").boundingBox())?.height ?? 0;
  expect(collapsed).toBeCloseTo(320, 0);
  await expand.click();
  await expect(expand).toHaveText("Show less");
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await settled(page);
  const full = await viewport(page, "readme").evaluate((el) => [el.clientHeight, el.scrollHeight]);
  expect(full[0]).toBe(full[1]);
  expect(full[0]).toBeGreaterThan(collapsed);
});

test("streaming grows the body without moving the header", async ({ page }) => {
  await open(page, "streaming");
  const header = part(page, "streaming", "header");
  const before = await header.boundingBox();
  const expand = part(page, "streaming", "expand");
  await expect(expand).toBeHidden();
  let grew = false;
  let previous = 0;
  for (let index = 0; index < 40; index++) {
    await page.evaluate(() => (window as unknown as Host).kindHost.next());
    const height = (await viewport(page, "streaming").boundingBox())?.height ?? 0;
    if (height > previous) grew = previous > 0 || grew;
    expect(height).toBeGreaterThanOrEqual(previous);
    expect(height).toBeLessThanOrEqual(321);
    previous = height;
    expect(await header.boundingBox()).toEqual(before);
  }
  expect(grew).toBe(true);
  await expect(expand).toBeVisible();
});

test("full motion animates the expand; reduced motion doesn't", async ({ page }) => {
  const animates = async () => {
    const properties = await viewport(page, "readme").evaluate(
      (el) => getComputedStyle(el).transitionProperty,
    );
    return properties.includes("max-height");
  };
  await open(page);
  expect(await animates()).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await animates()).toBe(false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  expect(await animates()).toBe(false);
});

test("agents copy, download and expand while they're offered", async ({ page }) => {
  await open(page);
  // The bridge adds its generic `press` to a component that holds a button.
  await expectAgentActions(page, "README.md", ["copy", "download", "expand", "press"]);
  await expectAgentActions(page, "notes.txt", ["copy", "press"]);
  await page.evaluate(() =>
    (window as unknown as { agent: { act(input: object): Promise<unknown> } }).agent.act({
      steps: [{ ref: "README.md", action: "download", args: ["Text"] }],
    }),
  );
  await expect.poll(() => downloads(page)).toEqual([["txt", "agent"]]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
