import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";
import { addBack, travel, watchExit } from "../leaving.js";

type Draft = { text: string; attachments: { name: string; error?: string }[] };
type Fixture = {
  kindComposer: { submissions: { draft: Draft; resolve(): void; reject(): void }[]; stops: number[] };
  blockEnter?: boolean;
  unmountComposer(): void;
  agent: { act(input: unknown): Promise<{ ok: boolean; error?: string }> };
};

const open = async (page: Page, query = "case=full") => {
  await page.goto(`/?c=composer&${query}`);
  const editor = page.getByRole("textbox", { name: "Prompt" });
  await expect(editor).toBeVisible();
  return editor;
};
const stops = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindComposer.stops);
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0);
const drafts = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindComposer.submissions.map(({ draft }) => draft.text));
const settle = (page: Page, outcome: "resolve" | "reject") =>
  page.evaluate((how) => (window as unknown as Fixture).kindComposer.submissions.at(-1)?.[how](), outcome);
const form = (page: Page) => page.getByRole("form", { name: "Message" });

async function attach(
  target: Locator,
  files: { name: string; size: number; type: string }[],
  as: "drop" | "paste",
) {
  await target.evaluate(
    (el, { files, as }) => {
      const data = new DataTransfer();
      for (const { name, size, type } of files) data.items.add(new File(["x".repeat(size)], name, { type }));
      const event =
        as === "drop"
          ? new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true })
          : new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      // Firefox gives a constructed ClipboardEvent an empty copy of `clipboardData`, so the files go on it here.
      if (as === "paste") Object.defineProperty(event, "clipboardData", { value: data });
      el.dispatchEvent(event);
    },
    { files, as },
  );
}

test("a double click on Send submits once, and focus stays in the editor", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("hello");
  await page.getByRole("button", { name: "Send" }).dblclick();
  await expect(form(page)).toHaveAttribute("data-pending", "");
  expect(await drafts(page)).toEqual(["hello"]);
  await expect(editor).toBeFocused();
});

test("typing while pending survives a resolve; a reject keeps the draft", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("first");
  await page.keyboard.press("Enter");
  await page.keyboard.type(" and more");
  await settle(page, "resolve");
  await expect(form(page)).not.toHaveAttribute("data-pending", "");
  await expect(editor).toHaveText("first and more");
  await page.keyboard.press("Enter");
  await settle(page, "reject");
  await expect(form(page)).not.toHaveAttribute("data-pending", "");
  await expect(editor).toHaveText("first and more");
  await expect(editor).toBeFocused();
});

test("Enter on whitespace doesn't submit, and Shift+Enter starts a new line", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("   ");
  await page.keyboard.press("Enter");
  await page.keyboard.type("a");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("b");
  expect(await drafts(page)).toEqual([]);
  await expect(editor).toHaveText(/a\nb/);
});

test("with submitOn mod-enter, Enter starts a new line and Ctrl/Meta+Enter submits", async ({ page }) => {
  const editor = await open(page, "case=mod-enter");
  await editor.click();
  await page.keyboard.type("a");
  await page.keyboard.press("Enter");
  await page.keyboard.type("b");
  expect(await drafts(page)).toEqual([]);
  await page.keyboard.press("ControlOrMeta+Enter");
  expect(await drafts(page)).toEqual(["a\nb"]);
});

test("Enter while an input method composes, or that a keydown listener cancels, doesn't submit", async ({
  page,
}) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("にほん");
  await editor.evaluate((el) =>
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        keyCode: 229,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await page.evaluate(() => Object.assign(window, { blockEnter: true }));
  await page.keyboard.press("Enter");
  expect(await drafts(page)).toEqual([]);
});

test("unmounting while pending, then resolving, raises no error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("bye");
  await page.keyboard.press("Enter");
  await page.evaluate(() => (window as unknown as Fixture).unmountComposer());
  await settle(page, "resolve");
  await expect(form(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("@ and / open the Trigger Menu; choosing inserts a token, Escape closes it", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("Ask @gra");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("option", { name: /Grace Hopper/ }).click();
  await expect(editor.locator('[data-slot="token-input-token"]')).toHaveText("Grace Hopper");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("/");
  await expect(page.getByRole("option", { name: /summarize/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("ArrowUp in an empty editor brings back the last prompt", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.press("ArrowUp");
  await expect(editor).toHaveText("Summarize the open issues");
});

test("a pasted file over maxSize shows its error inline and can't be sent", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await attach(editor, [{ name: "huge.txt", size: 4096, type: "text/plain" }], "paste");
  const attachments = page.getByRole("list", { name: "Attachments" });
  await expect(attachments.getByRole("listitem")).toContainText(["huge.txtFile is too large"]);
  await expect(page.getByRole("button", { name: "Send" })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  expect(await drafts(page)).toEqual([]);
});

test("Delete removes the focused attachment and focus moves to its neighbor", async ({ page }) => {
  await open(page);
  const files = [
    { name: "a.txt", size: 10, type: "text/plain" },
    { name: "b.txt", size: 10, type: "text/plain" },
  ];
  await attach(page.locator('[data-slot="file-input-dropzone"]'), files, "drop");
  const items = page.getByRole("list", { name: "Attachments" }).getByRole("listitem");
  await expect(items).toHaveCount(2);
  await items.first().focus();
  await page.keyboard.press("Delete");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("b.txt");
  await expect(items.first()).toBeFocused();
  await expect(page.locator('[data-slot="kind-attachments-item"]')).toHaveCount(1);
  await expect(items.first()).toBeFocused();
});

test("Stop takes Send's place only while pending, and only with onStop", async ({ page }) => {
  let editor = await open(page);
  await editor.click();
  await page.keyboard.type("go");
  await page.keyboard.press("Enter");
  await expect(form(page)).toHaveAttribute("data-pending", "");
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);

  editor = await open(page, "case=full&stop");
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  await editor.click();
  await page.keyboard.type("go");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
  await page.getByRole("button", { name: "Stop" }).click();
  expect(await stops(page)).toEqual([1]);
  await settle(page, "reject");
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
});

test("has no axe violations with tokens and attachments", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("Ask @gra");
  await page.keyboard.press("Enter");
  await attach(editor, [{ name: "huge.txt", size: 4096, type: "text/plain" }], "paste");
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await settled(page);
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

test("is a live UI SDK primitive: stop while pending, and an agent needs a person", async ({ page }) => {
  const editor = await open(page, "case=full&stop");
  await expectAgentActions(page, "Message", ["insertToken", "removeAttachment", "setValue", "submit"]);
  const refused = await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({ steps: [{ ref: "Message", action: "submit" }] }),
  );
  expect(refused.ok).toBe(false);
  await editor.click();
  await page.keyboard.type("go");
  await page.keyboard.press("Enter");
  await expectAgentActions(page, "Message", [
    "insertToken",
    "removeAttachment",
    "setValue",
    "stop",
    "submit",
  ]);
});

test("Attachments is a live UI SDK primitive with a remove action", async ({ page }) => {
  await page.goto("/?c=composer&case=attachments");
  const list = page.getByRole("list", { name: "Files" });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(list.locator("img")).toHaveCount(1);
  await expectAgentActions(page, "Files", ["remove"]);
});

const chips = {
  root: '[data-slot="kind-attachments"]',
  row: '[data-slot="kind-attachments-item"]',
  name: "[data-name]",
  host: "kindAttachments",
};
const openChips = async (page: Page, motion?: string) => {
  await page.goto(`/?c=composer&case=attachments${motion ? `&motion=${motion}` : ""}`);
  await expect(page.locator(chips.row)).toHaveCount(3);
  await settled(page);
};

test("a removed chip leaves inert, then the chips after it slide into its place without a jump", async ({
  page,
}) => {
  await openChips(page);
  const { leaving, exit, paths } = await watchExit(page, { ...chips, id: "a" });
  expect(leaving).toEqual([{ inert: true, hidden: "true" }]);
  expect(exit).toContain("opacity");
  await expect(page.locator(chips.row)).toHaveCount(2);
  for (const name of ["notes.md", "archive.zip"]) {
    const { total, largestStep } = travel(paths[name] ?? []);
    expect(total).toBeGreaterThan(20);
    expect(largestStep).toBeLessThan(total / 2);
  }
  const { x } = (await page.locator(chips.row).first().boundingBox()) ?? { x: Number.NaN };
  expect(paths["notes.md"]?.at(-1)?.x).toBeCloseTo(x, 0);
});

test("under reduced motion a removed chip only fades, and nothing after it slides", async ({ page }) => {
  await openChips(page, "reduced");
  const { leaving, exit, slid } = await watchExit(page, { ...chips, id: "a" });
  expect({ leaving, exit, slid }).toEqual({
    leaving: [{ inert: true, hidden: "true" }],
    exit: ["opacity"],
    slid: [],
  });
});

test('with motion="none" a removed chip leaves at once', async ({ page }) => {
  await openChips(page, "none");
  const { leaving, slid } = await watchExit(page, { ...chips, id: "a" });
  expect({ leaving, slid }).toEqual({ leaving: [], slid: [] });
  await expect(page.locator(chips.row)).toHaveCount(2);
});

test("a chip removed and added again plays its entrance", async ({ page }) => {
  await openChips(page);
  await watchExit(page, { ...chips, id: "a" });
  expect(await addBack(page, { ...chips, id: "a", text: "diagram.png" })).toBe(true);
});

test("when the host removes the focused chip, focus moves to the next one", async ({ page }) => {
  await openChips(page);
  const items = page.getByRole("list", { name: "Files" }).getByRole("listitem");
  await items.filter({ hasText: "notes.md" }).focus();
  await page.evaluate(() =>
    (window as unknown as { kindAttachments: { remove(id: string): void } }).kindAttachments.remove("b"),
  );
  await expect(items.filter({ hasText: "archive.zip" })).toBeFocused();
  await expect(page.locator(chips.row)).toHaveCount(2);
  await expect(items.filter({ hasText: "archive.zip" })).toBeFocused();
});

test("an edit the owner cancels puts the editor back to the draft", async ({ page }) => {
  const editor = await open(page);
  await editor.click();
  await page.keyboard.type("kept");
  await page.evaluate(() => Object.assign(window, { refuseEdits: true }));
  await page.keyboard.type("x");
  await expect(editor).toHaveText("kept");
});

test("kind-composer wires content added after it connects", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await page.evaluate(() => {
    const form = document.querySelector("kind-composer form") as HTMLFormElement;
    const late = document.createElement("kind-composer");
    document.querySelector("kind-composer")?.remove();
    document.body.append(late);
    late.append(form);
  });
  const editor = page.getByRole("textbox", { name: "Prompt" });
  await editor.click();
  await page.keyboard.type("late");
  type KindComposer = HTMLElement & { value: { text: string } };
  await expect
    .poll(() => page.locator("kind-composer").evaluate((c: KindComposer) => c.value.text))
    .toBe("late");
});
