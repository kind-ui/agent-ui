import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Step = { id: string; status: string; title: string; durationSeconds?: number };

type Fixture = {
  kindChain: {
    setStatus(id: string, status: string): void;
    setStatuses(statuses: Record<string, string>): void;
    append(step: Step): void;
    remove(id: string): void;
  };
  kindAnnounced: string[];
  kindOpenStepsChanges: [string[], string][];
  agent: { act(input: unknown): Promise<unknown> };
};

const chain = (page: Page) => page.locator("#chain");
const item = (page: Page, name: string) => chain(page).getByRole("listitem").filter({ hasText: name });
const stepTrigger = (page: Page, name: string) =>
  chain(page).locator('[data-slot="kind-chain-of-thought-item-trigger"]').filter({ hasText: name });
const setStatus = (page: Page, id: string, status: string) =>
  page.evaluate(([i, s]) => (window as unknown as Fixture).kindChain.setStatus(i, s), [id, status] as const);
const append = (page: Page, step: Step) =>
  page.evaluate((s) => (window as unknown as Fixture).kindChain.append(s), step);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string, args: unknown[] = []) =>
  page.evaluate(
    ([a, rest]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Researching flights", action: a, args: rest }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, args] as const,
  );

const open = async (page: Page, name = "all") => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`/?c=chain-of-thought&case=${name}`);
  await expect(stepTrigger(page, "Search flights")).toBeVisible();
};

test("shows a summary that expands into the steps, opening the running one", async ({ page }) => {
  await open(page);
  await expect(chain(page)).toHaveAttribute("data-kind", "chain-of-thought");
  await expect(page.getByRole("group", { name: "Researching flights" })).toHaveAttribute("data-open", "");
  await expect(chain(page).locator('[data-slot="kind-chain-of-thought-meta"]')).toHaveText("12 s");
  await expect(stepTrigger(page, "Search flights")).toHaveAttribute("aria-expanded", "true");
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "false");
  await expect(stepTrigger(page, "Plan the search")).toContainText("2 s");
  await expect(page.getByText("Details for Search flights.")).toBeVisible();
  await setStatus(page, "search", "complete");
  await expect(stepTrigger(page, "Search flights")).toHaveAttribute("aria-expanded", "false");
  await setStatus(page, "compare", "running");
  await expect(stepTrigger(page, "Compare fares")).toHaveAttribute("aria-expanded", "true");
});

test("without children, it renders the summary and each step's trigger", async ({ page }) => {
  await open(page);
  const plain = page.locator("#plain");
  await expect(plain.locator('[data-slot="kind-chain-of-thought-title"]')).toHaveText("Planning the trip");
  await expect(plain.locator('[data-slot="kind-chain-of-thought-item"]')).toHaveCount(1);
  await expect(plain.locator('[data-slot="kind-chain-of-thought-item-title"]')).toHaveText("Plan the search");
});

test("step triggers are one Tab stop with arrow, Home and End keys", async ({ page }) => {
  await open(page);
  await chain(page).locator('[data-slot="kind-chain-of-thought-trigger"]').focus();
  await page.keyboard.press("Tab");
  await expect(stepTrigger(page, "Plan the search")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(stepTrigger(page, "Search flights")).toBeFocused();
  await page.keyboard.press("End");
  await expect(stepTrigger(page, "Compare fares")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(stepTrigger(page, "Search flights")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(stepTrigger(page, "Plan the search")).toBeFocused();
  await expect(
    chain(page).locator('[data-slot="kind-chain-of-thought-item-trigger"][tabindex="0"]'),
  ).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(stepTrigger(page, "Search flights")).not.toBeFocused();
});

test("removing the focused step moves focus to a neighbor", async ({ page }) => {
  await open(page);
  await stepTrigger(page, "Search flights").focus();
  await page.evaluate(() => (window as unknown as Fixture).kindChain.remove("search"));
  await expect(stepTrigger(page, "Compare fares")).toBeFocused();
});

test("agents see the steps, and expand one by id or title", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Researching flights", ["collapse", "expand", "expandStep", "press"]);
  const items = await page.evaluate(
    () =>
      (window as unknown as { agent: { snapshot(): { label?: string; items?: unknown }[] } }).agent
        .snapshot()
        .find((entry) => entry.label === "Researching flights")?.items,
  );
  expect(items).toEqual([
    { value: "plan", label: "Plan the search" },
    { value: "search", label: "Search flights" },
    { value: "compare", label: "Compare fares" },
  ]);
  await act(page, "expandStep", ["plan"]);
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "true");
  await act(page, "expandStep", ["Compare fares"]);
  await expect(stepTrigger(page, "Compare fares")).toHaveAttribute("aria-expanded", "true");
  const expanded = () =>
    chain(page).locator('[data-slot="kind-chain-of-thought-item-trigger"][aria-expanded="true"]').count();
  const before = await expanded();
  expect(await act(page, "expandStep", ["missing"])).toContain("Plan the search");
  expect(await expanded()).toBe(before);
  // Expanded by an agent, the step stays open when it completes.
  await setStatus(page, "plan", "running");
  await setStatus(page, "plan", "complete");
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "true");
});

test("onOpenStepsChange reports auto and pressed changes", async ({ page }) => {
  await open(page);
  const changes = () => page.evaluate(() => (window as unknown as Fixture).kindOpenStepsChanges);
  await setStatus(page, "compare", "running");
  await expect.poll(changes).toEqual([[["search", "compare"], "auto"]]);
  await stepTrigger(page, "Plan the search").click();
  await expect.poll(changes).toEqual([
    [["search", "compare"], "auto"],
    [["search", "compare", "plan"], "trigger-press"],
  ]);
});

test("steps that end together are read as one announcement", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    (window as unknown as Fixture).kindChain.setStatuses({ search: "error", compare: "complete" }),
  );
  await expect.poll(() => announced(page)).toEqual(["Search flights failed. Compare fares complete"]);
});

test("thirty appended steps announce only their terminal transitions", async ({ page }) => {
  await open(page);
  for (let i = 0; i < 30; i++) await append(page, { id: `s${i}`, status: "running", title: `Step ${i}` });
  await expect(stepTrigger(page, "Step 29")).toBeVisible();
  expect(await announced(page)).toEqual([]);
  await setStatus(page, "s7", "complete");
  await expect.poll(() => announced(page)).toEqual(["Step 7 complete"]);
  await setStatus(page, "s7", "complete");
  await setStatus(page, "s8", "running");
  expect(await announced(page)).toEqual(["Step 7 complete"]);
});

test("appending steps doesn't move the steps above", async ({ page }) => {
  await open(page);
  const box = () => stepTrigger(page, "Search flights").boundingBox();
  const before = await box();
  for (let i = 0; i < 5; i++) await append(page, { id: `s${i}`, status: "pending", title: `Step ${i}` });
  await expect(stepTrigger(page, "Step 4")).toBeVisible();
  expect(await box()).toEqual(before);
});

test("find in page opens a closed step", async ({ page }) => {
  await open(page);
  const content = item(page, "Plan the search").locator('[data-slot="kind-chain-of-thought-item-content"]');
  await expect(content).toHaveAttribute("hidden", "until-found");
  await content.evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "true");
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-controls", /.+/);
  await expect(page.getByText("Collapsed text: kumquat plan.")).toBeVisible();
});

// Transitions started while a step opens, collected until bindPanel settles the height to `auto`.
const expandedProperties = async (page: Page, name: string) => {
  const content = item(page, name).locator('[data-slot="kind-chain-of-thought-item-content"]');
  await content.evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { seen?: string[] }).seen = seen;
    el.addEventListener("transitionstart", (event) => seen.push((event as TransitionEvent).propertyName));
  });
  await stepTrigger(page, name).click();
  await expect(content).toHaveCSS("--kind-step-content-height", "auto");
  return content.evaluate((el) => (el as HTMLElement & { seen?: string[] }).seen ?? []);
};

test("full motion animates a step's height; reduced motion animates none", async ({ page }) => {
  await open(page);
  expect(await expandedProperties(page, "Plan the search")).toContain("height");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await expandedProperties(page, "Plan the search")).not.toContain("height");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "reduced");
  const reduced = await expandedProperties(page, "Plan the search");
  expect(reduced.filter((p) => p === "height" || p === "transform")).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await page.locator("#plain [data-slot='kind-chain-of-thought-trigger']").click();
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-chain-of-thought adds and removes the items it writes", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  const plain = page.locator("#plain");
  await plain.evaluate((el: HTMLElement & { steps: Step[] }) => {
    el.steps = [
      { id: "a", status: "complete", title: "First" },
      { id: "b", status: "running", title: "Second", durationSeconds: 3 },
    ];
  });
  await expect(plain.locator('[data-slot="kind-chain-of-thought-item-title"]')).toHaveText([
    "First",
    "Second",
  ]);
  await expect(plain.locator('[data-slot="kind-chain-of-thought-item-meta"]').nth(1)).toHaveText("3 s");
  await plain.evaluate((el: HTMLElement & { steps: Step[] }) => {
    el.steps = [{ id: "b", status: "complete", title: "Second" }];
  });
  await expect(plain.locator('[data-slot="kind-chain-of-thought-item-title"]')).toHaveText(["Second"]);
  expect(
    await plain.evaluate((el: HTMLElement & { api: { expandStep(id: string): boolean } }) => [
      el.api.expandStep("b"),
      el.api.expandStep("b"),
    ]),
  ).toEqual([true, false]);
});

test("kind-chain-of-thought keeps its open steps when moved", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await stepTrigger(page, "Plan the search").click();
  await chain(page).evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.prepend(el);
  });
  await expect(stepTrigger(page, "Plan the search")).toHaveAttribute("aria-expanded", "true");
  await expect(stepTrigger(page, "Search flights")).toHaveAttribute("aria-expanded", "true");
});

test("kind-chain-of-thought gives way to an item written after its step", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await chain(page).evaluate((el: HTMLElement & { steps: Step[] }) => {
    el.steps = [...el.steps, { id: "late", status: "running", title: "Late" }];
  });
  await expect(stepTrigger(page, "Late")).toBeVisible();
  await chain(page).evaluate((el) => {
    const late = document.createElement("kind-chain-of-thought-item");
    late.setAttribute("value", "late");
    late.innerHTML =
      "<kind-chain-of-thought-item-content><p>Late details.</p></kind-chain-of-thought-item-content>";
    el.querySelector("kind-chain-of-thought-list")?.append(late);
  });
  await expect(page.getByText("Late details.")).toBeVisible();
  await expect(stepTrigger(page, "Late")).toHaveCount(1);
});

test("kind-chain-of-thought leaves a chain nested in a step's content alone", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await chain(page).evaluate((el: HTMLElement & { steps: Step[] }) => {
    const sub = document.createElement("kind-chain-of-thought-item");
    sub.setAttribute("value", "sub");
    const content = document.createElement("kind-chain-of-thought-item-content");
    const inner = document.createElement("kind-chain-of-thought");
    inner.id = "inner";
    Object.assign(inner, { label: "Inner", steps: [{ id: "i1", status: "complete", title: "Inner step" }] });
    content.append(inner);
    sub.append(content);
    el.querySelector("kind-chain-of-thought-list")?.append(sub);
    el.steps = [...el.steps, { id: "sub", status: "running", title: "Sub-agent" }];
  });
  await expect(stepTrigger(page, "Sub-agent")).toHaveCount(1);
  await expect(page.locator('#inner [data-slot="kind-chain-of-thought-item-title"]')).toHaveText(
    "Inner step",
  );
});
