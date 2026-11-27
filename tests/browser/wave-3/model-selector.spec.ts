import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements, layerHas, layerOf } from "../layer.js";

type Fixture = {
  kindHost: { changes: { component: string; value: string | null; reason: string }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page, id = "model") =>
  page.locator(`#${id} [data-slot="kind-model-selector-trigger"]`);
const content = (page: Page) => page.locator('[data-slot="kind-model-selector-content"]:visible');
const search = (page: Page) => page.getByRole("combobox", { name: "Model" });
const options = (page: Page) => content(page).getByRole("option");
const option = (page: Page, name: string | RegExp) => content(page).getByRole("option", { name });
const triggerIcon = (page: Page, id = "model") => trigger(page, id).locator("[data-picker-icon]");
const changes = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.changes.filter((c) => c.component !== "effort"),
  );
const act = (page: Page, ref: string, action: string, args: unknown[]) =>
  page.evaluate(
    ({ ref, action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref, action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { ref, action, args },
  );
// The list shows a frame before its entrance starts: UI SDK holds `data-starting-style` on it for that frame.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=model-selector&case=${name}`);
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-5");
};
const openList = async (page: Page, id = "model") => {
  await trigger(page, id).click();
  await expect(search(page)).toBeFocused();
};

test("a group and a button named Model and the chosen model", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("group", { name: "Model, GPT-5" })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
  await openList(page);
  await expect(search(page)).toHaveAttribute("placeholder", "Search models…");
  await expect(option(page, /^GPT-5(?! mini)/)).toHaveAttribute("aria-checked", "true");
});

test("typing filters and marks the name; Enter chooses the match, closes and renames the trigger", async ({
  page,
}) => {
  await load(page);
  await openList(page);
  await search(page).fill("son4");
  await expect(options(page)).toHaveText([/Sonnet 4/]);
  const marks = option(page, /Sonnet 4/).locator("mark");
  expect((await marks.allTextContents()).join("").toLowerCase()).toBe("son4");
  await page.keyboard.press("Enter");
  await expect(content(page)).toHaveCount(0);
  await expect(trigger(page)).toHaveAccessibleName("Model, Sonnet 4");
  expect(await changes(page)).toEqual([{ component: "model", value: "sonnet-4", reason: "item-press" }]);
});

test("a search for a provider finds its models", async ({ page }) => {
  await load(page);
  await openList(page);
  await search(page).fill("google");
  await expect(options(page)).toHaveText([/Gemini/]);
});

test("Escape clears the query, then closes and returns focus to the trigger", async ({ page }) => {
  await load(page);
  await openList(page);
  await search(page).fill("gem");
  await expect(options(page)).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveValue("");
  await expect(options(page)).toHaveCount(6);
  await page.keyboard.press("Escape");
  await expect(content(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-5");
  expect(await changes(page)).toEqual([]);
});

test("a query nothing matches says so", async ({ page }) => {
  await load(page);
  await openList(page);
  await search(page).fill("zzz");
  await expect(content(page).getByText("No models found")).toBeVisible();
  await expect(options(page)).toHaveCount(0);
});

test("a disabled model can't be chosen by pointer, keys or setValue", async ({ page }) => {
  await load(page);
  await openList(page);
  await expect(option(page, "Opus 4")).toHaveAttribute("aria-disabled", "true");
  await option(page, "Opus 4").click({ force: true });
  await search(page).fill("opus");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  expect(await act(page, "Model, GPT-5", "setValue", ["opus-4"])).not.toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-5");
  expect(await changes(page)).toEqual([]);
});

test("a host that refuses keeps the chosen model and the list open", async ({ page }) => {
  await load(page, "refusing");
  await openList(page);
  await option(page, /Sonnet 4/).click();
  await expect(content(page)).toBeVisible();
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-5");
  expect(await changes(page)).toEqual([{ component: "model", value: "sonnet-4", reason: "item-press" }]);
  await option(page, "More models").click();
  await expect(content(page)).toBeVisible();
  expect((await changes(page)).at(-1)).toEqual({ component: "action", value: "more", reason: "item-press" });
});

test("a web host moving a model into a new group or switching pages redraws the open list", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "draws the list in the web layer");
  await load(page);
  await openList(page);
  await page.evaluate(() => {
    const el = document.querySelector("kind-model-selector");
    if (el?.models)
      el.models = el.models.map((model) => (model.id === "gpt-5" ? { ...model, group: "Azure" } : model));
  });
  await expect(content(page).getByRole("group", { name: "Azure" }).getByRole("option")).toHaveText([
    /^GPT-5/,
  ]);
  await page.evaluate(() => {
    const el = document.querySelector("kind-model-selector");
    if (el) el.pages = "groups";
  });
  await expect(options(page)).toHaveText([/^Azure/, /^OpenAI/, /^Anthropic/, /^Google/, "More models"]);
});

test("the trigger grows with the chosen name up to its widest, then cuts the name short", async ({
  page,
}) => {
  await load(page);
  const width = () => trigger(page).evaluate((el) => el.getBoundingClientRect().width);
  expect(await width()).toBeLessThan(224);
  await openList(page);
  await option(page, /Gemini/).click();
  await expect(trigger(page)).toHaveAccessibleName("Model, Gemini 2.5 Pro with a very long name");
  expect(await width()).toBe(224);
  const text = trigger(page).locator("[data-picker-text]");
  expect(await text.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});

test.describe("in a composer at 390px", () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    test.skip(!layerHas(testInfo, "composer"), "the layer doesn't render Composer yet");
  });
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the trigger shows only its icon, keeps its name, and nothing overflows", async ({ page }) => {
    await page.goto("/?c=model-selector&case=composer");
    await expect(trigger(page)).toHaveAccessibleName("Model, Claude Sonnet 5.5");
    await expect(trigger(page).locator("[data-picker-text]")).toBeHidden();
    expect(await trigger(page).evaluate((el) => el.getBoundingClientRect().width)).toBe(32);
    const overflow = await page.evaluate(() => {
      const dropzone = document.querySelector('[data-slot="file-input-dropzone"]') as HTMLElement;
      return [
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        dropzone.scrollWidth - dropzone.clientWidth,
      ];
    });
    expect(overflow).toEqual([0, 0]);
  });
});

test("ArrowUp from the first row reaches More models, and Enter runs it", async ({ page }) => {
  await load(page);
  await openList(page);
  await page.keyboard.press("ArrowUp");
  await expect(option(page, "More models")).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Enter");
  await expect(content(page)).toHaveCount(0);
  expect(await changes(page)).toEqual([{ component: "action", value: "more", reason: "item-press" }]);
});

test('pages "groups" lists providers, each opening a page of its models, and Back returns', async ({
  page,
}) => {
  await load(page, "groups");
  await openList(page);
  await expect(options(page)).toHaveText([/^OpenAI/, /^Anthropic/, /^Google/, "More models"]);
  await option(page, /^OpenAI/).click();
  await expect(options(page)).toHaveText([/^GPT-5/, /^GPT-5 mini/, /Back/]);
  await option(page, /Back/).click();
  await expect(options(page)).toHaveCount(4);
  await option(page, /^Anthropic/).click();
  await option(page, /^Sonnet 4/).click();
  await expect(content(page)).toHaveCount(0);
  await expect(trigger(page)).toHaveAccessibleName("Model, Sonnet 4");
});

test('pages "groups" finds a provider by its models\' names from the first page', async ({ page }) => {
  await load(page, "groups");
  await openList(page);
  await search(page).fill("sonnet");
  await expect(options(page)).toHaveText([/^Anthropic/]);
  await page.keyboard.press("Enter");
  await expect(options(page)).toHaveText([/^Sonnet 4/, /^Opus 4/, /Back/]);
});

test("an agent sees open, setValue and run, chooses a listed model and is refused an unknown one", async ({
  page,
}) => {
  await load(page);
  await expectAgentActions(page, "Model, GPT-5", ["open", "setValue", "run"]);
  expect(await act(page, "Model, GPT-5", "setValue", ["unknown"])).not.toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-5");
  expect(await act(page, "Model, GPT-5", "setValue", ["sonnet-4"])).toContain('"ok":true');
  await expect(trigger(page)).toHaveAccessibleName("Model, Sonnet 4");
  expect(await act(page, "Model, Sonnet 4", "run", ["more"])).toContain('"ok":true');
  expect(await changes(page)).toEqual([
    { component: "model", value: "sonnet-4", reason: "imperative" },
    { component: "action", value: "more", reason: "imperative" },
  ]);
});

test("without actions an agent sees open and setValue", async ({ page }) => {
  await load(page, "plain");
  await expectAgentActions(page, "Model, GPT-5", ["open", "setValue"]);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the list only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await load(page, fixture);
    await openList(page);
    const transition = await content(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s" });
  });
}

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

const loadLogos = async (page: Page) => {
  await page.goto("/?c=model-selector&case=logos");
  await expect(trigger(page)).toHaveAccessibleName("Model, Claude Sonnet 5.5");
};

const box = (locator: ReturnType<Page["locator"]>) =>
  locator.evaluate((el) => el.getBoundingClientRect().toJSON()) as Promise<{ width: number; height: number }>;

test("the trigger shows the chosen model's icon before the list first opens, and follows the choice", async ({
  page,
}, testInfo) => {
  await loadLogos(page);
  await expect(content(page)).toHaveCount(0);
  await expect(triggerIcon(page).locator("svg path").first()).toHaveAttribute("d", ANTHROPIC);
  expect(await box(triggerIcon(page))).toMatchObject({ width: 16, height: 16 });
  await expect(triggerIcon(page, "second").locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml,/);
  if (layerOf(testInfo) === "react") {
    await expect(page.locator("#mine")).toHaveAccessibleName("Model, GPT-6 Astra");
    await expect(page.locator("#mine [data-picker-icon] svg")).toHaveCount(1);
  }

  await openList(page);
  await option(page, "GPT-6.1 Sol").click();
  await expect(trigger(page)).toHaveAccessibleName("Model, GPT-6.1 Sol");
  await expect(triggerIcon(page).locator("svg path").first()).toHaveAttribute("d", OPENAI);

  await openList(page);
  await option(page, "Local model").click();
  await expect(trigger(page)).toHaveAccessibleName("Model, Local model");
  await expect(triggerIcon(page)).toHaveCount(0);
});

test("each row's icon is 16 by 16, hidden from assistive technology and left out of its name", async ({
  page,
}) => {
  await loadLogos(page);
  await openList(page);
  await expect(options(page)).toHaveCount(LOGO_NAMES.length);
  for (const [index, name] of LOGO_NAMES.entries())
    await expect(options(page).nth(index)).toHaveAccessibleName(name);
  const icons = content(page).locator('[data-slot="command-item-icon"]');
  await expect(icons).toHaveCount(LOGO_NAMES.length - 1);
  await settled(page);
  const rows = await icons.evaluateAll((els) =>
    els.map((el) => {
      const { width, height } = el.getBoundingClientRect();
      return { width, height, hidden: Boolean(el.closest('[aria-hidden="true"]')) };
    }),
  );
  expect(rows).toEqual(rows.map(() => ({ width: 16, height: 16, hidden: true })));
  await expect(option(page, "MAI Code 2").locator('[data-slot="command-item-icon"] img')).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml,/,
  );
  await expect(option(page, "Local model").locator('[data-slot="command-item-icon"]')).toHaveCount(0);
});

test("rows with and without an icon have one height and their names start at one x", async ({ page }) => {
  await loadLogos(page);
  await openList(page);
  await expect(content(page).locator("[data-has-icons]")).not.toHaveCount(0);
  await settled(page);
  const rows = await options(page).evaluateAll((els) =>
    els.map((el) => ({
      height: el.getBoundingClientRect().height,
      text: el.querySelector("[data-picker-item-text]")?.getBoundingClientRect().x,
    })),
  );
  const [first] = rows;
  expect(rows).toEqual(rows.map(() => first));
});

test("a search marks only the name, never the icon", async ({ page }) => {
  await loadLogos(page);
  await openList(page);
  await search(page).fill("son55");
  await expect(options(page)).toHaveCount(1);
  const row = option(page, "Claude Sonnet 5.5");
  await expect(row.locator('[data-slot="command-item-icon"]')).toBeVisible();
  await expect(row.locator('[data-slot="command-item-icon"] mark')).toHaveCount(0);
  const marks = row.locator("mark");
  await expect(row.locator("[data-picker-item-text] mark")).toHaveCount(await marks.count());
  expect((await marks.allTextContents()).join("").toLowerCase().replace(/\./g, "")).toBe("son55");
  await page.keyboard.press("Enter");
  await expect(trigger(page)).toHaveAccessibleName("Model, Claude Sonnet 5.5");
});

for (const fixture of ["all", "logos"] as const)
  for (const colorScheme of ["light", "dark"] as const) {
    test(`axe reports no violations in ${fixture} with the list open in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await (fixture === "all" ? load(page) : loadLogos(page));
      // The fixture page has no background of its own, which axe reads as white.
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await settled(page);
      expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
      await openList(page);
      await search(page).fill("o");
      await expect(content(page).locator("mark").first()).toBeVisible();
      await settled(page);
      expect((await new AxeBuilder({ page }).include("#root").analyze()).violations).toEqual([]);
    });
  }

test("a model's cost sits at the end of its row, read in words, with the unit explained once below", async ({
  page,
}) => {
  await page.goto("/?c=model-selector&case=cost");
  const opus = page.getByRole("option", { name: /^Claude Opus 5\.5/ });
  await expect(opus).toHaveAccessibleName(/^Claude Opus 5\.5 ?, 3 times the cost$/);
  await expect(page.getByRole("option", { name: /^GPT-6 Luna/ })).toHaveAccessibleName(
    /^GPT-6 Luna ?, Free$/,
  );
  await expect(opus.locator("[data-picker-meta]")).toHaveText("3×");
  await expect(page.locator('[data-picker-part="note"]')).toHaveText(
    "Cost per request, relative to the default model.",
  );
  await expect(page.locator('[data-slot="kind-model-selector-trigger"]')).not.toContainText("×");
});
