import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements, layerOf } from "../layer.js";

type Log = { selected: string[]; values: string[]; expanded: string[][] };
type Fixture = {
  kindHost: { add(): void; remove(): void };
  kindLog: Log;
  kindAnimated: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const tree = (page: Page) => page.getByRole("tree", { name: "Files" });
const row = (page: Page, name: string | RegExp) => tree(page).getByRole("treeitem", { name });
const log = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindLog);
const host = (page: Page, change: "add" | "remove") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), change);
const act = (page: Page, action: string, path: string) =>
  page.evaluate(
    ([name, value]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Files", action: name, args: [value] }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, path],
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  // Records each row an animation starts on.
  await page.addInitScript(() => {
    const animated: string[] = [];
    Object.assign(window, { kindAnimated: animated });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      if (this.getAttribute("data-file-tree-part") === "item")
        animated.push(this.querySelector("[data-file-tree-name]")?.textContent ?? "");
      return animate.apply(this, args);
    };
  });
  await page.goto(`/?c=file-tree&case=${name}`);
  await expect(row(page, /^index\.ts/)).toBeVisible();
};

test("folders sort before files, and each change reads as words", async ({ page }) => {
  await open(page);
  const top = tree(page).locator(':scope > [role="treeitem"]');
  await expect(top).toHaveCount(4);
  await expect(top.nth(0)).toHaveAccessibleName("src");
  await expect(top.nth(1)).toHaveAccessibleName("docs");
  await expect(top.nth(2)).toHaveAccessibleName(/^package\.json/);
  await expect(row(page, /^index\.ts/)).toHaveAccessibleName("index.ts 12 additions, 3 deletions modified");
  await expect(row(page, /^package\.json/)).toHaveAccessibleName(
    "package.json 1 addition, 1 deletion modified",
  );
  await row(page, /^routes/).click();
  await expect(row(page, /^old\.tsx/)).toHaveAccessibleName("old.tsx 18 deletions deleted");
  await expect(row(page, /^home\.tsx/)).toHaveAccessibleName("home.tsx renamed");
  await expect(row(page, /^README\.md/)).toHaveAccessibleName("README.md");
  await expect(row(page, /^src/)).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, /^src/).locator('[data-file-tree-part="item"]').first()).toHaveAttribute(
    "data-change",
    "deleted",
  );
});

test("the keyboard moves between rows, opens folders and selects a file", async ({ page }) => {
  await open(page);
  await row(page, /^src/).focus();
  await page.keyboard.press("ArrowDown");
  await expect(row(page, /^lib/)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(row(page, /^lib/)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("End");
  await expect(row(page, /^README\.md/)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(row(page, /^src/)).toBeFocused();
  await page.keyboard.type("pac");
  await expect(row(page, /^package\.json/)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(row(page, /^package\.json/)).toHaveAttribute("aria-selected", "true");
  await expect.poll(async () => (await log(page)).selected).toEqual(["package.json item-press keyboard"]);
  expect((await log(page)).values).toEqual(["package.json item-press"]);
  expect((await log(page)).expanded).toEqual([["src", "src/lib"]]);
  await row(page, /^src/).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(row(page, /^src/)).toHaveAttribute("aria-expanded", "false");
  await expect(row(page, /^index\.ts/)).toBeHidden();
});

test("a press on a folder opens it and a press on a file selects it", async ({ page }) => {
  await open(page);
  await row(page, /^docs/).click();
  await expect(row(page, /^docs/)).toHaveAttribute("aria-expanded", "true");
  await row(page, /^index\.ts/).click();
  await expect.poll(async () => (await log(page)).selected).toEqual(["src/index.ts item-press mouse"]);
});

test("paths update with a folder open and a file focused: the folder stays open and focus stays", async ({
  page,
}) => {
  await open(page);
  await row(page, /^index\.ts/).focus();
  await host(page, "add");
  await expect(row(page, /^cache\.ts/)).toBeVisible();
  await expect(row(page, /^src/)).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, /^index\.ts/)).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindAnimated))
    .toEqual(["cache.ts"]);
  await host(page, "remove");
  await expect(row(page, /^index\.ts/)).toHaveCount(0);
  await expect(tree(page).locator(':focus[role="treeitem"]')).toHaveCount(1);
});

test("closing a folder animates its height at full motion and only fades under reduced motion", async ({
  page,
}) => {
  const closing = async () => {
    const group = row(page, /^src/).locator(':scope > [data-slot="tree-group"]');
    await group.evaluate((el) => {
      const seen: string[] = [];
      (el as HTMLElement & { seen?: string[] }).seen = seen;
      el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
    });
    await row(page, /^src/).click();
    await settled(page);
    return group.evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
  };
  await open(page);
  expect(await closing()).toContain("height");
  await open(page, "reduced");
  expect(await closing()).not.toContain("height");
});

test("agents expand, collapse and select by path, and an unknown path changes nothing", async ({
  page,
}, testInfo) => {
  // framework-svelte-6: developer output. `@ui-sdk/svelte` keys a root by its `id`, which unnames the component in the
  // agent snapshot (AGENTS.md "UI SDK API notes", Svelte chat core). Remove once UI SDK fixes it.
  test.skip(layerOf(testInfo) === "svelte", "@ui-sdk/svelte keys a root by its id");
  await open(page);
  await expectAgentActions(page, "Files", ["expand", "collapse", "select"]);
  expect(JSON.parse(String(await act(page, "expand", "nope")))).toMatchObject({ ok: false });
  expect((await log(page)).expanded).toEqual([]);
  await act(page, "expand", "src/routes");
  await expect(row(page, /^routes/)).toHaveAttribute("aria-expanded", "true");
  await act(page, "collapse", "src");
  await expect(row(page, /^src/)).toHaveAttribute("aria-expanded", "false");
  await act(page, "select", "README.md");
  await expect(row(page, /^README\.md/)).toHaveAttribute("aria-selected", "true");
  expect((await log(page)).selected).toEqual(["README.md imperative agent"]);
});

test("without onSelect agents can't select", async ({ page }, testInfo) => {
  // framework-svelte-6: developer output. `@ui-sdk/svelte` keys a root by its `id`, which unnames the component in the
  // agent snapshot (AGENTS.md "UI SDK API notes", Svelte chat core). Remove once UI SDK fixes it.
  test.skip(layerOf(testInfo) === "svelte", "@ui-sdk/svelte keys a root by its id");
  await open(page, "static");
  await expectAgentActions(page, "Files", ["expand", "collapse"]);
});

test("a press on a folder selects it, and Ctrl+Enter selects nothing", async ({ page }) => {
  await open(page);
  await row(page, /^docs/).click();
  await expect(row(page, /^docs/)).toHaveAttribute("aria-selected", "true");
  await expect.poll(async () => (await log(page)).values).toEqual(["docs item-press"]);
  await row(page, /^README\.md/).click();
  await row(page, /^package\.json/).focus();
  await page.keyboard.press("Control+Enter");
  await expect(row(page, /^README\.md/)).toHaveAttribute("aria-selected", "true");
  expect((await log(page)).selected).toEqual(["README.md item-press mouse"]);
});

test("an owner that refuses keeps the folders and selection, and no file opens", async ({ page }) => {
  await open(page, "refused");
  await row(page, /^docs/).click();
  await row(page, /^README\.md/).click();
  await expect
    .poll(async () => (await log(page)).values)
    .toEqual(["docs item-press", "README.md item-press"]);
  await expect(row(page, /^docs/)).toHaveAttribute("aria-expanded", "false");
  await expect(row(page, /^README\.md/)).toHaveAttribute("aria-selected", "false");
  expect((await log(page)).selected).toEqual([]);
});

test("a web tree put back in the page keeps its state and keeps reporting", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "moving an element is a web case");
  await open(page, "moved");
  await row(page, /^docs/).click();
  await page.evaluate(async () => {
    const element = document.querySelector("kind-file-tree") as HTMLElement;
    const parent = element.parentElement as HTMLElement;
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.append(element);
  });
  await expect(row(page, /^docs/)).toHaveAttribute("aria-expanded", "true");
  await row(page, /^lib/).click();
  await expect.poll(async () => (await log(page)).expanded.at(-1)).toEqual(["src", "docs", "src/lib"]);
  expect(
    await page.evaluate(
      () => (document.querySelector("kind-file-tree") as unknown as { value: string }).value,
    ),
  ).toBe("src/lib");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await row(page, /^lib/).click();
    await settled(page);
    // A treeitem holds its group (the WAI-ARIA tree pattern), so axe reads an open folder's rows as its visible text;
    // each row's name is checked above instead.
    const { violations } = await new AxeBuilder({ page })
      .include("#root")
      .disableRules(["label-content-name-mismatch"])
      .analyze();
    expect(violations).toEqual([]);
  });
}
