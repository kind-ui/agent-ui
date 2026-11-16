import { expect, type Page, test } from "@playwright/test";
import {
  act,
  actionsOf,
  type Conformance,
  components,
  entry,
  expectSameAsPerson,
  host,
  setConfirm,
  setHost,
  settled,
  snapshot,
} from "../agent-conformance.js";
import { allowClipboard } from "../clipboard.js";
import { layerOf } from "../layer.js";

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-3");
  await expect.poll(() => components(page)).toContain("kind-guardrail-notice");
  await settled(page);
};
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);

const confirmation = { component: "kind-confirmation", label: "Run the migration?", id: "confirmation" };
const toolApproval = { component: "kind-confirmation", label: "Run delete_file?", id: "delete_file" };
const question = { component: "kind-question", label: "Deploy questions", id: "question" };
const checkpoint = { component: "kind-checkpoint", label: "Checkpoint", id: "checkpoint" };
const model = { component: "kind-model-selector", label: "Model", id: "model" };
const effort = { component: "kind-reasoning-effort", label: "Reasoning effort", id: "effort" };
const context = { component: "kind-context-meter", label: "Context", id: "context" };
const suggestion = { component: "kind-suggestion", label: "Suggestions", id: "suggestion" };
const feedback = { component: "kind-feedback", label: "Feedback", id: "feedback" };
const notice = { component: "kind-notice", label: "Rate limited", id: "notice" };
const guardrail = { component: "kind-guardrail-notice", label: "Model output withheld", id: "guardrail" };

const wave3 = [
  confirmation,
  question,
  checkpoint,
  model,
  effort,
  context,
  suggestion,
  feedback,
  notice,
  guardrail,
];

const button = (id: string, name: string | RegExp) => (page: Page) =>
  byId(id)(page).getByRole("button", { name, exact: true });
const radio = (id: string, name: RegExp) => (page: Page) => byId(id)(page).getByRole("radio", { name });
const contextTrigger = (page: Page) =>
  byId("context")(page).locator('[data-slot="kind-context-meter-trigger"]');
const press = (id: string, name: string | RegExp) => (page: Page) => button(id, name)(page).click();

/** Answers the required question the way a person does, so Submit is offered. */
const answerRequired = async (page: Page) => {
  await radio("question", /Staging/)(page).click();
  await expect.poll(() => actionsOf(page, question.component, question.label)).toContain("submit");
};
const rateUp = async (page: Page) => {
  await button("feedback", "Good response")(page).click();
  await expect.poll(() => actionsOf(page, feedback.component, feedback.label)).toContain("submitComment");
};
const openDetails = async (page: Page) => {
  await contextTrigger(page).click();
  await expect.poll(async () => (await entry(page, context.component, context.label))?.open).toBe(true);
  await settled(page);
};

const conformance: Conformance[] = [
  { target: confirmation, action: "approve", pointer: press("confirmation", "Approve") },
  { target: confirmation, action: "deny", pointer: press("confirmation", "Deny") },
  { target: toolApproval, action: "approve", pointer: press("delete_file", "Approve") },
  { target: toolApproval, action: "deny", pointer: press("delete_file", "Deny") },
  {
    target: question,
    action: "select",
    args: ["env", "prod"],
    pointer: (page) => radio("question", /Production/)(page).click(),
  },
  {
    target: question,
    action: "setText",
    args: ["notes", "Ship it"],
    pointer: (page) => byId("question")(page).getByRole("textbox").fill("Ship it"),
  },
  { target: question, action: "submit", before: answerRequired, pointer: press("question", "Submit") },
  { target: question, action: "skip", pointer: press("question", "Skip") },
  {
    target: checkpoint,
    action: "restore",
    pointer: (page) => button("checkpoint", "Restore checkpoint")(page).press("Enter"),
  },
  {
    target: model,
    action: "setValue",
    args: ["sonnet-4"],
    ignore: '[data-slot="combobox-content"]',
    pointer: async (page) => {
      await byId("model")(page).locator('[data-slot="combobox-trigger"]').click();
      await page.getByRole("listbox").getByRole("option", { name: "Sonnet 4" }).click();
    },
  },
  {
    target: effort,
    action: "setValue",
    args: ["high"],
    pointer: (page) => radio("effort", /^High$/)(page).click(),
  },
  { target: context, action: "open", pointer: (page) => contextTrigger(page).click() },
  { target: context, action: "close", before: openDetails, pointer: (page) => contextTrigger(page).click() },
  { target: suggestion, action: "pick", args: ["b"], pointer: press("suggestion", /^Draft a reply/) },
  { target: feedback, action: "rate", args: ["up"], pointer: press("feedback", "Good response") },
  {
    target: feedback,
    action: "submitComment",
    args: ["Wrong file"],
    ignore: '[data-slot="kind-feedback-content"]',
    before: rateUp,
    pointer: async (page) => {
      await button("feedback", "Add a comment")(page).click();
      const box = page.getByRole("dialog", { name: "Add a comment" });
      await box.getByRole("textbox", { name: "Comment" }).fill("Wrong file");
      await box.getByRole("button", { name: "Send" }).click();
    },
  },
  { target: notice, action: "dismiss", pointer: press("notice", "Dismiss") },
  { target: guardrail, action: "expand", pointer: press("guardrail", "Why?") },
  {
    target: guardrail,
    action: "collapse",
    before: press("guardrail", "Why?"),
    pointer: press("guardrail", "Why?"),
  },
  { target: guardrail, action: "dismiss", pointer: press("guardrail", "Dismiss") },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

test("one snapshot lists every Wave 1, 2 and 3 component, each Wave 3 one by name with its actions", async ({
  page,
}) => {
  await open(page);
  const entries = await snapshot(page);
  for (const component of [
    "kind-step",
    "kind-composer",
    "kind-uploader",
    "kind-queue",
    "kind-plan",
    "kind-subagent",
  ])
    expect(
      entries.some((item) => item.component === component),
      component,
    ).toBe(true);

  const listed = entries
    .filter((item) => wave3.some((target) => target.component === item.component))
    .map((item) => `${item.component} "${item.label}": ${[...item.actions].sort().join(" ")}`)
    .sort();
  expect(listed).toEqual([
    'kind-checkpoint "Checkpoint": press restore',
    'kind-confirmation "Run delete_file?": approve deny',
    'kind-confirmation "Run the migration?": approve deny',
    'kind-context-meter "Context": open press',
    'kind-feedback "Feedback": press rate',
    'kind-guardrail-notice "Model output withheld": collapse dismiss expand press',
    'kind-model-selector "Model": setValue',
    'kind-notice "Rate limited": dismiss',
    'kind-question "Deploy questions": select setText skip',
    'kind-reasoning-effort "Reasoning effort": setValue',
    'kind-suggestion "Suggestions": pick',
  ]);
  expect(await actionsOf(page, "kind-tool", "delete_file")).toEqual([
    "collapse",
    "copyInput",
    "expand",
    "press",
  ]);
});

for (const item of conformance) {
  const { target, action } = item;
  test(`${target.component} "${target.label}".${action} leaves the page as a person's input does`, ({
    page,
  }) => expectSameAsPerson(page, open, item));
}

const state = async (page: Page, { component, label }: (typeof wave3)[number], key: string) =>
  ((await entry(page, component, label)) as Record<string, unknown> | undefined)?.[key];

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await setHost(page, { refuse: true });
  await act(page, question.component, question.label, "select", ["env", "prod"]);
  await act(page, model.component, model.label, "setValue", ["sonnet-4"]);
  await act(page, effort.component, effort.label, "setValue", ["high"]);
  await act(page, context.component, context.label, "open");
  await act(page, feedback.component, feedback.label, "rate", ["up"]);
  await act(page, guardrail.component, guardrail.label, "expand");
  await act(page, checkpoint.component, checkpoint.label, "restore");
  expect((await host(page)).changes).toEqual(
    ["question", "model", "effort", "context", "feedback", "guardrail", "checkpoint"].map(
      (name) => `${name}:agent`,
    ),
  );
  await settled(page);
  expect(await state(page, question, "value")).toEqual({});
  await expect(radio("question", /Production/)(page)).not.toBeChecked();
  expect(await state(page, model, "value")).toBe("gpt-5");
  expect(await state(page, effort, "value")).toBe("medium");
  expect(await state(page, context, "open")).toBe(false);
  expect(await state(page, feedback, "rating")).toBe(null);
  expect(await state(page, guardrail, "open")).toBe(false);
  expect(await state(page, checkpoint, "open")).toBe(false);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("action callbacks hear source agent", async ({ page }) => {
  await open(page);
  await act(page, confirmation.component, confirmation.label, "approve");
  await act(page, toolApproval.component, toolApproval.label, "deny");
  await act(page, question.component, question.label, "select", ["env", "staging"]);
  await act(page, question.component, question.label, "submit");
  await act(page, suggestion.component, suggestion.label, "pick", ["a"]);
  await act(page, feedback.component, feedback.label, "rate", ["down"]);
  await act(page, feedback.component, feedback.label, "submitComment", ["Too long"]);
  await expect
    .poll(async () => (await host(page)).sources)
    .toEqual(["approve:agent", "deny:agent", "submit:agent", "pick:agent", "comment:agent"]);
});

/** Roots of a component that ask for a person. */
const marked = (page: Page, component: string) =>
  page.locator(`[data-slot="${component}"][data-agent-confirm]`);

test("approve, deny, restore and submit need a person; only Confirmation keeps asking without agentConfirm", async ({
  page,
}) => {
  await open(page);
  await act(page, question.component, question.label, "select", ["env", "staging"]);
  await setHost(page, { permit: false });
  const refused = async () => {
    const results = [
      await act(page, confirmation.component, confirmation.label, "approve"),
      await act(page, toolApproval.component, toolApproval.label, "deny"),
      await act(page, question.component, question.label, "submit"),
      await act(page, checkpoint.component, checkpoint.label, "restore"),
    ];
    return results.map((result) => result.ok);
  };
  expect(await refused()).toEqual([false, false, false, false]);
  expect((await host(page)).calls).toEqual([]);
  expect(await state(page, checkpoint, "open")).toBe(false);

  await setConfirm(page, false);
  await expect(marked(page, "kind-question")).toHaveCount(0);
  await expect(marked(page, "kind-checkpoint")).toHaveCount(0);
  await expect(marked(page, "kind-confirmation")).toHaveCount(2);
  expect(await refused()).toEqual([false, false, true, true]);
  expect((await host(page)).calls).toEqual(["submit"]);
  await expect.poll(() => state(page, checkpoint, "open")).toBe(true);
});

test("can-* attributes offer their actions", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web attributes only");
  await open(page);
  await act(page, question.component, question.label, "select", ["env", "staging"]);
  await act(page, feedback.component, feedback.label, "rate", ["up"]);
  const cases = [
    { selector: "#confirmation", target: confirmation, attribute: "can-approve", action: "approve" },
    { selector: "#confirmation", target: confirmation, attribute: "can-deny", action: "deny" },
    { selector: "#delete_file", target: toolApproval, attribute: "can-approve", action: "approve" },
    { selector: "#delete_file", target: toolApproval, attribute: "can-deny", action: "deny" },
    { selector: "#question", target: question, attribute: "can-submit", action: "submit" },
    { selector: "#question", target: question, attribute: "can-skip", action: "skip" },
    { selector: "#checkpoint", target: checkpoint, attribute: "can-restore", action: "restore" },
    { selector: "#suggestion", target: suggestion, attribute: "can-pick", action: "pick" },
    { selector: "#feedback", target: feedback, attribute: "can-comment", action: "submitComment" },
    { selector: "#notice kind-notice", target: notice, attribute: "can-dismiss", action: "dismiss" },
    {
      selector: "#guardrail kind-guardrail-notice",
      target: guardrail,
      attribute: "can-dismiss",
      action: "dismiss",
    },
  ];
  for (const { selector, target, attribute, action } of cases) {
    const element = page.locator(selector);
    const actions = () => actionsOf(page, target.component, target.label);
    await element.evaluate((el, name) => el.removeAttribute(name), attribute);
    await expect.poll(actions, `${selector} without ${attribute}`).not.toContain(action);
    await element.evaluate((el, name) => el.setAttribute(name, ""), attribute);
    await expect.poll(actions, `${selector} with ${attribute}`).toContain(action);
  }
});

test("Step-based parts take their colors at once as the page loads", async ({ page }) => {
  await page.addInitScript(() => {
    const runs: string[] = [];
    Object.assign(window, { kindTransitions: runs });
    document.addEventListener(
      "transitionrun",
      ({ target, propertyName }) => {
        if (
          target instanceof Element &&
          target.closest('[data-step-part="root"]') &&
          target.checkVisibility()
        )
          runs.push(`${target.getAttribute("data-slot")} ${propertyName}`);
      },
      true,
    );
  });
  await open(page);
  expect(
    await page.evaluate(() => (window as unknown as { kindTransitions: string[] }).kindTransitions),
  ).toEqual([]);
  await expect(page.locator("[data-mounting]")).toHaveCount(0);
});
