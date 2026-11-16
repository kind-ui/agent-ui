import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: {
    picks: { id: string; reason: string; source: string }[];
    submits: string[];
    add(): void;
    remove(): void;
    rename(): void;
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const row = (page: Page) => page.getByRole("group", { name: "Suggestions" }).first();
const chip = (page: Page, name: string) => row(page).getByRole("button", { name });
const previous = (page: Page) => row(page).getByRole("button", { name: "Previous suggestions" });
const next = (page: Page) => row(page).getByRole("button", { name: "Next suggestions" });
const picks = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.picks);
const host = (page: Page, method: "add" | "remove" | "rename") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), method);
const act = (page: Page, id: string) =>
  page.evaluate(
    (value) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Suggestions", action: "pick", args: [value] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    id,
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
const animated = (page: Page, name: string) =>
  chip(page, name).evaluate((el) =>
    el
      .getAnimations()
      .flatMap((animation) =>
        (animation.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame)),
      ),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=suggestion&case=${name}`);
  await expect(chip(page, "Summarize this thread")).toBeVisible();
};
const afterFirstFrame = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

test("Tab reaches each suggestion, and Previous and Next stay hidden while they all fit", async ({
  page,
}) => {
  await open(page);
  await page.locator("#above").click();
  for (const name of ["Summarize this thread", "Draft a reply", "List the open questions"]) {
    await page.keyboard.press("Tab");
    await expect(chip(page, name)).toBeFocused();
  }
  await expect(previous(page)).toBeHidden();
  await expect(next(page)).toBeHidden();
});

test("Previous and Next show when the suggestions overflow, and Next brings later ones within reach", async ({
  page,
}) => {
  await open(page, "overflow");
  await expect(previous(page)).toBeVisible();
  await expect(next(page)).toBeVisible();
  await expect(previous(page)).toHaveAttribute("aria-disabled", "true");
  const last = chip(page, "Suggest a test plan");
  await expect(last).toBeHidden();
  await expect(async () => {
    await next(page).click();
    await settled(page);
    await expect(last).toBeVisible({ timeout: 100 });
  }).toPass();
  await last.focus();
  await expect(last).toBeFocused();
  await expect(previous(page)).not.toHaveAttribute("aria-disabled", "true");
});

test("a press or Enter picks a suggestion", async ({ page }) => {
  await open(page);
  await chip(page, "Draft a reply").click();
  await chip(page, "List the open questions").press("Enter");
  expect(await picks(page)).toEqual([
    { id: "b", reason: "item-press", source: "mouse" },
    { id: "c", reason: "item-press", source: "keyboard" },
  ]);
});

test("a suggestion in a form picks without submitting it", async ({ page }) => {
  await open(page, "form");
  await chip(page, "Draft a reply").click();
  await chip(page, "Draft a reply").press("Enter");
  expect(await picks(page)).toHaveLength(2);
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.submits)).toEqual([]);
});

test("when the host removes the focused suggestion, focus moves to the next one", async ({ page }) => {
  await open(page);
  await chip(page, "Draft a reply").focus();
  await host(page, "remove");
  await expect(chip(page, "List the open questions")).toBeFocused();
});

test("Previous and Next stay while one holds focus, though every suggestion now fits", async ({ page }) => {
  await open(page, "overflow");
  await next(page).focus();
  await page.locator("#suggestion").evaluate((el) => {
    (el.closest(".p-6") as HTMLElement).style.width = "1400px";
  });
  await expect(next(page)).toHaveAttribute("aria-disabled", "true");
  await expect(next(page)).toBeFocused();
  await chip(page, "Summarize this thread").focus();
  await expect(next(page)).toBeHidden();
});

test("SuggestionControls hides Previous and Next in a layout you compose", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "React parts only");
  await open(page, "custom");
  await expect(chip(page, "Draft a reply")).toBeVisible();
  await expect(next(page)).toBeHidden();
});

test("a new suggestion fades up once; an updated one doesn't replay, and nothing above moves", async ({
  page,
}) => {
  await open(page);
  await afterFirstFrame(page);
  const top = (selector: string) => page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
  const above = await top("#above");
  const below = await top("#below");
  await host(page, "add");
  await expect(chip(page, "Translate to French")).toBeVisible();
  expect(await animated(page, "Translate to French")).toEqual(
    expect.arrayContaining(["opacity", "transform"]),
  );
  expect(await animated(page, "Draft a reply")).toEqual([]);
  await settled(page);
  await host(page, "rename");
  await expect(chip(page, "Summarize it")).toBeVisible();
  expect(await animated(page, "Summarize it")).toEqual([]);
  expect(await top("#above")).toBe(above);
  expect(await top("#below")).toBe(below);
});

test("with reduced motion a new suggestion only fades", async ({ page }) => {
  await open(page, "reduced");
  await afterFirstFrame(page);
  await host(page, "add");
  const keys = await animated(page, "Translate to French");
  expect(keys).toContain("opacity");
  expect(keys).not.toContain("transform");
});

test("without onPick the suggestions show, but can't be picked", async ({ page }) => {
  await open(page, "static");
  await expect(chip(page, "Draft a reply")).toHaveAttribute("aria-disabled", "true");
  await chip(page, "Draft a reply").click({ force: true });
  expect(await picks(page)).toEqual([]);
  await expectAgentActions(page, "Suggestions", []);
});

test("an agent picks a listed suggestion and is refused an unknown one", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Suggestions", ["pick"]);
  expect(await act(page, "unknown")).not.toContain('"ok":true');
  expect(await act(page, "b")).toContain('"ok":true');
  expect(await picks(page)).toEqual([{ id: "b", reason: "imperative", source: "agent" }]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const name of ["all", "overflow"]) {
      await open(page, name);
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await settled(page);
      const { violations } = await new AxeBuilder({ page }).include("#suggestion").analyze();
      expect(violations).toEqual([]);
    }
  });
}
