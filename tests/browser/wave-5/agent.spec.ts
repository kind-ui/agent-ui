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

const picker = { component: "kind-picker", label: "Work in, kind-ui/agent-ui", id: "picker" };
const model = { component: "kind-model-selector", label: "Model, GPT-5", id: "model" };
const add = { component: "kind-add-menu", label: "Add", id: "add-menu" };
const settings = { component: "kind-settings-menu", label: "Settings", id: "settings-menu" };
const approval = { component: "kind-approval-mode", label: "Approvals, Ask every time", id: "approval-mode" };
const control = {
  component: "kind-model-control",
  label: "Model, Claude Opus 5.5, Medium effort",
  id: "model-control",
};
const contextBar = { component: "kind-context-bar", label: "Context", id: "context-bar" };
const dictation = { component: "kind-dictation", label: "Dictate", id: "dictation" };
const answer = { component: "kind-message", label: "Answer", id: "answer" };
const draft = { component: "kind-composer", label: "Draft", id: "draft" };

type Target = typeof picker;

const wave5 = [picker, model, add, settings, approval, control, contextBar, dictation, answer, draft];

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-5");
  await expect.poll(() => components(page)).toContain("kind-dictation");
  // The composer offers `discardDraft` once its saved draft is back.
  await expect.poll(() => actionsOf(page, draft.component, draft.label)).toContain("discardDraft");
  await settled(page);
};
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);
const button = (id: string, name: string | RegExp) => (page: Page) =>
  byId(id)(page)
    .getByRole("button", { name, exact: typeof name === "string" })
    .first();
const press = (id: string, name: string | RegExp) => (page: Page) => button(id, name)(page).click();
// Menus are driven with the keyboard, where a pointer would leave a row under it highlighted.
const openMenu = (id: string, name: string | RegExp) => async (page: Page) => {
  await button(id, name)(page).focus();
  await page.keyboard.press("Enter");
  await expect(byId(id)(page).getByRole("menu").first()).toBeVisible();
};
const menuRow =
  (id: string, role: "menuitem" | "menuitemcheckbox" | "menuitemradio", name: RegExp) =>
  async (page: Page) => {
    await byId(id)(page).getByRole(role, { name }).last().focus();
    await page.keyboard.press("Enter");
  };
const pickerOption = (id: string, slot: string, name: RegExp) => async (page: Page) => {
  await byId(id)(page).locator(`[data-slot="kind-${slot}-trigger"]`).click();
  await byId(id)(page).locator(`[data-slot="kind-${slot}-content"]`).getByRole("option", { name }).click();
};

const opened = (target: Target) => (page: Page) =>
  expect.poll(async () => (await entry(page, target.component, target.label))?.open);

const menuContent = '[data-slot="menu-content"]';

const conformance: Conformance[] = [
  {
    target: picker,
    action: "open",
    pointer: (page) => byId("picker")(page).locator('[data-slot="kind-picker-trigger"]').click(),
  },
  {
    target: picker,
    action: "close",
    before: async (page) => {
      await byId("picker")(page).locator('[data-slot="kind-picker-trigger"]').click();
      await opened(picker)(page).toBe(true);
    },
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: picker,
    action: "setValue",
    args: ["kind-ui/docs"],
    ignore: '[data-slot="kind-picker-content"]',
    pointer: pickerOption("picker", "picker", /^kind-ui\/docs/),
  },
  {
    target: picker,
    action: "run",
    args: ["new"],
    ignore: '[data-slot="kind-picker-content"]',
    pointer: pickerOption("picker", "picker", /^New project/),
  },
  {
    target: model,
    action: "open",
    pointer: (page) => byId("model")(page).locator('[data-slot="kind-model-selector-trigger"]').click(),
  },
  {
    target: model,
    action: "close",
    before: async (page) => {
      await byId("model")(page).locator('[data-slot="kind-model-selector-trigger"]').click();
      await opened(model)(page).toBe(true);
    },
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: model,
    action: "run",
    args: ["more"],
    ignore: '[data-slot="kind-model-selector-content"]',
    pointer: pickerOption("model", "model-selector", /^More models/),
  },
  { target: add, action: "open", ignore: menuContent, pointer: openMenu("add-menu", "Add") },
  {
    target: add,
    action: "close",
    ignore: menuContent,
    before: openMenu("add-menu", "Add"),
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: add,
    action: "run",
    args: ["context"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("add-menu", "Add")(page);
      await menuRow("add-menu", "menuitem", /^Add context/)(page);
    },
  },
  { target: settings, action: "open", ignore: menuContent, pointer: openMenu("settings-menu", "Settings") },
  {
    target: settings,
    action: "close",
    ignore: menuContent,
    before: openMenu("settings-menu", "Settings"),
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: settings,
    action: "toggle",
    args: ["search"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("settings-menu", "Settings")(page);
      await menuRow("settings-menu", "menuitemcheckbox", /^Web search/)(page);
      await page.keyboard.press("Escape");
    },
  },
  {
    target: settings,
    action: "setValue",
    args: ["style", "detailed"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("settings-menu", "Settings")(page);
      await menuRow("settings-menu", "menuitem", /^Response style/)(page);
      await menuRow("settings-menu", "menuitemradio", /^Detailed/)(page);
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    },
  },
  {
    target: approval,
    action: "open",
    ignore: menuContent,
    pointer: openMenu("approval-mode", approval.label),
  },
  {
    target: approval,
    action: "close",
    ignore: menuContent,
    before: openMenu("approval-mode", approval.label),
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: approval,
    action: "setValue",
    args: ["edits"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("approval-mode", approval.label)(page);
      await menuRow("approval-mode", "menuitemradio", /^Allow edits/)(page);
    },
  },
  { target: control, action: "open", ignore: menuContent, pointer: openMenu("model-control", control.label) },
  {
    target: control,
    action: "close",
    ignore: menuContent,
    before: openMenu("model-control", control.label),
    pointer: (page) => page.keyboard.press("Escape"),
  },
  {
    target: control,
    action: "toggle",
    args: ["fast"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("model-control", control.label)(page);
      await menuRow("model-control", "menuitemcheckbox", /^Fast mode/)(page);
      await page.keyboard.press("Escape");
    },
  },
  {
    target: control,
    action: "setValue",
    args: ["context", "200k"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("model-control", control.label)(page);
      await menuRow("model-control", "menuitem", /^Context window/)(page);
      await menuRow("model-control", "menuitemradio", /^200K/)(page);
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    },
  },
  {
    target: control,
    action: "setModel",
    args: ["terra"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("model-control", control.label)(page);
      await menuRow("model-control", "menuitem", /^Model/)(page);
      await menuRow("model-control", "menuitemradio", /^GPT-6\.1 Terra/)(page);
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    },
  },
  {
    target: control,
    action: "setEffort",
    args: ["high"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("model-control", control.label)(page);
      await menuRow("model-control", "menuitem", /^Effort/)(page);
      await menuRow("model-control", "menuitemradio", /^High/)(page);
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    },
  },
  {
    target: control,
    action: "run",
    args: ["more"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("model-control", control.label)(page);
      await menuRow("model-control", "menuitem", /^Model/)(page);
      await menuRow("model-control", "menuitem", /^More models/)(page);
    },
  },
  {
    target: contextBar,
    action: "remove",
    args: ["chip-1"],
    pointer: async (page) => {
      await byId("context-bar")(page).getByRole("listitem").nth(1).focus();
      await page.keyboard.press("Delete");
    },
  },
  {
    target: contextBar,
    action: "open",
    ignore: '[data-slot="kind-context-bar-content"]',
    pointer: press("context-bar", "2 more"),
  },
  {
    target: contextBar,
    action: "close",
    ignore: '[data-slot="kind-context-bar-content"]',
    before: async (page) => {
      await press("context-bar", "2 more")(page);
      await opened(contextBar)(page).toBe(true);
      await settled(page);
    },
    pointer: (page) => page.keyboard.press("Escape"),
  },
  { target: dictation, action: "start", pointer: press("dictation", "Dictate") },
  {
    target: dictation,
    action: "stop",
    before: press("dictation", "Dictate"),
    pointer: press("dictation", /^Stop/),
  },
  {
    target: dictation,
    action: "cancel",
    before: press("dictation", "Dictate"),
    pointer: press("dictation", /^Cancel/),
  },
  {
    target: answer,
    action: "regenerate",
    args: ["concise"],
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("answer", "Regenerate")(page);
      await menuRow("answer", "menuitem", /^More concise/)(page);
    },
  },
  {
    target: answer,
    action: "regenerate",
    ignore: menuContent,
    pointer: async (page) => {
      await openMenu("answer", "Regenerate")(page);
      await menuRow("answer", "menuitem", /^Try again/)(page);
    },
  },
  { target: draft, action: "discardDraft", pointer: press("draft", "Discard") },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

test("one snapshot lists every Wave 1 to 4 component and each Wave 5 one once by name with its actions", async ({
  page,
}) => {
  await open(page);
  const entries = await snapshot(page);
  for (const component of [
    "kind-step",
    "kind-uploader",
    "kind-queue",
    "kind-plan",
    "kind-checkpoint",
    "kind-feedback",
    "kind-sources",
    "kind-file-tree",
    "kind-transcript",
    "kind-action",
  ])
    expect(
      entries.some((item) => item.component === component),
      component,
    ).toBe(true);
  // No composed UI SDK Menu or Command is an entry of its own.
  expect(entries.filter((item) => ["menu", "command"].includes(item.component))).toEqual([]);

  const listed = entries
    .filter((item) =>
      wave5.some((target) => target.component === item.component && target.label === item.label),
    )
    .map((item) => `${item.component} "${item.label}": ${[...item.actions].sort().join(" ")}`)
    .sort();
  expect(listed).toEqual([
    'kind-add-menu "Add": open press run',
    'kind-approval-mode "Approvals, Ask every time": open setValue',
    'kind-composer "Draft": discardDraft insertToken removeAttachment setValue submit',
    'kind-context-bar "Context": open press remove',
    'kind-dictation "Dictate": start',
    'kind-message "Answer": copy regenerate',
    'kind-model-control "Model, Claude Opus 5.5, Medium effort": open run setEffort setModel setValue toggle',
    'kind-model-selector "Model, GPT-5": open run setValue',
    'kind-picker "Work in, kind-ui/agent-ui": open run setValue',
    'kind-settings-menu "Settings": open setValue toggle',
  ]);
});

test("only Approval Mode, an idle Dictation and the composer ask for a person, and agentConfirm turns the first two off", async ({
  page,
}) => {
  await open(page);
  const asking = () =>
    page.evaluate(
      (ids) => ids.filter((id) => document.getElementById(id)?.querySelector("[data-agent-confirm]")),
      [...wave5.map(({ id }) => id)],
    );
  expect(await asking()).toEqual(["approval-mode", "dictation", "draft"]);
  await act(page, dictation.component, dictation.label, "start");
  await expect.poll(asking).toEqual(["approval-mode", "draft"]);
  await act(page, dictation.component, dictation.label, "cancel");
  await expect.poll(asking).toEqual(["approval-mode", "dictation", "draft"]);
  await setConfirm(page, false);
  await expect.poll(asking).toEqual(["draft"]);
});

for (const item of conformance) {
  const { target, action: name, args } = item;
  test(`${target.component} "${target.label}".${name}(${args?.join(", ") ?? ""}) leaves the page as a person's input does`, ({
    page,
  }) => expectSameAsPerson(page, open, item));
}

const state = async (page: Page, { component, label }: Target, key: string) =>
  ((await entry(page, component, label)) as Record<string, unknown> | undefined)?.[key];

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await setHost(page, { refuse: true });
  await act(page, picker.component, picker.label, "setValue", ["kind-ui/docs"]);
  await act(page, model.component, model.label, "setValue", ["sonnet-4"]);
  await act(page, settings.component, settings.label, "toggle", ["search"]);
  await act(page, settings.component, settings.label, "setValue", ["style", "detailed"]);
  await act(page, approval.component, approval.label, "setValue", ["edits"]);
  await act(page, control.component, control.label, "toggle", ["fast"]);
  await act(page, control.component, control.label, "setModel", ["terra"]);
  await act(page, control.component, control.label, "setEffort", ["high"]);
  await act(page, contextBar.component, contextBar.label, "remove", ["chip-0"]);
  await act(page, draft.component, draft.label, "discardDraft");
  expect((await host(page)).changes).toEqual(
    [
      "picker",
      "model",
      "settings",
      "settings",
      "approval",
      "model-control",
      "model-control",
      "model-control",
      "context-bar",
      "draft",
    ].map((name) => `${name}:agent`),
  );
  await settled(page);
  expect(await state(page, picker, "value")).toBe("kind-ui/agent-ui");
  expect(await state(page, model, "value")).toBe("gpt-5");
  expect(await state(page, settings, "values")).toEqual({ memory: true, style: "balanced" });
  expect(await state(page, approval, "value")).toBe("ask");
  expect(await state(page, control, "values")).toEqual({ fast: false, context: "1m" });
  expect(await state(page, control, "model")).toBe("opus");
  expect(await state(page, control, "effort")).toBe("medium");
  await expect(byId("context-bar")(page).locator('[data-context-bar-part="chip"]')).toHaveCount(4);
  expect(await state(page, draft, "value")).toMatchObject({ text: "Pick up where I left off" });
  await expect(button("draft", "Discard")(page)).toBeVisible();
});

test("action callbacks hear source agent", async ({ page }) => {
  await open(page);
  await act(page, picker.component, picker.label, "run", ["new"]);
  await act(page, model.component, model.label, "run", ["more"]);
  await act(page, add.component, add.label, "run", ["upload"]);
  await act(page, control.component, control.label, "run", ["more"]);
  await act(page, answer.component, answer.label, "regenerate", ["details"]);
  await act(page, dictation.component, dictation.label, "start");
  await page.evaluate(() => {
    const fake = (window as unknown as { kindDictation: { push(event: unknown): void } }).kindDictation;
    fake.push({ text: "Ship it", final: true });
  });
  await act(page, dictation.component, dictation.label, "stop");
  await page.evaluate(() => (window as unknown as { kindDictation: { end(): void } }).kindDictation.end());
  await expect
    .poll(async () => (await host(page)).sources)
    .toEqual(
      ["picker-action", "model-action", "add", "model-control-action", "regenerate:details", "dictate"].map(
        (name) => `${name}:agent`,
      ),
    );
});

type Steps = { ok: boolean; steps?: { result?: unknown }[] };
const refused = (result: Steps) => !result.ok || result.steps?.[0]?.result === false;

test("actions that take an id refuse an unknown one", async ({ page }) => {
  await open(page);
  const results = [
    await act(page, picker.component, picker.label, "setValue", ["nope"]),
    await act(page, picker.component, picker.label, "run", ["nope"]),
    await act(page, model.component, model.label, "setValue", ["nope"]),
    await act(page, model.component, model.label, "run", ["nope"]),
    await act(page, add.component, add.label, "run", ["nope"]),
    await act(page, settings.component, settings.label, "toggle", ["nope"]),
    await act(page, settings.component, settings.label, "setValue", ["nope", "concise"]),
    await act(page, approval.component, approval.label, "setValue", ["nope"]),
    await act(page, control.component, control.label, "toggle", ["nope"]),
    await act(page, control.component, control.label, "setValue", ["nope", "200k"]),
    await act(page, control.component, control.label, "setModel", ["nope"]),
    await act(page, control.component, control.label, "setEffort", ["nope"]),
    await act(page, control.component, control.label, "run", ["nope"]),
    await act(page, contextBar.component, contextBar.label, "remove", ["nope"]),
    await act(page, answer.component, answer.label, "regenerate", ["nope"]),
  ];
  expect(results.map(refused)).toEqual(results.map(() => true));
  const { calls, changes } = await host(page);
  expect(calls).toEqual([]);
  expect(changes).toEqual([]);
});

test("can-* attributes offer their actions", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web attributes only");
  await open(page);
  const cases = [
    { target: picker, attribute: "can-run", action: "run" },
    { target: model, attribute: "can-run", action: "run" },
    { target: add, attribute: "can-run", action: "run" },
    { target: control, attribute: "can-run", action: "run" },
    { target: contextBar, attribute: "can-remove", action: "remove" },
    { target: answer, attribute: "can-regenerate", action: "regenerate" },
  ];
  for (const { target, attribute, action: name } of cases) {
    const element = page.locator(
      `[id="${target.id}"]:is(${target.component}), [id="${target.id}"] ${target.component}`,
    );
    const actions = () => actionsOf(page, target.component, target.label);
    await element.evaluate((el, attr) => el.removeAttribute(attr), attribute);
    await expect.poll(actions, `#${target.id} without ${attribute}`).not.toContain(name);
    await element.evaluate((el, attr) => el.setAttribute(attr, ""), attribute);
    await expect.poll(actions, `#${target.id} with ${attribute}`).toContain(name);
  }
});

test("inside the full composer each control is one entry, under the composer's mark", async ({ page }) => {
  await page.goto("/?c=full-composer&case=all");
  await expect.poll(() => components(page)).toContain("kind-dictation");
  await settled(page);
  const listed = (await snapshot(page)).map((item) => `${item.component} "${item.label ?? ""}"`).sort();
  // The composer's own Token Input and File Input have been entries of their own since Wave 1.
  expect(listed).toEqual([
    'file-input ""',
    'kind-add-menu "Add"',
    'kind-approval-mode "Approvals, Ask every time"',
    'kind-composer "Message"',
    'kind-context-bar "Context"',
    'kind-dictation "Dictate"',
    'kind-model-control "Model, Claude Opus 5.5, High effort"',
    'kind-settings-menu "Settings"',
    'token-input "Prompt"',
  ]);
  const confirms = Object.fromEntries((await snapshot(page)).map((item) => [item.component, item.confirm]));
  // Every control inside the composer's form takes its mark (core decisions.md, "Controls inside a Composer").
  const composer = "Writes and sends a message as you";
  expect(confirms).toMatchObject({
    "kind-composer": composer,
    "token-input": composer,
    "kind-add-menu": composer,
    "kind-context-bar": composer,
    "kind-model-control": composer,
    "kind-settings-menu": composer,
    "kind-approval-mode": "Changes what the agent may do without asking",
    "kind-dictation": "Opens the microphone for dictation",
  });
});
