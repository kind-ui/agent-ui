import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { changes: { component: string; value: string | null; reason: string }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const selector = (page: Page) => page.locator("#model");
const input = (page: Page) => selector(page).getByRole("combobox", { name: "Model" });
const showModels = (page: Page) => selector(page).locator('[data-slot="combobox-trigger"]');
const list = (page: Page) => page.getByRole("listbox");
const option = (page: Page, name: string | RegExp) => list(page).getByRole("option", { name });
const group = (page: Page) => selector(page).locator("[data-model-selector-group]");
const changes = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindHost.changes.filter((c) => c.component === "model"));
const act = (page: Page, value: string) =>
  page.evaluate(
    (v) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Model", action: "setValue", args: [v] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    value,
  );
// The list shows a frame before its entrance starts: UI SDK holds `data-starting-style` on it for that frame.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=model-selector&case=${name}`);
  await expect(input(page)).toHaveValue("GPT-5");
};

test("a group named Model whose field shows the chosen model and its group", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("group", { name: "Model" })).toBeVisible();
  await expect(group(page)).toHaveText("OpenAI");
});

test("typing filters the list by provider and marks what matched; Enter chooses the first match", async ({
  page,
}) => {
  await open(page);
  await input(page).fill("son4");
  await expect(list(page).getByRole("option")).toHaveCount(1);
  await expect(list(page).getByRole("group")).toHaveCount(1);
  await expect(option(page, /Sonnet 4/).locator("mark")).toHaveText(["Son", "4"]);
  await page.keyboard.press("Enter");
  await expect(list(page)).toBeHidden();
  await expect(input(page)).toHaveValue("Sonnet 4");
  await expect(group(page)).toHaveText("Anthropic");
  expect(await changes(page)).toEqual([{ component: "model", value: "sonnet-4", reason: "input-change" }]);
});

test("ArrowDown moves the highlight and Enter chooses it", async ({ page }) => {
  await open(page);
  await input(page).fill("gpt-5");
  await expect(list(page).getByRole("option")).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expect(option(page, /GPT-5 mini/)).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Enter");
  await expect(input(page)).toHaveValue("GPT-5 mini");
  expect(await changes(page)).toEqual([{ component: "model", value: "gpt-5-mini", reason: "input-change" }]);
});

test("Escape closes the list, keeps focus on the field, and the next open lists every model", async ({
  page,
}) => {
  await open(page);
  await input(page).fill("gem");
  await expect(list(page).getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(list(page)).toBeHidden();
  await expect(input(page)).toBeFocused();
  await expect(input(page)).toHaveValue("GPT-5");
  await showModels(page).click();
  await expect(list(page).getByRole("option")).toHaveCount(5);
  await expect(list(page).getByRole("group")).toHaveCount(3);
  await expect(list(page).locator("mark")).toHaveCount(0);
  expect(await changes(page)).toEqual([]);
});

test("a query nothing matches says so", async ({ page }) => {
  await open(page);
  await input(page).fill("zzz");
  await expect(selector(page).getByText("No models found.")).toBeVisible();
  await expect(list(page).getByRole("option")).toHaveCount(0);
});

test("a disabled model can't be chosen by pointer, keys or setValue", async ({ page }) => {
  await open(page);
  await showModels(page).click();
  await expect(option(page, "Opus 4")).toHaveAttribute("aria-disabled", "true");
  await option(page, "Opus 4").click({ force: true });
  await input(page).fill("opus");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  expect(await act(page, "opus-4")).toContain("is disabled");
  await expect(input(page)).toHaveValue("GPT-5");
  expect(await changes(page)).toEqual([]);
});

test("a host that refuses the change keeps the chosen model", async ({ page }) => {
  await open(page, "refusing");
  await showModels(page).click();
  await option(page, /Sonnet 4/).click();
  await expect(input(page)).toHaveValue("GPT-5");
  await expect(group(page)).toHaveText("OpenAI");
  expect(await changes(page)).toEqual([{ component: "model", value: "sonnet-4", reason: "input-change" }]);
});

test("the field keeps its width when a longer name is chosen", async ({ page }) => {
  await open(page);
  const boxes = () =>
    page.evaluate(() =>
      ["model", "effort", "beside"].map((id) =>
        document.getElementById(id)?.getBoundingClientRect().toJSON(),
      ),
    );
  const before = await boxes();
  await showModels(page).click();
  await option(page, /Gemini/).click();
  await expect(input(page)).toHaveValue("Gemini 2.5 Pro with a very long name");
  expect(await boxes()).toEqual(before);
});

test("an agent's setValue chooses a listed model and refuses an unknown one", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Model", ["setValue"]);
  expect(await act(page, "unknown")).not.toContain('"ok":true');
  await expect(input(page)).toHaveValue("GPT-5");
  expect(await act(page, "sonnet-4")).toContain('"ok":true');
  await expect(input(page)).toHaveValue("Sonnet 4");
  expect(await changes(page)).toEqual([{ component: "model", value: "sonnet-4", reason: "imperative" }]);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the list only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, fixture);
    await showModels(page).click();
    const content = page.locator('[data-slot="combobox-content"]');
    await expect(content).toBeVisible();
    const transition = await content.evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s" });
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with the list open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    const before = await new AxeBuilder({ page }).include("#root").analyze();
    expect(before.violations).toEqual([]);
    await input(page).fill("o");
    await expect(list(page)).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
