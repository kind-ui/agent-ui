import { expect, type Locator, type Page } from "@playwright/test";

// Helpers for the `?c=agent` pages of Wave 2 and later, whose host is `agentHost()` in the shared fixtures.

export type Entry = { ref: string; component: string; label?: string; actions: string[]; open?: boolean };
type ActResult = { ok: boolean; error?: { message: string } };
export type Host = {
  permit: boolean;
  refuse: boolean;
  changes: string[];
  calls: string[];
  sources: string[];
  confirm(on: boolean): void;
};
type Fixture = {
  agent: { snapshot(): Entry[]; act(input: { steps: unknown[] }): Promise<ActResult> };
  kindAgent: Host;
};

export const snapshot = (page: Page) =>
  page.evaluate(() => (window as Partial<Fixture>).agent?.snapshot() ?? []);
export const components = async (page: Page) => (await snapshot(page)).map((entry) => entry.component);
export const entry = async (page: Page, component: string, label: string) =>
  (await snapshot(page)).find((item) => item.component === component && item.label === label);
export const actionsOf = async (page: Page, component: string, label: string) =>
  [...((await entry(page, component, label))?.actions ?? [])].sort();
export const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAgent);
export const setHost = (page: Page, values: Partial<Pick<Host, "permit" | "refuse">>) =>
  page.evaluate((next) => Object.assign((window as unknown as Fixture).kindAgent, next), values);
export const setConfirm = (page: Page, on: boolean) =>
  page.evaluate((value) => (window as unknown as Fixture).kindAgent.confirm(value), on);

export async function act(
  page: Page,
  component: string,
  label: string,
  action: string,
  args: unknown[] = [],
) {
  const found = await entry(page, component, label);
  expect(found?.actions, `${component} "${label}" offers ${action}`).toContain(action);
  return page.evaluate(
    (steps) => (window as unknown as Fixture).agent.act({ steps }),
    [{ ref: found?.ref, action, args }],
  );
}

// Every animation but the endless loops (spinners, dots) has finished. Firefox never advances a transition inside
// hidden content, so those are skipped.
export const settled = (page: Page) =>
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
// (motion, measurement) and `tabindex` (where focus went: a pointer moves it, an agent doesn't) are left out, and
// so is whatever `ignore` matches.
const signature = (scope: Locator, ignore = ":not(*)") =>
  scope.evaluate(
    (root, ignored) =>
      [root, ...root.querySelectorAll("*")]
        .filter((el) => !el.closest(ignored))
        .map((el) => {
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
    ignore,
  );

export type Conformance = {
  target: { component: string; label: string; id: string };
  action: string;
  args?: unknown[];
  /** Brings the page to where the action applies, the same way for both paths. */
  before?: (page: Page) => Promise<void>;
  /** What a person does for the same result. */
  pointer: (page: Page) => Promise<void>;
  /**
   * Parts left out of the comparison: a popup the person opened on the way and the agent never did, whose
   * closed element keeps the attributes UI SDK wrote when it first opened.
   */
  ignore?: string;
};

/** Runs the action through `act` and through a person's input on fresh pages, and compares the two. */
export async function expectSameAsPerson(
  page: Page,
  open: (page: Page) => Promise<void>,
  { target, action, args, before, pointer, ignore }: Conformance,
) {
  const scope = page.locator(`[id="${target.id}"]`);
  await open(page);
  await before?.(page);
  // Popups place themselves by the room around them, and a person's click scrolls its target into view first.
  await scope.scrollIntoViewIfNeeded();
  const result = await act(page, target.component, target.label, action, args);
  expect(result.error).toBeUndefined();
  let byAgent: string[] = [];
  // Waits for the entrance and exit transitions to finish, so both sides are compared at rest. A leaving row's
  // attributes hold still while it fades, so animations are waited for too.
  await expect
    .poll(async () => {
      const previous = byAgent;
      await settled(page);
      byAgent = await signature(scope, ignore);
      return previous.join("\n") === byAgent.join("\n");
    })
    .toBe(true);
  const calls = (await host(page)).calls;

  await open(page);
  await before?.(page);
  await scope.scrollIntoViewIfNeeded();
  await pointer(page);
  await expect.poll(() => signature(scope, ignore)).toEqual(byAgent);
  expect((await host(page)).calls).toEqual(calls);
}
