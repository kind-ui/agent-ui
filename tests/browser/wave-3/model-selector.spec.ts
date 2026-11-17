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

const field = (page: Page, id = "model") => page.locator(`#${id} [data-slot="kind-model-selector-trigger"]`);
const valueIcon = (page: Page, id = "model") => field(page, id).locator('[data-slot="combobox-value-icon"]');
const openList = (page: Page) => page.locator('[data-slot="combobox-content"]:visible');
const ANTHROPIC = /^M13\.827/;
const OPENAI = /^M9\.205/;
const LOGO_NAMES = [
  "Claude Opus 5.5",
  "Claude Sonnet 5.5",
  "GPT-6.1 Sol",
  "GPT-6 Astra",
  "GPT-5.6 Sol",
  "GPT-6.1 Terra",
  "MAI Code 2",
  "Gemini 4 Argon",
  "Gemini 3.8 Flash",
  "Grok 4.7",
  "Local model",
];

const openLogos = async (page: Page) => {
  await page.goto("/?c=model-selector&case=logos");
  await expect(input(page)).toHaveValue("Claude Sonnet 5.5");
};

const box = async (locator: ReturnType<Page["locator"]>) => {
  const rect = await locator.evaluate((el) => el.getBoundingClientRect().toJSON());
  return rect as { x: number; y: number; width: number; height: number; bottom: number };
};

test("the field shows the chosen model's icon before the list first opens, and follows the choice", async ({
  page,
}) => {
  await openLogos(page);
  await expect(list(page)).toBeHidden();
  await expect(valueIcon(page)).toBeVisible();
  await expect(valueIcon(page).locator("svg path").first()).toHaveAttribute("d", ANTHROPIC);
  expect(await box(valueIcon(page))).toMatchObject({ width: 16, height: 16 });
  // An image URL icon shows as an image, before the input.
  await expect(valueIcon(page, "second").locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml,/);
  const order = await field(page, "second").evaluate((el) => {
    const icon = el.querySelector('[data-slot="combobox-value-icon"]');
    const text = el.querySelector("input");
    return icon && text ? icon.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
  });
  expect(order).toBeTruthy();
  expect(await valueIcon(page).evaluate((el) => Boolean(el.closest('[aria-hidden="true"]')))).toBe(true);

  await showModels(page).click();
  await option(page, "GPT-6.1 Sol").click();
  await expect(input(page)).toHaveValue("GPT-6.1 Sol");
  await expect(valueIcon(page).locator("svg path").first()).toHaveAttribute("d", OPENAI);
  await expect(valueIcon(page, "second").locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml,/);

  // A model without an icon takes the icon's room back.
  await showModels(page).click();
  await option(page, "Local model").click();
  await expect(input(page)).toHaveValue("Local model");
  await expect(valueIcon(page)).toBeHidden();
});

test("each row's icon is 16 by 16, hidden from assistive technology and left out of its name", async ({
  page,
}) => {
  await openLogos(page);
  await showModels(page).click();
  const options = list(page).getByRole("option");
  await expect(options).toHaveCount(LOGO_NAMES.length);
  for (const [index, name] of LOGO_NAMES.entries())
    await expect(options.nth(index)).toHaveAccessibleName(name);
  const icons = list(page).locator('[data-slot="combobox-item-icon"]');
  await expect(icons).toHaveCount(LOGO_NAMES.length - 1);
  await settled(page);
  const rows = await icons.evaluateAll((els) =>
    els.map((el) => {
      const { width, height } = el.getBoundingClientRect();
      return { width, height, hidden: Boolean(el.closest('[aria-hidden="true"]')) };
    }),
  );
  expect(rows).toEqual(rows.map(() => ({ width: 16, height: 16, hidden: true })));
  await expect(option(page, "MAI Code 2").locator('[data-slot="combobox-item-icon"] img')).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml,/,
  );
  await expect(option(page, "Local model").locator('[data-slot="combobox-item-icon"]')).toHaveCount(0);
});

test("rows with and without an icon have one height and their names start at one x", async ({ page }) => {
  await openLogos(page);
  await showModels(page).click();
  await expect(list(page)).toHaveAttribute("data-has-icons", "");
  await settled(page);
  const rows = await list(page)
    .getByRole("option")
    .evaluateAll((els) =>
      els.map((el) => ({
        height: el.getBoundingClientRect().height,
        text: el.querySelector("[data-model-selector-item-text]")?.getBoundingClientRect().x,
      })),
    );
  const [first] = rows;
  expect(rows).toEqual(rows.map(() => first));
});

test("a search marks only the name, never the icon", async ({ page }) => {
  await openLogos(page);
  await input(page).fill("son55");
  await expect(list(page).getByRole("option")).toHaveCount(1);
  const row = option(page, "Claude Sonnet 5.5");
  await expect(row).toHaveAccessibleName("Claude Sonnet 5.5");
  await expect(row.locator('[data-slot="combobox-item-icon"]')).toBeVisible();
  await expect(row.locator('[data-slot="combobox-item-icon"] mark')).toHaveCount(0);
  const marks = row.locator("mark");
  await expect(row.locator("[data-model-selector-name] mark")).toHaveCount(await marks.count());
  expect((await marks.allTextContents()).join("").toLowerCase().replace(/\./g, "")).toBe("son55");
  await page.keyboard.press("Enter");
  await expect(input(page)).toHaveValue("Claude Sonnet 5.5");
});

test("each list opens 6px below its own field, aligned to its start", async ({ page }) => {
  await openLogos(page);
  for (const id of ["model", "second"]) {
    await page.locator(`#${id} [data-slot="combobox-trigger"]`).click();
    await expect(openList(page)).toHaveCount(1);
    await settled(page);
    const [anchor, popup] = await Promise.all([box(field(page, id)), box(openList(page))]);
    expect(popup.y - anchor.bottom).toBeCloseTo(6, 0);
    expect(popup.x).toBeCloseTo(anchor.x, 0);
    await page.keyboard.press("Escape");
    await expect(openList(page)).toHaveCount(0);
  }
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations with icons and the list open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await openLogos(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await showModels(page).click();
    await expect(list(page)).toBeVisible();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
