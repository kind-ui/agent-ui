import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { changes: { component: string; value: string | null; reason: string }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const effort = (page: Page) => page.getByRole("group", { name: "Reasoning effort" });
const level = (page: Page, name: string) => effort(page).getByRole("radio", { name });
const indicator = (page: Page) => page.locator('#effort [data-slot="segmented-control-indicator"]');
const changes = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.changes.filter((c) => c.component === "effort"),
  );
const act = (page: Page, value: string) =>
  page.evaluate(
    (v) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Reasoning effort", action: "setValue", args: [v] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    value,
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=model-selector&case=${name}`);
  await expect(level(page, "Medium")).toBeChecked();
};

test("arrow keys move the choice, and the host hears each one", async ({ page }) => {
  await open(page);
  await level(page, "Medium").focus();
  await page.keyboard.press("ArrowRight");
  await expect(level(page, "High")).toBeChecked();
  await expect(level(page, "High")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(level(page, "Low")).toBeChecked();
  expect((await changes(page)).map(({ value }) => value)).toEqual(["high", "medium", "low"]);
});

test("a press chooses a level and the mark slides to it", async ({ page }) => {
  await open(page);
  const left = () => indicator(page).evaluate((el) => el.getBoundingClientRect().left);
  const before = await left();
  await expect(indicator(page)).toHaveCSS("transition-property", "top, left, width, height");
  await level(page, "High").click();
  await settled(page);
  expect(await left()).toBeGreaterThan(before);
  expect(await changes(page)).toEqual([{ component: "effort", value: "high", reason: "input-change" }]);
});

test("an agent's setValue chooses a listed level and refuses an unknown one", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Reasoning effort", ["setValue"]);
  expect(await act(page, "unknown")).not.toContain('"ok":true');
  await expect(level(page, "Medium")).toBeChecked();
  expect(await act(page, "high")).toContain('"ok":true');
  await expect(level(page, "High")).toBeChecked();
  expect(await changes(page)).toEqual([{ component: "effort", value: "high", reason: "imperative" }]);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the mark doesn't slide; the level fades in`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, fixture);
    await expect(indicator(page)).toBeHidden();
    await expect(level(page, "Medium")).toHaveCSS("transition-duration", /0\.12s/);
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#effort").analyze();
    expect(violations).toEqual([]);
  });
}
