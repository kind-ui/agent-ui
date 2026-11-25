import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { FlowGraphHost } from "../../../packages/agent-ui/tests/fixtures/shared/flow-graph.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = { kindHost: FlowGraphHost; agent: { act(input: unknown): Promise<unknown> } };

const frame = (page: Page) => page.getByRole("group", { name: "Refund flow" });
const node = (page: Page, name: string) => frame(page).getByRole("button", { name: new RegExp(`^${name},`) });
const world = (page: Page) => page.locator('[data-flow-graph-part="world"]');
const zoom = (page: Page) =>
  world(page).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
const changes = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.changes);
const focusedName = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
const load = async (page: Page, name = "all") => {
  await page.goto(`/?c=flow-graph&case=${name}`);
  await expect(node(page, "Router")).toBeVisible();
  // The first fit lands a frame after the graph binds.
  await expect.poll(() => zoom(page)).toBeLessThan(1);
};

test("an agent can select a node, fit and zoom", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await load(page);
  await expectAgentActions(page, "Refund flow", ["select", "fit", "zoomIn", "zoomOut", "press"]);
  const result = await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({
      steps: [{ ref: "Refund flow", action: "select", args: ["billing"] }],
    }),
  );
  expect(JSON.stringify(result)).not.toContain("error");
  await expect(node(page, "Billing")).toHaveAttribute("aria-pressed", "true");
  expect(await changes(page)).toEqual([{ value: "billing", reason: "imperative", source: "agent" }]);
});

test("each node is named by its label, kind and status, and described by its edges", async ({ page }) => {
  await load(page);
  await expect(node(page, "Billing")).toHaveAccessibleName("Billing, Agent, Running");
  await expect(node(page, "Billing")).toHaveAccessibleDescription(
    "Hands off to Issue refund. Hands off to Finance lead: approval. Receives from Router: refund request, running.",
  );
  await expect(node(page, "Router")).toHaveAccessibleDescription(
    "Triages requests. Hands off to Search docs. Hands off to Billing: refund request, running.",
  );
  await expect(page.locator('[data-flow-graph-part="edges"] path')).toHaveCount(4);
});

test("Tab reaches one node; arrows move to the nearest node that way", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await expect(node(page, "Router")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  expect(await focusedName(page)).toMatch(/^(Search docs|Billing),/);
  await page.keyboard.press("ArrowLeft");
  await expect(node(page, "Router")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(frame(page).getByRole("button", { name: "Zoom in" })).toBeFocused();
});

test("Enter and a press select a node", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(node(page, "Router")).toHaveAttribute("aria-pressed", "true");
  await node(page, "Billing").click();
  await expect(node(page, "Billing")).toHaveAttribute("aria-pressed", "true");
  await expect(node(page, "Router")).toHaveAttribute("aria-pressed", "false");
  expect((await changes(page)).map(({ value, reason }) => `${value} ${reason}`)).toEqual([
    "router node-press",
    "billing node-press",
  ]);
});

test("+, − and 0 zoom from the graph, and the controls zoom and fit", async ({ page }) => {
  await load(page);
  const fitted = await zoom(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("+");
  await expect.poll(() => zoom(page)).toBeGreaterThan(fitted);
  await page.keyboard.press("0");
  await expect.poll(() => zoom(page)).toBeCloseTo(1);
  await page.keyboard.press("-");
  await expect.poll(() => zoom(page)).toBeLessThan(1);
  await frame(page).getByRole("button", { name: "Fit to view" }).click();
  await expect.poll(() => zoom(page)).toBeCloseTo(fitted);
  await frame(page).getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => zoom(page)).toBeCloseTo(fitted * 1.25);
});

test("focus brings a node out of view into view", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  for (let i = 0; i < 6; i++) await page.keyboard.press("+");
  await expect.poll(() => zoom(page)).toBeGreaterThan(2);
  const inView = (name: string) =>
    node(page, name).evaluate((el) => {
      const box = el.getBoundingClientRect();
      const bounds = (el.closest('[data-flow-graph-part="root"]') as Element).getBoundingClientRect();
      return (
        box.left >= bounds.left && box.right <= bounds.right && box.top >= bounds.top && box.bottom <= bounds.bottom
      );
    });
  await page.keyboard.press("End");
  const last = (await focusedName(page))?.split(",")[0] as string;
  await expect.poll(() => inView(last)).toBe(true);
  await page.keyboard.press("Home");
  await expect.poll(() => inView("Router")).toBe(true);
});

test("a status change keeps every node where it was", async ({ page }) => {
  await load(page);
  const boxes = () =>
    page
      .locator('[data-flow-graph-part="node"]')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).style.cssText));
  const before = await boxes();
  await page.evaluate(() => (window as unknown as Fixture).kindHost.advance());
  await expect(node(page, "Billing")).toHaveAccessibleName("Billing, Agent, Done");
  await expect(node(page, "Issue refund")).toHaveAccessibleName("Issue refund, Tool, Running");
  expect(await boxes()).toEqual(before);
});

test("direction down lays the graph out top to bottom", async ({ page }) => {
  await load(page, "down");
  const top = (name: string) => node(page, name).evaluate((el) => el.getBoundingClientRect().top);
  expect(await top("Router")).toBeLessThan(await top("Billing"));
});

test("zooming eases at full motion and jumps under reduced motion", async ({ page }) => {
  const duration = async () => {
    await frame(page).getByRole("button", { name: "Zoom in" }).click();
    return world(page).evaluate((el) => getComputedStyle(el).transitionDuration);
  };
  await load(page);
  expect(await duration()).toBe("0.2s");
  await load(page, "reduced");
  expect(await duration()).toBe("0s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await load(page);
  expect(await duration()).toBe("0s");
});

for (const scheme of ["light", "dark"] as const) {
  test(`has no axe violations in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await node(page, "Billing").click();
    const results = await new AxeBuilder({ page }).include("#flow").analyze();
    expect(results.violations).toEqual([]);
  });
}
