import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Call = {
  action: string;
  answers: Record<string, unknown>;
  source: string;
  resolve(): void;
  reject(): void;
};
type Fixture = {
  kindHost: { calls: Call[]; permit: boolean };
  kindQuestion: { record(answers: unknown): void };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const form = (page: Page) => page.getByRole("form", { name: "Deploy questions" });
const submit = (page: Page) => form(page).getByRole("button", { name: "Submit" });
const skip = (page: Page) => form(page).getByRole("button", { name: "Skip" });
const part = (page: Page, name: string) =>
  page.locator(`#deploy [data-slot="kind-question-${name}"]:not([hidden])`);
const calls = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.calls.map(({ action, answers, source }) => ({
      action,
      answers,
      source,
    })),
  );
const settle = (page: Page, index: number, outcome: "resolve" | "reject") =>
  page.evaluate(([i, o]) => (window as unknown as Fixture).kindHost.calls[i]?.[o](), [
    index,
    outcome,
  ] as const);
const record = (page: Page, answers: unknown) =>
  page.evaluate((a) => (window as unknown as Fixture).kindQuestion.record(a), answers);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string, args: unknown[] = []) =>
  page.evaluate(
    ([a, i]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Deploy questions", action: a, args: i }] })
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
  await page.goto(`/?c=question&case=${name}`);
  await expect(submit(page)).toBeVisible();
};

const answerRequired = (page: Page) =>
  form(page)
    .getByRole("radio", { name: /Production/ })
    .click();

test("a form named by its label, with a group named by each prompt", async ({ page }) => {
  await open(page);
  await expect(form(page)).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(form(page).getByRole("group", { name: "Where should it deploy? Required" })).toBeVisible();
  await expect(form(page).getByRole("group", { name: "Which checks should run first?" })).toBeVisible();
  await expect(
    form(page).getByRole("textbox", { name: "Anything the reviewers should know?" }),
  ).toBeVisible();
  await expect(submit(page)).toHaveAttribute("aria-disabled", "true");
  await expect(skip(page)).not.toHaveAttribute("aria-disabled");
});

test("each choice group is one Tab stop, and Enter in the text box adds a line", async ({ page }) => {
  await open(page);
  await page.locator("#above").click();
  await page.keyboard.press("Tab");
  await expect(form(page).getByRole("radio", { name: /Staging/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(form(page).getByRole("radio", { name: /Production/ })).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(form(page).getByRole("checkbox", { name: "Unit tests" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(form(page).getByRole("checkbox", { name: "Unit tests" })).toBeChecked();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const notes = form(page).getByRole("textbox");
  await expect(notes).toBeFocused();
  await page.keyboard.type("One");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Two");
  await expect(notes).toHaveValue("One\nTwo");
  expect(await calls(page)).toEqual([]);
  await expect(submit(page)).not.toHaveAttribute("aria-disabled");
  await submit(page).click();
  expect(await calls(page)).toEqual([
    { action: "submit", answers: { env: "prod", checks: ["unit"], notes: "One\nTwo" }, source: "mouse" },
  ]);
});

test("Enter on a choice submits the form once every required question has an answer", async ({ page }) => {
  await open(page);
  await form(page)
    .getByRole("radio", { name: /Staging/ })
    .focus();
  await page.keyboard.press("Enter");
  expect(await calls(page)).toEqual([]);
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  expect((await calls(page)).map(({ action, answers }) => ({ action, answers }))).toEqual([
    { action: "submit", answers: { env: "staging" } },
  ]);
});

test("Submit then Skip within one task calls the host once", async ({ page }) => {
  await open(page);
  await answerRequired(page);
  await form(page).evaluate((root) => {
    for (const name of ["submit", "skip"])
      root
        .querySelector<HTMLElement>(
          `button[data-slot="kind-question-${name}"], [data-slot="kind-question-${name}"] button`,
        )
        ?.click();
  });
  await expect(submit(page)).toHaveAttribute("aria-disabled", "true");
  await expect(skip(page)).toHaveAttribute("aria-disabled", "true");
  await expect(part(page, "status")).toHaveText("Sending answers");
  expect((await calls(page)).map((call) => call.action)).toEqual(["submit"]);
});

test("a rejected submit keeps every answer and offers it again", async ({ page }) => {
  await open(page);
  await answerRequired(page);
  await form(page).getByRole("checkbox", { name: "End-to-end tests" }).click();
  await form(page).getByRole("textbox").fill("Ship it");
  await submit(page).click();
  await settle(page, 0, "reject");
  await expect(part(page, "error")).toHaveText("Answers not sent. Try again.");
  await expect(submit(page)).not.toHaveAttribute("aria-disabled");
  await expect(form(page).getByRole("radio", { name: /Production/ })).toBeChecked();
  await expect(form(page).getByRole("checkbox", { name: "End-to-end tests" })).toBeChecked();
  await expect(form(page).getByRole("textbox")).toHaveValue("Ship it");
  await expect.poll(() => announced(page)).toEqual(["Answers not sent"]);
  await submit(page).click();
  await expect(part(page, "error")).toHaveCount(0);
  expect((await calls(page))[1]?.answers).toEqual({ env: "prod", checks: ["e2e"], notes: "Ship it" });
});

test("the recorded answers replace the form, and only the page below moves, by the height difference", async ({
  page,
}) => {
  await open(page);
  const top = (id: string) =>
    page.evaluate((i) => document.getElementById(i)?.getBoundingClientRect().top, id);
  const height = () => form(page).evaluate((el) => el.getBoundingClientRect().height);
  const above = await top("above");
  const below = await top("below");
  const before = await height();
  await answerRequired(page);
  await submit(page).focus();
  await page.keyboard.press("Enter");
  await settle(page, 0, "resolve");
  await expect(part(page, "status")).toBeVisible();
  await record(page, { env: "prod", notes: "Ship it" });
  await expect(part(page, "summary")).toBeVisible();
  await expect(part(page, "summary")).toBeFocused();
  await expect(part(page, "summary").locator("dd")).toHaveText(["Production", "No answer", "Ship it"]);
  await expect(part(page, "summary")).toContainText("Answered");
  await expect(form(page).getByRole("button")).toHaveCount(0);
  expect(await top("above")).toBe(above);
  expect(await top("below")).toBeCloseTo((below ?? 0) + (await height()) - before, 0);
  await expect.poll(() => announced(page)).toEqual(["Answered"]);
});

// UI SDK marks a whole component, so while `agentConfirm` is on every action of it needs a person.
test("an agent answers and submits once a person allows it", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Deploy questions", ["select", "setText", "skip"]);
  expect(await act(page, "select", ["env", "prod"])).toContain("The person said no");
  await expect(form(page).getByRole("radio", { name: /Production/ })).not.toBeChecked();
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.permit = true;
  });
  expect(await act(page, "select", ["region", "eu"])).not.toContain('"ok":true');
  expect(await act(page, "select", ["env", "prod"])).toContain('"ok":true');
  await expect(form(page).getByRole("radio", { name: /Production/ })).toBeChecked();
  await expectAgentActions(page, "Deploy questions", ["select", "setText", "submit", "skip"]);
  expect(await calls(page)).toEqual([]);
  expect(await act(page, "submit")).toContain('"ok":true');
  expect(await calls(page)).toEqual([{ action: "submit", answers: { env: "prod" }, source: "agent" }]);
});

test("with reduced motion the summary only fades", async ({ page }) => {
  // Records the properties each animation of the summary moves.
  await page.addInitScript(() => {
    const moved: string[] = [];
    Object.assign(window, { kindMoved: moved });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this.matches('[data-slot="kind-question-summary"]') && keyframes)
        for (const frame of Array.isArray(keyframes) ? keyframes : [keyframes])
          moved.push(...Object.keys(frame).filter((key) => !["offset", "easing", "composite"].includes(key)));
      return animate.call(this, keyframes, options);
    };
  });
  await open(page, "reduced");
  await record(page, {});
  await expect(part(page, "summary")).toContainText("Skipped");
  await expect
    .poll(() => page.evaluate(() => [...new Set((window as unknown as { kindMoved: string[] }).kindMoved)]))
    .toEqual(["opacity"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    await answerRequired(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
