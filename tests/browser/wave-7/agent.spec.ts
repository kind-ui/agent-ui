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
  settled,
  snapshot,
} from "../agent-conformance.js";
import { allowClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

const steer = { component: "kind-composer", label: "Steer", id: "steer" };
const next = { component: "kind-queue", label: "Next up", id: "next" };
const queued = { component: "kind-message", label: "Queued message", id: "queued" };
const retrying = { component: "kind-message", label: "Retrying answer", id: "retrying" };
const terminal = { component: "kind-terminal", label: "npm test", id: "run" };
const run = { component: "kind-confirmation", label: "Run npm test?", id: "run" };
const tool = { component: "kind-tool", label: "search_docs", id: "tool-retry" };
const diff = { component: "kind-diff", label: "src/values.ts", id: "diff" };
const group = { component: "kind-step-group", label: "3 agents", id: "group" };
const handoff = { component: "kind-handoff", label: "Handoff to Billing", id: "handoff" };
const takeOver = { component: "kind-confirmation", label: "Let Billing take over?", id: "handoff" };

type Target = typeof steer;

const wave7a = [steer, next, queued, retrying, terminal, run, tool, diff, group, handoff, takeOver];

const MOD = process.platform === "darwin" ? "Meta" : "Control";

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-7a");
  await expect.poll(() => components(page)).toContain("kind-handoff");
  await settled(page);
};
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);
const button = (id: string, name: string | RegExp) => (page: Page) =>
  byId(id)(page)
    .getByRole("button", { name, exact: typeof name === "string" })
    .first();
const press = (id: string, name: string | RegExp) => (page: Page) => button(id, name)(page).click();
// By keyboard, where a pointer would leave the control hovered.
const enter = (id: string, name: string | RegExp) => async (page: Page) => {
  await button(id, name)(page).focus();
  await page.keyboard.press("Enter");
};
const draft = async (page: Page) => {
  await byId("steer")(page).getByRole("textbox", { name: "Steer prompt" }).click();
  await page.keyboard.type("check the logs");
};
const sendKey = (title: string) => async (page: Page) => {
  await byId("next")(page).getByRole("listitem").filter({ hasText: title }).focus();
  await page.keyboard.press(`${MOD}+Enter`);
};

// The steer menu the person may open on the way keeps what UI SDK wrote then.
const steerMenu = '[data-slot="menu-content"]';

const conformance: Conformance[] = [
  {
    target: steer,
    action: "steer",
    ignore: steerMenu,
    before: draft,
    pointer: (page) => page.keyboard.press("Enter"),
  },
  {
    target: steer,
    action: "queue",
    ignore: steerMenu,
    before: draft,
    pointer: (page) => page.keyboard.press(`${MOD}+Enter`),
  },
  { target: steer, action: "stop", pointer: press("steer", "Stop") },
  { target: next, action: "send", args: ["a"], pointer: sendKey("Also check the logs") },
  { target: queued, action: "withdraw", pointer: enter("queued", "Withdraw") },
  { target: run, action: "approve", pointer: enter("run", "Approve") },
  { target: run, action: "alwaysAllow", pointer: enter("run", "Always allow") },
  { target: tool, action: "retry", pointer: enter("tool-retry", "Retry") },
  { target: diff, action: "accept", pointer: enter("diff", "Accept") },
  { target: diff, action: "revert", pointer: enter("diff", "Revert") },
  { target: diff, action: "copy", pointer: enter("diff", "Copy diff") },
  { target: diff, action: "expandAll", pointer: enter("diff", /^Show \d+ lines$/) },
  { target: group, action: "collapse", pointer: enter("group", /^3 agents/) },
  {
    target: group,
    action: "expand",
    before: enter("group", /^3 agents/),
    pointer: enter("group", /^3 agents/),
  },
  { target: group, action: "cancel", pointer: enter("group", "Stop all") },
  { target: takeOver, action: "approve", pointer: enter("handoff", "Approve") },
  { target: takeOver, action: "alwaysAllow", pointer: enter("handoff", "Always allow") },
  // A person's Deny opens the Terminal's reason box, which an agent's `deny` skips, so deny is compared here, where
  // the Confirmation has no reason box.
  { target: takeOver, action: "deny", pointer: enter("handoff", "Deny") },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

const isWave7a = (item: { component: string; label?: string }) =>
  wave7a.some((target) => target.component === item.component && target.label === item.label);
const listed = async (page: Page) =>
  (await snapshot(page))
    .filter(isWave7a)
    .map((item) => `${item.component} "${item.label}": ${[...item.actions].sort().join(" ")}`)
    .sort();
// No composed Menu (the steer menu), Avatar (Handoff's) or Command is an entry of its own.
const composedEntries = async (page: Page) =>
  (await snapshot(page))
    .map((item) => item.component)
    .filter((component) => ["menu", "avatar", "command"].includes(component));

test("one snapshot lists each 7a component once by name with its actions, and no composed part", async ({
  page,
}) => {
  await open(page);
  expect((await snapshot(page)).map((item) => item.component)).not.toContain("more");
  expect(await listed(page)).toEqual([
    'kind-composer "Steer": insertToken removeAttachment setValue stop submit',
    'kind-confirmation "Let Billing take over?": alwaysAllow approve deny',
    'kind-confirmation "Run npm test?": alwaysAllow approve deny',
    'kind-diff "src/values.ts": accept copy expandAll revert',
    'kind-handoff "Handoff to Billing": ',
    'kind-message "Queued message": copy withdraw',
    'kind-message "Retrying answer": copy',
    'kind-queue "Next up": send',
    'kind-step-group "3 agents": cancel collapse expand press',
    'kind-terminal "npm test": collapse expand press',
    'kind-tool "search_docs": collapse copyInput expand press retry',
  ]);
  expect(await composedEntries(page)).toEqual([]);

  // A draft offers steer and queue; the open steer menu is no entry of its own.
  await draft(page);
  await expect
    .poll(() => actionsOf(page, steer.component, steer.label))
    .toEqual(["insertToken", "queue", "removeAttachment", "setValue", "steer", "stop", "submit"]);
  await press("steer", "More send options")(page);
  await expect(page.getByRole("menu")).toBeVisible();
  expect(await composedEntries(page)).toEqual([]);
});

test("among 7a's, only the composers, the Confirmations and Diff ask for a person", async ({ page }) => {
  await open(page);
  const asking = () =>
    page.evaluate(
      (ids) =>
        ids.flatMap((id) =>
          [...(document.getElementById(id)?.querySelectorAll("[data-agent-confirm]") ?? [])].map(
            (el) => `${id} ${el.getAttribute("data-slot") ?? el.localName}`,
          ),
        ),
      [...new Set(wave7a.map(({ id }) => id))],
    );
  const atRest = [
    "steer kind-composer",
    "run kind-confirmation",
    "diff kind-diff",
    "handoff kind-confirmation",
  ];
  expect(await asking()).toEqual(atRest);
  // Diff's mark follows `agentConfirm`; a Composer's and a Confirmation's don't here.
  await setConfirm(page, false);
  await expect.poll(asking).toEqual(atRest.filter((item) => item !== "diff kind-diff"));
});

for (const item of conformance) {
  const { target, action: name, args } = item;
  test(`${target.component} "${target.label}".${name}(${args?.join(", ") ?? ""}) leaves the page as a person's input does`, ({
    page,
  }) => expectSameAsPerson(page, open, item));
}

test("action callbacks hear source agent", async ({ page }) => {
  await open(page);
  const step = (target: Target, action: string, args?: unknown[]) =>
    act(page, target.component, target.label, action, args);
  await draft(page);
  await step(steer, "steer");
  await step(next, "send", ["a"]);
  await step(queued, "withdraw");
  await step(run, "approve");
  await step(tool, "retry");
  await step(diff, "accept");
  await step(group, "cancel");
  await step(takeOver, "deny");
  await expect
    .poll(async () => (await host(page)).sources)
    .toEqual(
      [
        "composer-steer",
        "queue-send",
        "message-withdraw",
        "terminal-approve",
        "tool-retry",
        "diff-accept",
        "group-cancel",
        "handoff-deny",
      ].map((name) => `${name}:agent`),
    );
});

test("send refuses an unknown item", async ({ page }) => {
  await open(page);
  const result = await act(page, next.component, next.label, "send", ["nope"]);
  expect(!result.ok || (result as { steps?: { result?: unknown }[] }).steps?.[0]?.result === false).toBe(true);
  expect((await host(page)).calls).toEqual([]);
});

test("can-* attributes offer their actions", async ({ page }) => {
  test.skip(!isWebElements(test.info()), "web attributes only");
  await open(page);
  await draft(page);
  const cases: { element: string; attribute: string; target: Target; action: string }[] = [
    { element: "#steer kind-composer", attribute: "can-steer", target: steer, action: "steer" },
    { element: "#steer kind-composer", attribute: "can-steer", target: steer, action: "queue" },
    { element: "#steer kind-composer", attribute: "can-stop", target: steer, action: "stop" },
    { element: "#next kind-queue", attribute: "can-send", target: next, action: "send" },
    { element: "#queued kind-message", attribute: "can-withdraw", target: queued, action: "withdraw" },
    { element: "#run kind-terminal", attribute: "can-approve", target: run, action: "approve" },
    { element: "#run kind-terminal", attribute: "can-always-allow", target: run, action: "alwaysAllow" },
    { element: "#run kind-terminal", attribute: "can-deny", target: run, action: "deny" },
    { element: "#tool-retry kind-tool", attribute: "can-retry", target: tool, action: "retry" },
    { element: "#diff kind-diff", attribute: "can-accept", target: diff, action: "accept" },
    { element: "#diff kind-diff", attribute: "can-revert", target: diff, action: "revert" },
    { element: "#group kind-step-group", attribute: "can-cancel", target: group, action: "cancel" },
    { element: "#handoff kind-handoff", attribute: "can-approve", target: takeOver, action: "approve" },
    {
      element: "#handoff kind-handoff",
      attribute: "can-always-allow",
      target: takeOver,
      action: "alwaysAllow",
    },
    { element: "#handoff kind-handoff", attribute: "can-deny", target: takeOver, action: "deny" },
  ];
  for (const { element, attribute, target, action } of cases) {
    const el = page.locator(element).first();
    const actions = () => actionsOf(page, target.component, target.label);
    await el.evaluate((node, attr) => node.removeAttribute(attr), attribute);
    await expect.poll(actions, `${element} without ${attribute}`).not.toContain(action);
    await el.evaluate((node, attr) => node.setAttribute(attr, ""), attribute);
    await expect.poll(actions, `${element} with ${attribute}`).toContain(action);
  }
  expect((await entry(page, steer.component, steer.label))?.actions).toContain("steer");
});
