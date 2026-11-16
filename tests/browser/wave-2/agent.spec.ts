import { expect, type Locator, type Page, test } from "@playwright/test";
import { allowClipboard } from "../clipboard.js";
import { layerOf } from "../layer.js";

type Entry = { ref: string; component: string; label?: string; actions: string[]; open?: boolean };
type ActResult = { ok: boolean; error?: { message: string } };
type Host = {
  permit: boolean;
  refuse: boolean;
  changes: string[];
  calls: string[];
  confirm(on: boolean): void;
};
type Fixture = {
  agent: { snapshot(): Entry[]; act(input: { steps: unknown[] }): Promise<ActResult> };
  kindAgent: Host;
};

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-2");
  await expect.poll(() => components(page)).toContain("kind-queue");
  await settled(page);
};
const snapshot = (page: Page) => page.evaluate(() => (window as Partial<Fixture>).agent?.snapshot() ?? []);
const components = async (page: Page) => (await snapshot(page)).map((entry) => entry.component);
const entry = async (page: Page, component: string, label: string) =>
  (await snapshot(page)).find((item) => item.component === component && item.label === label);
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAgent);
const setHost = (page: Page, values: Partial<Pick<Host, "permit" | "refuse">>) =>
  page.evaluate((next) => Object.assign((window as unknown as Fixture).kindAgent, next), values);
const setConfirm = (page: Page, on: boolean) =>
  page.evaluate((value) => (window as unknown as Fixture).kindAgent.confirm(value), on);

const run = (page: Page, ref: string | undefined, action: string, args: unknown[] = []) =>
  page.evaluate((steps) => (window as unknown as Fixture).agent.act({ steps }), [{ ref, action, args }]);

async function act(page: Page, component: string, label: string, action: string, args: unknown[] = []) {
  const found = await entry(page, component, label);
  expect(found?.actions, `${component} "${label}" offers ${action}`).toContain(action);
  return run(page, found?.ref, action, args);
}

// Every animation but the endless loops (spinners, dots) has finished. Firefox never advances a transition inside
// hidden content, so those are skipped.
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" ||
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY ||
          (animation.effect as KeyframeEffect | null)?.target?.checkVisibility() === false,
      ),
  );

// Every attribute and text in a component, so an agent's action and a person's can be compared. Inline styles
// (motion, measurement) and `tabindex` (where focus went: a pointer moves it, an agent doesn't) are left out.
const signature = (scope: Locator) =>
  scope.evaluate((root) =>
    [root, ...root.querySelectorAll("*")].map((el) => {
      const attributes = [...el.attributes]
        .filter(({ name }) => name !== "style" && name !== "tabindex")
        .map(({ name, value }) => `${name}=${value}`)
        .sort();
      const text = [...el.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim())
        .join("");
      return `${el.localName}[${attributes.join(" ")}]${text}`;
    }),
  );

type Target = { component: string; label: string; id: string; trigger: RegExp };

const targets: Target[] = [
  { component: "kind-reasoning", label: "Thought for 3 s", id: "reasoning", trigger: /^Thought for 3 s/ },
  { component: "kind-tool", label: "search_docs", id: "search_docs", trigger: /^search_docs/ },
  { component: "kind-chain-of-thought", label: "Researching retries", id: "chain", trigger: /^Researching/ },
  { component: "kind-task", label: "Patching the client", id: "task", trigger: /^Patching the client/ },
  { component: "kind-plan", label: "Retry plan", id: "plan", trigger: /^Retry plan/ },
  { component: "kind-subagent", label: "Code reviewer", id: "subagent", trigger: /^Code reviewer/ },
];
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);
const trigger = (page: Page, { id, trigger }: Target) =>
  byId(id)(page).getByRole("button", { name: trigger }).first();

/** Opens or closes the component the way a person does, so both paths start from the same page. */
const setOpen = (target: Target, open: boolean) => async (page: Page) => {
  if ((await entry(page, target.component, target.label))?.open !== open) await trigger(page, target).click();
  await expect.poll(async () => (await entry(page, target.component, target.label))?.open).toBe(open);
  await settled(page);
};

type Conformance = {
  target: Pick<Target, "component" | "label" | "id">;
  action: string;
  args?: unknown[];
  before?: (page: Page) => Promise<void>;
  /** What a person does for the same result. */
  pointer: (page: Page) => Promise<void>;
};

const tool = targets[1] as Target;
const chain = targets[2] as Target;
const queue = { component: "kind-queue", label: "Queue", id: "queue" };
const queueRow = (page: Page, title: string) =>
  byId("queue")(page).getByRole("listitem").filter({ hasText: title });

const conformance: Conformance[] = [
  ...targets.flatMap((target): Conformance[] => [
    {
      target,
      action: "expand",
      before: setOpen(target, false),
      pointer: (page) => trigger(page, target).click(),
    },
    {
      target,
      action: "collapse",
      before: setOpen(target, true),
      pointer: (page) => trigger(page, target).click(),
    },
  ]),
  {
    target: tool,
    action: "copyInput",
    before: setOpen(tool, true),
    pointer: (page) => page.getByRole("button", { name: "Copy search_docs input" }).click(),
  },
  {
    target: tool,
    action: "copyOutput",
    before: setOpen(tool, true),
    pointer: (page) => page.getByRole("button", { name: "Copy search_docs output" }).click(),
  },
  {
    target: chain,
    action: "expandStep",
    args: ["search"],
    before: setOpen(chain, true),
    pointer: (page) =>
      byId("chain")(page)
        .getByRole("button", { name: /^Search the docs/ })
        .click(),
  },
  {
    target: targets[4] as Target,
    action: "accept",
    pointer: (page) => page.getByRole("button", { name: "Accept" }).click(),
  },
  {
    target: targets[5] as Target,
    action: "cancel",
    pointer: (page) => page.getByRole("button", { name: "Stop" }).click(),
  },
  {
    target: queue,
    action: "reorder",
    args: ["c", 0],
    pointer: async (page) => {
      await queueRow(page, "Run the tests").focus();
      for (const key of ["Space", "ArrowUp", "ArrowUp", "Space"]) await page.keyboard.press(key);
    },
  },
  {
    target: queue,
    action: "remove",
    args: ["b"],
    pointer: (page) =>
      queueRow(page, "Update the docs").locator('[data-slot="kind-queue-item-remove"]').click(),
  },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

test("one snapshot lists every Wave 1 and Wave 2 component, named where it has a role", async ({ page }) => {
  await open(page);
  const entries = await snapshot(page);
  const named = (component: string) =>
    entries
      .filter((item) => item.component === component)
      .map((item) => item.label)
      .sort();
  const actions = (component: string, label: string) =>
    [...(entries.find((item) => item.component === component && item.label === label)?.actions ?? [])].sort();

  for (const component of [
    "kind-step",
    "kind-step-list",
    "kind-conversation",
    "kind-message",
    "kind-markdown-table",
    "kind-composer",
    "kind-attachments",
    "kind-uploader",
    "kind-loader",
    "kind-thinking-indicator",
    "kind-typing-indicator",
    "kind-markdown",
    "kind-streaming-text",
  ])
    expect(named(component).length, component).toBeGreaterThan(0);

  expect(named("kind-status")).toEqual(["Deploying"]);
  expect(actions("kind-status", "Deploying")).toEqual([]);
  expect(named("kind-reasoning")).toEqual(["Thought for 3 s"]);
  expect(actions("kind-reasoning", "Thought for 3 s")).toEqual(["collapse", "expand", "press"]);
  expect(named("kind-tool")).toEqual(["read_file", "search_docs"]);
  expect(actions("kind-tool", "search_docs")).toEqual([
    "collapse",
    "copyInput",
    "copyOutput",
    "expand",
    "press",
  ]);
  expect(named("kind-chain-of-thought")).toEqual(["Researching retries"]);
  expect(actions("kind-chain-of-thought", "Researching retries")).toEqual([
    "collapse",
    "expand",
    "expandStep",
    "press",
  ]);
  expect(named("kind-task")).toEqual(["Patching the client"]);
  expect(actions("kind-task", "Patching the client")).toEqual(["collapse", "expand", "press"]);
  expect(named("kind-plan")).toEqual(["Retry plan"]);
  expect(actions("kind-plan", "Retry plan")).toEqual(["accept", "collapse", "expand", "press"]);
  expect(named("kind-subagent")).toEqual(["Code reviewer"]);
  expect(actions("kind-subagent", "Code reviewer")).toEqual(["cancel", "collapse", "expand", "press"]);
  expect(named("kind-queue")).toEqual(["Queue"]);
  expect(actions("kind-queue", "Queue")).toEqual(["remove", "reorder"]);
});

test("each tool names its own code blocks and copy buttons", async ({ page }) => {
  await open(page);
  for (const name of ["search_docs", "read_file"])
    await trigger(page, { ...tool, id: name, trigger: new RegExp(`^${name}`) }).click();
  expect(
    (await snapshot(page))
      .filter((item) => item.component === "kind-code-block" && item.label !== "Code")
      .map((item) => item.label)
      .sort(),
  ).toEqual(["read_file input", "read_file output", "search_docs input", "search_docs output"]);
  for (const name of ["search_docs", "read_file"])
    for (const part of ["input", "output"])
      await expect(page.getByRole("button", { name: `Copy ${name} ${part}` })).toHaveCount(1);
});

for (const { target, action, args, before, pointer } of conformance) {
  test(`${target.component}.${action} leaves the page as a person's input does`, async ({ page }) => {
    const scope = byId(target.id);
    await open(page);
    await before?.(page);
    const result = await act(page, target.component, target.label, action, args);
    expect(result.error).toBeUndefined();
    let byAgent: string[] = [];
    // Waits for the entrance and exit transitions to finish, so both sides are compared at rest. A leaving row's
    // attributes hold still while it fades, so animations are waited for too.
    await expect
      .poll(async () => {
        const previous = byAgent;
        await settled(page);
        byAgent = await signature(scope(page));
        return previous.join("\n") === byAgent.join("\n");
      })
      .toBe(true);
    const calls = (await host(page)).calls;

    await open(page);
    await before?.(page);
    await pointer(page);
    await expect.poll(() => signature(scope(page))).toEqual(byAgent);
    expect((await host(page)).calls).toEqual(calls);
  });
}

const queueTitles = (page: Page) =>
  byId("queue")(page).locator('[data-slot="kind-queue-item-title"]').allTextContents();

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await act(page, "kind-reasoning", "Thought for 3 s", "expand");
  await act(page, "kind-chain-of-thought", "Researching retries", "expandStep", ["plan"]);
  await act(page, "kind-queue", "Queue", "reorder", ["c", 0]);
  expect((await host(page)).changes).toEqual(["reasoning:agent", "chain:agent", "queue:agent"]);
  await expect
    .poll(() => queueTitles(page))
    .toEqual(["Run the tests", "Write the migration", "Update the docs"]);

  await setHost(page, { refuse: true });
  await act(page, "kind-reasoning", "Thought for 3 s", "collapse");
  await act(page, "kind-chain-of-thought", "Researching retries", "expandStep", ["search"]);
  await act(page, "kind-queue", "Queue", "reorder", ["a", 2]);
  expect((await entry(page, "kind-reasoning", "Thought for 3 s"))?.open).toBe(true);
  expect(
    ((await entry(page, "kind-chain-of-thought", "Researching retries")) as { openSteps?: string[] })
      ?.openSteps,
  ).toEqual(["plan"]);
  await settled(page);
  expect(await queueTitles(page)).toEqual(["Run the tests", "Write the migration", "Update the docs"]);
});

test("plan.accept and subagent.cancel need a person, unless agentConfirm is false", async ({ page }) => {
  await open(page);
  await setHost(page, { permit: false });
  expect((await act(page, "kind-plan", "Retry plan", "accept")).ok).toBe(false);
  expect((await act(page, "kind-subagent", "Code reviewer", "cancel")).ok).toBe(false);
  expect((await host(page)).calls).toEqual([]);
  await expect(page.locator("[id=plan]")).not.toHaveAttribute("data-pending", "");

  await setConfirm(page, false);
  await expect(page.locator("[data-agent-confirm]")).toHaveCount(1); // the composer's form
  expect((await act(page, "kind-plan", "Retry plan", "accept")).ok).toBe(true);
  expect((await act(page, "kind-subagent", "Code reviewer", "cancel")).ok).toBe(true);
  expect((await host(page)).calls).toEqual(["accept", "cancel"]);
});

const actionsOf = async (page: Page, component: string, label: string) =>
  [...((await entry(page, component, label))?.actions ?? [])].sort();

test("can-accept, can-cancel, can-reorder and can-remove offer their actions", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web attributes only");
  await open(page);
  const cases = [
    { tag: "kind-plan", label: "Retry plan", attribute: "can-accept", action: "accept" },
    { tag: "kind-subagent", label: "Code reviewer", attribute: "can-cancel", action: "cancel" },
    { tag: "kind-queue", label: "Queue", attribute: "can-reorder", action: "reorder" },
    { tag: "kind-queue", label: "Queue", attribute: "can-remove", action: "remove" },
  ];
  for (const { tag, label, attribute, action } of cases) {
    const element = page.locator(tag);
    await element.evaluate((el, name) => el.removeAttribute(name), attribute);
    await expect.poll(() => actionsOf(page, tag, label)).not.toContain(action);
    await element.evaluate((el, name) => el.setAttribute(name, ""), attribute);
    await expect.poll(() => actionsOf(page, tag, label)).toContain(action);
  }
});
