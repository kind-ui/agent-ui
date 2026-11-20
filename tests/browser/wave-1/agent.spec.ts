import { expect, type Locator, type Page, test } from "@playwright/test";
import { allowClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

type Entry = {
  ref: string;
  component: string;
  label?: string;
  actions: string[];
  open?: boolean;
  branchIndex?: number;
  value?: { text: string; attachments: { id: string }[] };
};
type ActResult = { ok: boolean; error?: { message: string } };
type Fixture = {
  agent: { snapshot(): Entry[]; act(input: { steps: unknown[] }): Promise<ActResult> };
  kindAgent: { permit: boolean; refuse: boolean; hold: boolean; changes: string[]; calls: string[] };
};

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=all");
  await expect.poll(() => components(page)).toContain("kind-uploader");
};
const snapshot = (page: Page) => page.evaluate(() => (window as Partial<Fixture>).agent?.snapshot() ?? []);
const components = async (page: Page) => (await snapshot(page)).map((entry) => entry.component);
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAgent);
const setHost = (page: Page, values: Partial<Pick<Fixture["kindAgent"], "permit" | "refuse" | "hold">>) =>
  page.evaluate((next) => Object.assign((window as unknown as Fixture).kindAgent, next), values);

async function act(page: Page, component: string, label: string, action: string, args: unknown[] = []) {
  const entry = (await snapshot(page)).find((item) => item.component === component && item.label === label);
  expect(entry?.actions, `${component} "${label}" offers ${action}`).toContain(action);
  return page.evaluate(
    (steps) => (window as unknown as Fixture).agent.act({ steps }),
    [{ ref: entry?.ref, action, args }],
  );
}

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

const prompt = (page: Page) => page.getByRole("textbox", { name: "Prompt" });
const type = async (page: Page, text: string) => {
  await prompt(page).click();
  await page.keyboard.type(text);
};
const attachToComposer = (page: Page) =>
  page
    .locator('[data-case="composer"] input[type="file"]')
    .setInputFiles({ name: "plan.md", mimeType: "text/markdown", buffer: Buffer.from("# Plan") });
const reply = (page: Page) => page.getByRole("article", { name: "Reply" });
const step = (label: string) => (page: Page) =>
  page.locator('[data-slot="kind-step"]').filter({ hasText: label });
const slot = (name: string) => (page: Page) => page.locator(`[data-slot="${name}"]`);

type Conformance = {
  component: string;
  label: string;
  action: string;
  scope: (page: Page) => Locator;
  args?: (page: Page) => Promise<unknown[]> | unknown[];
  /** Brings the page to where the action applies, the same way for both paths. */
  before?: (page: Page) => Promise<void>;
  /** What a person does for the same result. */
  pointer: (page: Page) => Promise<void>;
};

const conformance: Conformance[] = [
  {
    component: "kind-step",
    label: "Read the logs",
    action: "expand",
    scope: step("Read the logs"),
    pointer: (page) => page.getByRole("button", { name: "Read the logs" }).click(),
  },
  {
    component: "kind-step",
    label: "Search the docs",
    action: "collapse",
    scope: step("Search the docs"),
    pointer: (page) => page.getByRole("button", { name: "Search the docs" }).click(),
  },
  {
    component: "kind-conversation",
    label: "Chat",
    action: "scrollToEnd",
    scope: slot("kind-conversation"),
    before: async (page) => {
      await page
        .locator('[data-slot="kind-conversation-viewport"]')
        .evaluate((el) => el.scrollTo({ top: 0 }));
      await expect(page.getByRole("button", { name: /^Jump to latest/ })).toBeVisible();
    },
    pointer: (page) => page.getByRole("button", { name: /^Jump to latest/ }).click(),
  },
  {
    component: "kind-message",
    label: "Reply",
    action: "copy",
    scope: reply,
    pointer: (page) => reply(page).getByRole("button", { name: "Copy", exact: true }).click(),
  },
  {
    component: "kind-message",
    label: "Reply",
    action: "regenerate",
    scope: reply,
    pointer: (page) => reply(page).getByRole("button", { name: "Regenerate" }).click(),
  },
  {
    component: "kind-message",
    label: "Reply",
    action: "setBranch",
    scope: reply,
    args: () => [1],
    pointer: (page) => page.getByRole("button", { name: "Next response" }).click(),
  },
  {
    component: "kind-message",
    label: "Question",
    action: "edit",
    scope: (page) => page.getByRole("article", { name: "Question" }),
    pointer: (page) => page.getByRole("button", { name: "Edit" }).click(),
  },
  {
    component: "kind-code-block",
    label: "Code",
    action: "copy",
    scope: slot("kind-code-block"),
    pointer: (page) => page.getByRole("button", { name: "Copy code" }).click(),
  },
  {
    component: "kind-code-block",
    label: "Code",
    action: "toggleWrap",
    scope: slot("kind-code-block"),
    pointer: (page) => page.getByRole("button", { name: "Wrap lines" }).click(),
  },
  {
    component: "kind-markdown-table",
    label: "Table",
    action: "copy",
    scope: slot("kind-markdown-table"),
    pointer: (page) => page.getByRole("button", { name: "Copy table" }).click(),
  },
  {
    component: "kind-composer",
    label: "Compose",
    action: "setValue",
    scope: slot("kind-composer"),
    args: () => ["Hello"],
    pointer: (page) => type(page, "Hello"),
  },
  {
    component: "kind-composer",
    label: "Compose",
    action: "insertToken",
    scope: slot("token-input-editor"),
    args: () => [{ kind: "mention", value: "grace", label: "Grace Hopper" }],
    pointer: async (page) => {
      await type(page, "@gra");
      await page.getByRole("option", { name: /Grace Hopper/ }).click();
    },
  },
  {
    component: "kind-composer",
    label: "Compose",
    action: "removeAttachment",
    scope: slot("kind-composer"),
    before: async (page) => {
      await attachToComposer(page);
      await expect(page.getByRole("list", { name: "Attachments" }).getByRole("listitem")).toHaveCount(1);
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (animation) =>
              animation.playState !== "running" ||
              animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
          ),
      );
    },
    args: async (page) => {
      const composer = (await snapshot(page)).find((entry) => entry.component === "kind-composer");
      return [composer?.value?.attachments[0]?.id];
    },
    pointer: (page) => page.locator('[data-case="composer"] [data-slot="kind-attachments-remove"]').click(),
  },
  {
    component: "kind-composer",
    label: "Compose",
    action: "submit",
    scope: slot("kind-composer"),
    before: (page) => type(page, "Hello"),
    pointer: (page) => page.getByRole("button", { name: "Send" }).click(),
  },
  {
    component: "kind-composer",
    label: "Compose",
    action: "stop",
    scope: slot("kind-composer"),
    before: async (page) => {
      await setHost(page, { hold: true });
      await type(page, "Hello");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    },
    pointer: (page) => page.getByRole("button", { name: "Stop" }).click(),
  },
  {
    component: "kind-attachments",
    label: "Files",
    action: "remove",
    scope: (page) => page.getByRole("list", { name: "Files" }),
    args: () => ["notes"],
    pointer: (page) =>
      page
        .getByRole("list", { name: "Files" })
        .getByRole("listitem")
        .filter({ hasText: "notes.md" })
        .locator('[data-slot="kind-attachments-remove"]')
        .click(),
  },
  {
    component: "kind-uploader",
    label: "Uploads",
    action: "cancel",
    scope: slot("kind-uploader"),
    args: () => ["report"],
    pointer: (page) => page.getByRole("button", { name: "Cancel quarterly-report.pdf" }).click(),
  },
  {
    component: "kind-uploader",
    label: "Uploads",
    action: "retry",
    scope: slot("kind-uploader"),
    args: () => ["dataset"],
    pointer: (page) => page.getByRole("button", { name: "Retry training-set.csv" }).click(),
  },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

test("one snapshot lists every Wave 1 component, named where it has a role", async ({ page }) => {
  await open(page);
  const entries = await snapshot(page);
  const named = (component: string) =>
    entries
      .filter((entry) => entry.component === component)
      .map((entry) => entry.label)
      .sort();
  expect(named("kind-step")).toEqual(["Read the logs", "Search the docs"]);
  expect(named("kind-step-list")).toEqual(["Agent steps"]);
  expect(named("kind-conversation")).toEqual(["Chat"]);
  expect(named("kind-message")).toEqual(["Question", "Reply"]);
  expect(named("kind-code-block")).toEqual(["Code"]);
  expect(named("kind-markdown-table")).toEqual(["Table"]);
  expect(named("kind-composer")).toEqual(["Compose"]);
  expect(named("kind-attachments")).toContain("Files");
  expect(named("kind-uploader")).toEqual(["Uploads"]);
  expect(named("kind-loader")).toEqual(["Loading…"]);
  expect(named("kind-thinking-indicator")).toEqual(["Thinking…"]);
  expect(named("kind-typing-indicator")).toEqual(["Typing"]);
  // Markdown and Streaming Text are content with no role, which ARIA doesn't let a name sit on.
  expect(named("kind-markdown")).toHaveLength(1);
  expect(named("kind-streaming-text")).toHaveLength(1);
});

for (const { component, label, action, scope, args, before, pointer } of conformance) {
  test(`${component}.${action} leaves the page as a person's input does`, async ({ page }) => {
    await open(page);
    await before?.(page);
    const result = await act(page, component, label, action, await args?.(page));
    expect(result.error).toBeUndefined();
    let byAgent: string[] = [];
    // Waits for the entrance and exit transitions to finish, so both sides are compared at rest.
    await expect
      .poll(async () => {
        const previous = byAgent;
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

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await act(page, "kind-step", "Read the logs", "expand");
  await act(page, "kind-message", "Reply", "setBranch", [1]);
  await act(page, "kind-composer", "Compose", "setValue", ["Hello"]);
  expect((await host(page)).changes).toEqual(["step:agent", "message:agent", "composer:agent"]);

  await setHost(page, { refuse: true });
  await act(page, "kind-step", "Search the docs", "collapse");
  await act(page, "kind-message", "Reply", "setBranch", [2]);
  await act(page, "kind-composer", "Compose", "setValue", ["Goodbye"]);
  const entries = await snapshot(page);
  const entry = (component: string, label: string) =>
    entries.find((item) => item.component === component && item.label === label);
  expect(entry("kind-step", "Search the docs")?.open).toBe(true);
  expect(entry("kind-message", "Reply")?.branchIndex).toBe(1);
  expect(entry("kind-composer", "Compose")?.value?.text).toBe("Hello");
  await expect(prompt(page)).toHaveText("Hello");
});

test("composer.submit is refused when the permission callback denies it", async ({ page }) => {
  await open(page);
  await type(page, "Hello");
  await setHost(page, { permit: false });
  const refused = await act(page, "kind-composer", "Compose", "submit");
  expect(refused.ok).toBe(false);
  expect((await host(page)).calls).toEqual([]);
  await expect(page.getByRole("form", { name: "Compose" })).not.toHaveAttribute("data-pending", "");

  await setHost(page, { permit: true });
  expect((await act(page, "kind-composer", "Compose", "submit")).ok).toBe(true);
  expect((await host(page)).calls).toEqual(["submit:Hello"]);
});

const actionsOf = async (page: Page, component: string, label: string) =>
  (await snapshot(page)).find((entry) => entry.component === component && entry.label === label)?.actions;

test("an action is listed only while it's available", async ({ page }) => {
  await open(page);
  expect(await actionsOf(page, "kind-composer", "Compose")).not.toContain("stop");
  await setHost(page, { hold: true });
  await type(page, "Hello");
  await page.keyboard.press("Enter");
  await expect.poll(() => actionsOf(page, "kind-composer", "Compose")).toContain("stop");
});

test("a can-* attribute offers its action, and a disabled composer offers no removal", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "web attributes only");
  await open(page);
  await page.locator("kind-uploader").evaluate((el) => el.removeAttribute("can-retry"));
  await expect.poll(() => actionsOf(page, "kind-uploader", "Uploads")).toEqual(["cancel"]);
  await expect(page.getByRole("button", { name: /^Retry/ })).toHaveCount(0);
  await page.locator("kind-uploader").evaluate((el) => el.setAttribute("can-retry", ""));
  await expect.poll(() => actionsOf(page, "kind-uploader", "Uploads")).toEqual(["cancel", "retry"]);

  await attachToComposer(page);
  await expect.poll(() => actionsOf(page, "kind-attachments", "Attachments")).toEqual(["remove"]);
  await page.locator("kind-composer").evaluate((el) => el.setAttribute("disabled", ""));
  await expect.poll(() => actionsOf(page, "kind-attachments", "Attachments")).toEqual([]);
  await expect(page.locator('[data-case="composer"] [data-slot="kind-attachments-remove"]')).toBeHidden();
});
