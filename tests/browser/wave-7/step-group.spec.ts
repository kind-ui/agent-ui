import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { StepGroupHost } from "../../../packages/agent-ui/tests/fixtures/shared/step-group.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";

type Fixture = { kindStepGroup: StepGroupHost };

const part = (page: Page, id: string, name: string) =>
  page.locator(`#${id} [data-slot="kind-step-group-${name}"]`);
const stopAll = (page: Page) => part(page, "agents", "cancel");
const approvals = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindStepGroup.approvals);
const cancels = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindStepGroup.cancels.length);
const setStatus = (page: Page, id: string, status: string) =>
  page.evaluate(([i, s]) => (window as unknown as Fixture).kindStepGroup.setStatus(i, s as never), [
    id,
    status,
  ] as const);

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=step-group&case=${name}`);
  await expect(part(page, "tools", "title")).toHaveText("Read 2 files and ran 1 command");
};

test("sums up its steps in words, with the running count and the group's status", async ({ page }) => {
  await open(page);
  const root = page.locator("#tools");
  await expect(root).toHaveAccessibleName("Read 2 files and ran 1 command");
  await expect(root).toHaveAttribute("data-kind", "step-group");
  await expect(root).toHaveAttribute("data-status", "running");
  await expect(part(page, "tools", "meta")).toHaveText("1 running");
  await expect(part(page, "tools", "trigger")).toHaveAttribute("aria-expanded", "true");
  await expect(part(page, "agents", "title")).toHaveText("3 agents");
  await expect(part(page, "agents", "meta")).toHaveText("2 running");
  await expect(part(page, "plain", "title")).toHaveText("Checked the build");
});

test("folds to its summary when every step completes", async ({ page }) => {
  await open(page);
  await setStatus(page, "run", "complete");
  await expect(page.locator("#tools")).toHaveAttribute("data-status", "complete");
  await expect(part(page, "tools", "trigger")).toHaveAttribute("aria-expanded", "false");
  await expect(part(page, "tools", "meta")).toHaveText("8 s");
});

test("stays open when a step fails", async ({ page }) => {
  await open(page);
  await setStatus(page, "run", "error");
  await expect(page.locator("#tools")).toHaveAttribute("data-status", "error");
  await expect(part(page, "tools", "trigger")).toHaveAttribute("aria-expanded", "true");
});

test("a step's approval inside it works by keyboard", async ({ page }) => {
  await open(page);
  await expect(page.locator("#approval")).toHaveAttribute("data-status", "awaiting-input");
  await page.locator("#approval").getByRole("button", { name: "Approve" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => approvals(page)).toEqual(["keyboard"]);
});

test("arrow keys move between the steps' triggers, one Tab stop for the list", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Code reviewer" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Docs writer" })).toBeFocused();
  await expect(page.locator('#agents [data-step-part="list"] [tabindex="0"]')).toHaveCount(1);
});

test("Stop all calls onCancel once while pending, and leaves once nothing runs", async ({ page }) => {
  await open(page);
  await expect(stopAll(page)).toHaveText("Stop all");
  await expect(part(page, "tools", "cancel")).toBeHidden();
  await stopAll(page).dblclick();
  await expect(stopAll(page)).toHaveAttribute("aria-disabled", "true");
  expect(await cancels(page)).toBe(1);
  await page.evaluate(() => (window as unknown as Fixture).kindStepGroup.cancels[0]?.reject());
  await expect(stopAll(page)).not.toHaveAttribute("aria-disabled");
  await stopAll(page).focus();
  await setStatus(page, "reviewer", "complete");
  await setStatus(page, "writer", "cancelled");
  await expect(stopAll(page)).toBeHidden();
  await expect(part(page, "agents", "trigger")).toBeFocused();
});

test("offers expand, collapse and cancel to an agent", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "3 agents", ["cancel", "collapse", "expand", "press"]);
  await expectAgentActions(page, "Read 2 files and ran 1 command", ["collapse", "expand", "press"]);
});

for (const [name, setup] of [
  ["motion reduced", (page: Page) => open(page, "reduced")],
  [
    "prefers-reduced-motion",
    async (page: Page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page);
    },
  ],
] as const) {
  test(`with ${name}, the steps only fade for 120 ms`, async ({ page }) => {
    await setup(page);
    const transition = await part(page, "tools", "content").evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition.property).not.toContain("height");
    expect(transition.duration).toContain("0.12s");
  });
}

test("fills a title or meta part written after it connects", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements fill their own parts");
  await open(page);
  const meta = await page.evaluate(async () => {
    const group = document.createElement("kind-step-group");
    group.items = [{ id: "a", status: "running" }];
    group.innerHTML =
      "<kind-step-group-trigger><button><kind-step-group-title> </kind-step-group-title></button></kind-step-group-trigger>";
    document.querySelector("#root")?.append(group);
    group.querySelector("button")?.append(document.createElement("kind-step-group-meta"));
    await new Promise(requestAnimationFrame);
    return [
      group.querySelector("kind-step-group-title")?.textContent,
      group.querySelector("kind-step-group-meta")?.textContent,
    ];
  });
  expect(meta).toEqual(["1 step", "1 running"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
