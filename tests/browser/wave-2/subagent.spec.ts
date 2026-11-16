import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindSubagent: { setStatus(status: string): void; append(name: string): void };
  kindCancels: { resolve(): void; reject(): void }[];
  agent: { act(input: unknown): Promise<unknown> };
};

const part = (page: Page, id: string, name: string) =>
  page.locator(`#${id} [data-slot="kind-subagent-${name}"]`);
const cancel = (page: Page, id = "subagent") => part(page, id, "cancel").filter({ hasText: "Stop" });
const cancels = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindCancels.length);
const setStatus = (page: Page, status: string) =>
  page.evaluate((s) => (window as unknown as Fixture).kindSubagent.setStatus(s), status);
const act = (page: Page, ref: string, action: string) =>
  page.evaluate(
    ([r, a]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action] as const,
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=subagent&case=${name}`);
  await expect(page.getByRole("button", { name: "read_file" })).toBeVisible();
};

test("shows the subagent's name, initials, status and nested steps", async ({ page }) => {
  await open(page);
  const root = page.locator("#subagent");
  await expect(root).toHaveAttribute("data-kind", "subagent");
  await expect(root).toHaveAccessibleName("Code reviewer");
  await expect(part(page, "subagent", "avatar")).toHaveText("CR");
  await expect(part(page, "subagent", "meta")).toHaveText("Working");
  await expect(part(page, "subagent", "result")).toBeHidden();
});

test("nested steps keep their own single Tab stop", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "read_file" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "grep" })).toBeFocused();
  await expect(page.locator('#subagent [data-step-part="list"] [tabindex="0"]')).toHaveCount(1);
});

test("the result shows on complete, and Stop goes away with focus on the trigger", async ({ page }) => {
  await open(page);
  await expect(part(page, "done", "result")).toContainText("Found 2 issues");
  await expect(part(page, "done", "meta")).toHaveText("Done in 4 s");
  await cancel(page).focus();
  await setStatus(page, "complete");
  await expect(part(page, "subagent", "result")).toContainText("Found 2 issues");
  await expect(cancel(page)).toBeHidden();
  await expect(part(page, "subagent", "trigger")).toBeFocused();
  await expect(part(page, "subagent", "meta")).toHaveText("Done in 12 s");
});

test("Stop is absent without onCancel", async ({ page }) => {
  await open(page);
  await expect(cancel(page, "readonly")).toBeHidden();
  await expect(cancel(page, "quick")).toBeVisible();
  await expect(cancel(page, "done")).toBeHidden();
});

test("a double press on Stop calls the host once, and a rejection enables it again", async ({ page }) => {
  await open(page);
  await cancel(page).dblclick();
  await expect(cancel(page)).toHaveAttribute("aria-disabled", "true");
  expect(await cancels(page)).toBe(1);
  await cancel(page).click({ force: true });
  expect(await cancels(page)).toBe(1);
  await page.evaluate(() => (window as unknown as Fixture).kindCancels[0]?.reject());
  await expect(cancel(page)).not.toHaveAttribute("aria-disabled");
  await cancel(page).click();
  expect(await cancels(page)).toBe(2);
});

test("an agent's cancel needs a person unless agentConfirm is off", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Code reviewer", ["cancel", "collapse", "expand", "press"]);
  await expectAgentActions(page, "Test runner", ["collapse", "expand", "press"]);
  await expectAgentActions(page, "Release notes bot", ["collapse", "expand", "press"]);
  expect(await act(page, "Code reviewer", "cancel")).toContain("Needs a person");
  expect(await cancels(page)).toBe(0);
  expect(await act(page, "Docs writer", "cancel")).toContain('"ok":true');
});

test("nested steps streaming in don't move the header", async ({ page }) => {
  await open(page);
  const header = () =>
    part(page, "subagent", "trigger").evaluate((el) => el.getBoundingClientRect().toJSON());
  const before = await header();
  await page.evaluate(() => (window as unknown as Fixture).kindSubagent.append("run_tests"));
  await expect(page.getByRole("button", { name: "run_tests" })).toBeVisible();
  expect(await header()).toEqual(before);
});

test("with motion reduced, the steps and result only fade for 120 ms", async ({ page }) => {
  await open(page, "reduced");
  await setStatus(page, "complete");
  const transition = (name: string) =>
    part(page, "subagent", name).evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
  expect(await transition("result")).toEqual({ property: "opacity", duration: "0.12s" });
  expect((await transition("content")).property).not.toContain("height");
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

test("kind-subagent moves steps appended to it into its children part", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await page.evaluate(() => {
    const step = document.createElement("p");
    step.textContent = "Late step";
    document.getElementById("readonly")?.append(step);
  });
  await expect(page.locator('#readonly [data-slot="kind-subagent-children"] > p')).toHaveText("Late step");
});
