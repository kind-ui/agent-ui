import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { passingSteps } from "../../../packages/agent-ui/tests/fixtures/shared/test-results.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindTestResults: { set(id: string, next: Record<string, unknown>): void };
  kindHost: { filters: [string, string][]; expanded: [string[], string][] };
  agent: { act(input: unknown): Promise<unknown> };
};

const results = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  results(page, id).locator(`[data-slot="kind-test-results-${name}"]`);
const row = (page: Page, id: string, name: string | RegExp) =>
  results(page, id).getByRole("treeitem", { name }).first();
// A row's own label: the treeitem holds its group, so its middle may be a row inside it.
const label = (page: Page, id: string, name: string | RegExp) =>
  row(page, id, name).locator(':scope > [data-slot="tree-label"]');
const count = (page: Page, id: string, name: RegExp) => results(page, id).getByRole("button", { name });
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTestResults.set(i, n), [id, next] as const);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
      ),
  );
const act = (page: Page, ref: string, action: string, args?: unknown[]) =>
  page.evaluate(
    ([r, a, rest]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a, ...(rest ? { args: rest } : {}) }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action, args] as const,
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=test-results&case=${name}`);
  await expect(row(page, "results", /^auth/)).toBeVisible();
};

test("shows the counts and duration, and opens failures to their message and stack trace", async ({
  page,
}) => {
  await open(page);
  const run = results(page, "results");
  await expect(run).toHaveAttribute("role", "group");
  await expect(run).toHaveAccessibleName("Tests");
  await expect(run).toHaveAttribute("data-status", "error");
  await expect(part(page, "results", "meta")).toHaveText("70 ms");
  await expect(part(page, "results", "count")).toHaveText(["3 passed", "1 failed", "1 skipped"]);
  await expect(run.getByRole("button", { pressed: true })).toHaveCount(0);
  await expect(run.getByRole("tree", { name: "Tests" })).toBeVisible();

  await expect(row(page, "results", /^auth/)).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, "results", /^cart/)).toHaveAttribute("aria-expanded", "false");
  const failed = row(page, "results", /^rejects a wrong password/);
  await expect(failed).toHaveAccessibleName("rejects a wrong password failed 18 ms");
  await expect(failed).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, "results", /^signs in/)).toHaveAccessibleName("signs in with SSO skipped");
  const trace = failed.locator('[data-slot="kind-stack-trace"]');
  await expect(trace).toHaveAccessibleName("AssertionError: expected 401, got 200");
  await expect(trace.locator('[data-slot="kind-stack-trace-frame"]').first()).toHaveText(
    "Context.<anonymous>test/auth.test.ts:24:31",
  );
});

test("a count filters the tree, pressing it again shows every test, and an empty filter says so", async ({
  page,
}) => {
  await open(page);
  const tree = results(page, "results").getByRole("tree");
  const failed = count(page, "results", /failed$/);
  await failed.click();
  await expect(failed).toHaveAttribute("aria-pressed", "true");
  await expect(tree.getByRole("treeitem").filter({ visible: true })).toHaveText([/^auth/, /^rejects/]);
  expect((await host(page)).filters).toEqual([["fail", expect.stringMatching(/^item-press:/)]]);
  await failed.press("Enter");
  await expect(failed).toHaveAttribute("aria-pressed", "false");
  await expect(tree.getByRole("treeitem", { name: /^cart/ })).toBeVisible();
  expect((await host(page)).filters.at(-1)).toEqual(["all", expect.stringMatching(/^item-press:/)]);
  await count(page, "results", /passed$/).click();
  await expect(tree.getByRole("treeitem", { name: /^cart/ })).toBeVisible();
  await expect(tree.getByRole("treeitem", { name: /^signs in/ })).toBeHidden();

  await set(page, "results", { suites: [] });
  await expect(part(page, "results", "empty")).toHaveText("No passed tests");
  await expect(tree).toBeHidden();
});

test("a failure's stack trace takes Tab from its row, and its keys stay its own", async ({ page }) => {
  await open(page);
  const failed = row(page, "results", /^rejects a wrong password/);
  await failed.focus();
  await page.keyboard.press("Tab");
  const trigger = failed.locator('[data-slot="kind-stack-trace-trigger"]');
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(failed.locator('[data-slot="kind-stack-trace"]')).not.toHaveAttribute("data-open", "");
  await page.keyboard.press("ArrowUp");
  await expect(trigger).toBeFocused();
  await expect(failed).toHaveAttribute("aria-expanded", "true");
  expect((await host(page)).expanded).toEqual([]);

  await label(page, "results", /^rejects a wrong password/).click();
  await expect(failed).toHaveAttribute("aria-expanded", "false");
  expect((await host(page)).expanded).toEqual([[["auth"], "item-press"]]);
});

test("a live run grows without moving its header, and collapses to its counts when it passes", async ({
  page,
}) => {
  await open(page);
  const live = results(page, "live");
  await expect(live).toHaveAttribute("data-open", "");
  await expect(part(page, "live", "empty")).toHaveText("No tests");
  const trigger = part(page, "live", "trigger");
  const before = await trigger.boundingBox();
  await set(page, "live", { suites: passingSteps[0] });
  await label(page, "live", /^math/).click();
  await expect(row(page, "live", /^adds/)).toBeVisible();
  await settled(page);
  const first = await label(page, "live", /^math/).boundingBox();
  await set(page, "live", { suites: passingSteps[1] });
  await expect(row(page, "live", /^multiplies/)).toBeVisible();
  await settled(page);
  expect(await label(page, "live", /^math/).boundingBox()).toEqual(first);
  expect(await trigger.boundingBox()).toEqual(before);
  await expect(part(page, "live", "meta")).toHaveText("3 ms");

  await set(page, "live", { status: "complete" });
  await expect(live).not.toHaveAttribute("data-open", "");
  await expect(part(page, "live", "content")).toBeHidden();
  await expect(trigger).toHaveAccessibleName("Live run 3 ms");
  await expect(part(page, "live", "count")).toHaveText(["2 passed", "0 failed", "0 skipped"]);
  // A count pressed while closed opens the run to the tests it shows.
  await count(page, "live", /passed$/).click();
  await expect(live).toHaveAttribute("data-open", "");
});

test("an owner that refuses keeps the filter and open rows it holds", async ({ page }) => {
  await open(page, "refused");
  const run = results(page, "results");
  await count(page, "results", /failed$/).click();
  await expect.poll(async () => (await host(page)).filters.length).toBe(1);
  await expect(run.getByRole("button", { pressed: true })).toHaveCount(0);
  await expect(row(page, "results", /^cart/)).toBeVisible();
  await label(page, "results", /^auth/).click();
  await expect.poll(async () => (await host(page)).expanded).toEqual([[["auth/bad"], "item-press"]]);
  await expect(row(page, "results", /^auth/)).toHaveAttribute("aria-expanded", "true");
});

test("rows in a suite that opens for the first time come in with it", async ({ page }) => {
  await open(page);
  await label(page, "results", /^cart/).click();
  await expect(row(page, "results", /^adds an item/)).toBeVisible();
  const labels = await page.evaluate(
    () =>
      document.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target instanceof Element && target.getAttribute("data-slot") === "tree-label";
      }).length,
  );
  expect(labels).toBe(0);
});

test("a suite that starts failing opens", async ({ page }) => {
  await open(page);
  await set(page, "live", {
    suites: [
      {
        id: "io",
        name: "io",
        tests: [{ id: "read", name: "reads", status: "fail", error: { message: "Error: ENOENT" } }],
      },
    ],
  });
  await expect(row(page, "live", /^io/)).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, "live", /^reads/)).toHaveAttribute("aria-expanded", "true");
  expect((await host(page)).expanded.at(-1)).toEqual([["io", "io/read"], "auto"]);
});

test("agents filter, open a suite and close the run", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Tests", ["setFilter", "expand", "collapse", "press"]);
  expect(JSON.parse(await act(page, "Tests", "expand", ["cart"]))).toMatchObject({ ok: true });
  await expect(row(page, "results", /^cart/)).toHaveAttribute("aria-expanded", "true");
  await act(page, "Tests", "setFilter", ["skip"]);
  await expect(count(page, "results", /skipped$/)).toHaveAttribute("aria-pressed", "true");
  expect((await host(page)).filters.at(-1)).toEqual(["skip", "imperative:agent"]);
  expect(JSON.parse(await act(page, "Tests", "expand", ["nope"])).error.message).toContain('No item "nope"');
  await act(page, "Tests", "collapse");
  await expect(results(page, "results")).not.toHaveAttribute("data-open", "");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    // A CSS locator, since Playwright's role query on a UI SDK tree row before axe crashes Firefox.
    await page.goto("/?c=test-results&case=all");
    await expect(page.locator('#results [data-slot="tree-label"]').first()).toBeVisible();
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    // A treeitem holds its group (the WAI-ARIA tree pattern), so axe reads an open suite's rows as its visible text;
    // each row's name is checked above instead.
    const { violations } = await new AxeBuilder({ page })
      .include("#root")
      .disableRules(["label-content-name-mismatch"])
      .analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-test-results keeps its filter and open rows when put back", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  const run = results(page, "results");
  await count(page, "results", /failed$/).click();
  await label(page, "results", /^rejects/).click();
  await run.evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(el);
  });
  await expect(count(page, "results", /failed$/)).toHaveAttribute("aria-pressed", "true");
  await expect(row(page, "results", /^rejects/)).toHaveAttribute("aria-expanded", "false");
  await label(page, "results", /^auth/).click();
  await expect(row(page, "results", /^auth/)).toHaveAttribute("aria-expanded", "false");
});

test("kind-test-results fills in a filter and tree written later, with whitespace inside", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await page.goto("/?c=test-results&case=late");
  const run = results(page, "late");
  await expect(part(page, "late", "title")).toHaveText("Tests");
  await run.locator("[data-test-results-panel]").evaluate((panel) => {
    panel.innerHTML =
      "<kind-test-results-filter>\n</kind-test-results-filter><kind-test-results-tree></kind-test-results-tree>";
  });
  await expect(part(page, "late", "count")).toHaveText(["3 passed", "1 failed", "1 skipped"]);
  await expect(row(page, "late", /^auth/)).toHaveAttribute("aria-expanded", "true");
});
