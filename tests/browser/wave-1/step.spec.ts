import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Steps = { kindSteps: { setStatus(id: string, status: string): void; remove(id: string): void } };

const open = async (page: Page, name = "list") => {
  await page.goto(`/?c=step&case=${name}`);
  await expect(page.locator('[data-slot="kind-step"]').first()).toHaveAttribute("data-status", /.+/);
};
const trigger = (page: Page, name: string) => page.getByRole("button", { name });
const step = (page: Page, name: string) => page.getByRole("group", { name });
const setStatus = (page: Page, id: string, status: string) =>
  page.evaluate(([i, s]) => (window as unknown as Steps).kindSteps.setStatus(i, s), [id, status] as const);

test("auto-opens running steps and reflects status", async ({ page }) => {
  await open(page);
  await expect(step(page, "Search the web")).toHaveAttribute("data-open", "");
  await expect(step(page, "Search the web")).toHaveAttribute("data-kind", "tool");
  await expect(trigger(page, "Search the web")).toHaveAttribute("aria-expanded", "true");
  await expect(step(page, "Plan the answer")).not.toHaveAttribute("data-open");
  await setStatus(page, "search", "complete");
  await expect(step(page, "Search the web")).not.toHaveAttribute("data-open");
});

test("beforematch on hidden content opens the step", async ({ page }) => {
  await open(page);
  const content = step(page, "Draft the summary").locator('[data-slot="kind-step-content"]');
  await expect(content).toHaveAttribute("hidden", "until-found");
  await content.evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(step(page, "Draft the summary")).toHaveAttribute("data-open", "");
  await expect(page.getByText("Collapsed text: kumquat.")).toBeVisible();
});

test("StepList has one Tab stop and arrow, Home, End navigation", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(trigger(page, "Plan the answer")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(trigger(page, "Search the web")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(trigger(page, "Plan the answer")).toBeFocused();
  await page.keyboard.press("End");
  await expect(trigger(page, "Old attempt")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(trigger(page, "Plan the answer")).toBeFocused();
  await expect(page.locator('[data-slot="kind-step-trigger"][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(step(page, "Plan the answer")).toHaveAttribute("data-open", "");
});

test("removing the focused step moves focus to a sibling trigger", async ({ page }) => {
  await open(page);
  await trigger(page, "Run deploy script").focus();
  await page.evaluate(() => (window as unknown as Steps).kindSteps.remove("approve"));
  await expect(trigger(page, "Fetch changelog")).toBeFocused();
});

test("announces terminal transitions only", async ({ page }) => {
  await open(page);
  const announced = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[aria-live]")].map((el) => el.textContent ?? "").join("|"),
    );
  for (let i = 0; i < 20; i++) await setStatus(page, "search", "running");
  expect(await announced()).not.toContain("Search the web");
  await setStatus(page, "search", "complete");
  await expect.poll(announced).toContain("Search the web complete");
});

test("durationSeconds sets --kind-step-duration", async ({ page }) => {
  await open(page);
  await expect(step(page, "Search the web")).toHaveCSS("--kind-step-duration", "3s");
});

// Transitions started while the step opens, collected until bindPanel settles the height to `auto`.
const expandedProperties = async (page: Page, title: string) => {
  const content = step(page, title).locator('[data-slot="kind-step-content"]');
  await content.evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await trigger(page, title).click();
  await expect(content).toHaveCSS("--kind-step-content-height", "auto");
  return content.evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("full motion animates height; reduced motion animates no height or transform", async ({ page }) => {
  await open(page);
  expect(await expandedProperties(page, "Draft the summary")).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await expandedProperties(page, "Draft the summary")).not.toContain("height");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  const reduced = await expandedProperties(page, "Reduced");
  expect(reduced.filter((p) => p === "height" || p === "transform")).toEqual([]);
});

test("reduced motion stops the chevron, spinner and shimmer", async ({ page }) => {
  const stillness = (name: string) =>
    trigger(page, name).evaluate((el) => {
      const icon = el.querySelector('[data-slot="kind-step-icon"]') as Element;
      const title = el.querySelector('[data-slot="kind-step-title"]') as Element;
      return [
        getComputedStyle(el, "::after").transitionDuration,
        getComputedStyle(icon, "::before").animationName,
        getComputedStyle(title).animationName,
      ];
    });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await setStatus(page, "draft", "running");
  expect(await stillness("Draft the summary")).toEqual(["0s", "none", "none"]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("[data-status]")) el.setAttribute("data-status", "running");
  });
  expect(await stillness("Reduced")).toEqual(["0s", "none", "none"]);
});

test("has no axe violations", async ({ page }) => {
  await open(page);
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

test("is a live UI SDK primitive agents can collapse", async ({ page }) => {
  await open(page);
  // `press` is the bridge's own action for a component that holds a button (here, the trigger).
  await expectAgentActions(page, "Search the web", ["collapse", "expand", "press"]);
  await page.evaluate(() =>
    (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
      steps: [{ ref: "Search the web", action: "collapse" }],
    }),
  );
  await expect(step(page, "Search the web")).not.toHaveAttribute("data-open");
});

test("kind-step exposes live open state and its api", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wave-1-web", "web elements only");
  await open(page);
  const el = step(page, "Plan the answer");
  type KindStep = HTMLElement & { open: boolean; api: { isOpen(): boolean; collapse(): boolean } };
  expect(await el.evaluate((s: KindStep) => s.open)).toBe(false);
  await el.evaluate((s: KindStep) => {
    s.open = true;
  });
  await expect(el).toHaveAttribute("data-open", "");
  expect(await el.evaluate((s: KindStep) => [s.open, s.api.isOpen()])).toEqual([true, true]);
  await el.evaluate((s: KindStep) => s.api.collapse());
  await expect(el).not.toHaveAttribute("data-open");
});

test("setting kind-step open keeps auto close", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wave-1-web", "web elements only");
  await open(page);
  const el = step(page, "Draft the summary");
  await el.evaluate((s: HTMLElement & { open: boolean }) => {
    s.open = true;
  });
  await setStatus(page, "draft", "running");
  await setStatus(page, "draft", "complete");
  await expect(el).not.toHaveAttribute("data-open");
});
