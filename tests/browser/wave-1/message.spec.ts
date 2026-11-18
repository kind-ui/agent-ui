import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindMessage: { calls: string[]; source: string; append(chunk: string): void; finish(): void };
};

const open = async (page: Page, name: string) => {
  await page.goto(`/?c=message&case=${name}`);
  await expect(page.locator('[data-slot="kind-message"]').first()).toBeAttached();
};
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindMessage.calls);
const assistant = (page: Page) => page.getByRole("article", { name: "Assistant message" });
const user = (page: Page) => page.getByRole("article", { name: "User message" });
const act = (page: Page, steps: unknown[]) =>
  page.evaluate(
    (input) => (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act(input),
    { steps },
  );

test("writes its role and status", async ({ page }) => {
  await open(page, "all");
  await expect(assistant(page)).toHaveAttribute("data-role", "assistant");
  await expect(assistant(page)).toHaveAttribute("data-status", "complete");
  await expect(user(page)).toHaveAttribute("data-role", "user");
});

test("switches branches with the n of m control", async ({ page }) => {
  await open(page, "all");
  const label = assistant(page).locator('[data-slot="kind-message-branch-label"]');
  await expect(label).toHaveText("1 of 3");
  await expect(page.getByRole("button", { name: "Previous response" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.getByRole("button", { name: "Next response" }).click();
  await expect(label).toHaveText("2 of 3");
  await expect(assistant(page)).toContainText("Queue the request");
});

test("edits a user message in place: Escape restores it, Enter saves it", async ({ page }) => {
  await open(page, "all");
  const editor = page.getByRole("textbox", { name: "Edit message" });
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(editor).toBeFocused();
  await editor.fill("Something else");
  await page.keyboard.press("Escape");
  await expect(editor).toBeHidden();
  await expect(user(page)).toContainText("How should the client handle a flaky upstream?");
  expect(await calls(page)).toEqual([]);
  await page.getByRole("button", { name: "Edit" }).click();
  await editor.fill("How do I retry safely?");
  await page.keyboard.press("Enter");
  await expect(editor).toBeHidden();
  await expect(user(page)).toContainText("How do I retry safely?");
  expect(await calls(page)).toEqual(["edit:How do I retry safely?"]);
});

test("copy writes the text to the clipboard and announces it", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page, "all");
  await assistant(page).getByRole("button", { name: "Copy" }).click();
  await expect
    .poll(() => readClipboard(page, browserName))
    .toBe("Retry with exponential backoff, and cap the number of attempts.");
  await expect(assistant(page).locator('[data-slot="kind-message-copy"]')).toHaveAttribute("data-copied", "");
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll("[aria-live]")].map((el) => el.textContent).join("|"),
      ),
    )
    .toContain("Copied");
  expect(await calls(page)).toEqual(["copy:Retry with exponential backoff, and cap the number of attempts."]);
});

test("its actions share one Tab stop", async ({ page }) => {
  await open(page, "all");
  const copy = assistant(page).getByRole("button", { name: "Copy" });
  await copy.focus();
  await page.keyboard.press("ArrowRight");
  await expect(assistant(page).getByRole("button", { name: "Regenerate" })).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await calls(page)).toEqual(["regenerate"]);
});

test("offers only the actions its callbacks allow", async ({ page }) => {
  await open(page, "no-callbacks");
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Regenerate" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Responses" })).toHaveCount(0);
  await expectAgentActions(page, "Assistant message", ["copy"]);
});

test("is a live UI SDK primitive agents can copy, regenerate and switch branches on", async ({
  page,
  context,
  browserName,
}) => {
  await allowClipboard(context, browserName);
  await open(page, "all");
  await expectAgentActions(page, "Assistant message", ["copy", "regenerate", "setBranch"]);
  await expectAgentActions(page, "User message", ["copy", "edit"]);
  await act(page, [{ ref: "Assistant message", action: "setBranch", args: [2] }]);
  await expect(assistant(page).locator('[data-slot="kind-message-branch-label"]')).toHaveText("3 of 3");
  await act(page, [{ ref: "Assistant message", action: "regenerate" }]);
  expect(await calls(page)).toEqual(["regenerate"]);
});

test("streams into a conversation without shifting layout, then shows its actions", async ({ page }) => {
  await open(page, "chat");
  const reply = assistant(page);
  await expect(reply.getByRole("toolbar")).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const { kindMessage } = window as unknown as Fixture;
    type Shift = PerformanceEntry & {
      value: number;
      sources: { previousRect: DOMRect; currentRect: DOMRect }[];
    };
    const shifts: number[] = [];
    // A shift whose sources all paint where they were is sub-pixel snapping while the view follows, not movement.
    const visible = ({ previousRect: a, currentRect: b }: Shift["sources"][number]) =>
      a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Shift[])
        if (entry.sources.some(visible)) shifts.push(entry.value);
    }).observe({ type: "layout-shift" });
    for (let at = 0; at < kindMessage.source.length; at += 20) {
      kindMessage.append(kindMessage.source.slice(at, at + 20));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return shifts;
  });
  expect(result).toEqual([]);
  await page.evaluate(() => (window as unknown as Fixture).kindMessage.finish());
  await expect(reply.getByRole("toolbar", { name: "Message actions" })).toBeVisible();
  await expect(reply).toHaveAttribute("data-status", "complete");
});

test("has no axe violations", async ({ page }) => {
  await open(page, "all");
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

const regenerate = (page: Page) => assistant(page).getByRole("button", { name: "Regenerate" });
const row = (page: Page, name: string | RegExp) => page.getByRole("menuitem", { name });

test.describe("with regenerate options", () => {
  test("Regenerate opens a menu in the toolbar's arrow-key order, and each row regenerates with its option", async ({
    page,
  }) => {
    await open(page, "options");
    await assistant(page).getByRole("button", { name: "Copy" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(regenerate(page)).toBeFocused();
    await expect(regenerate(page)).toHaveAttribute("aria-haspopup", "menu");
    await page.keyboard.press("Enter");
    await expect(row(page, "Try again")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(row(page, /^More concise/)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(regenerate(page)).toBeFocused();

    await regenerate(page).click();
    await row(page, "Try again").click();
    await expect(regenerate(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(row(page, "Try again")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(row(page, "Try with another model")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(row(page, "GPT-5")).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await calls(page)).toEqual([
      "regenerate:concise:item-press:keyboard",
      "regenerate::item-press:mouse",
      "regenerate:gpt-5:item-press:keyboard",
    ]);
  });

  test("the menu closes when the message streams again, and stays closed when it settles", async ({
    page,
  }) => {
    await open(page, "options");
    await regenerate(page).click();
    await expect(row(page, "Try again")).toBeVisible();
    await page.evaluate(() =>
      (window as unknown as { kindRegenerate: { status(value: string): void } }).kindRegenerate.status(
        "streaming",
      ),
    );
    await expect(page.getByRole("menu")).toBeHidden();
    await page.evaluate(() =>
      (window as unknown as { kindRegenerate: { status(value: string): void } }).kindRegenerate.status(
        "complete",
      ),
    );
    await expect(regenerate(page)).toBeVisible();
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("a regenerate the host cancels keeps the menu open", async ({ page }) => {
    await open(page, "refusing");
    await regenerate(page).click();
    await row(page, "Add details").click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await calls(page)).toEqual(["regenerate:details:item-press:mouse"]);
  });

  test("agents regenerate with an option by id or label, and an unknown one is refused", async ({ page }) => {
    await open(page, "options");
    await expectAgentActions(page, "Assistant message", ["copy", "regenerate"]);
    await act(page, [{ ref: "Assistant message", action: "regenerate", args: ["concise"] }]);
    await act(page, [{ ref: "Assistant message", action: "regenerate", args: ["Claude Sonnet"] }]);
    await act(page, [{ ref: "Assistant message", action: "regenerate" }]);
    const refused = await act(page, [{ ref: "Assistant message", action: "regenerate", args: ["nope"] }]);
    expect(JSON.stringify(refused)).toContain("nope");
    expect(await calls(page)).toEqual([
      "regenerate:concise:imperative:agent",
      "regenerate:claude-sonnet:imperative:agent",
      "regenerate::imperative:agent",
    ]);
  });

  test("content replaces the rows", async ({ page }, testInfo) => {
    test.skip(layerOf(testInfo) === "web", "web writes its rows into the content");
    await open(page, "custom-rows");
    await regenerate(page).click();
    await row(page, "ADD DETAILS").click();
    expect(await calls(page)).toEqual(["regenerate:details:item-press:mouse"]);
  });

  test("menu markup without options regenerates as a plain button", async ({ page }, testInfo) => {
    test.skip(layerOf(testInfo) !== "web", "web markup keeps its menu; React renders a button");
    await open(page, "no-options");
    await regenerate(page).click();
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByRole("menuitem")).toHaveCount(0);
    expect(await calls(page)).toEqual(["regenerate::regenerate-press:mouse"]);
  });

  for (const scheme of ["light", "dark"] as const)
    test(`has no axe violations with the menu open, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "options");
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await regenerate(page).click();
      await expect(row(page, "Try again")).toBeVisible();
      await page.waitForFunction(
        () =>
          !document.querySelector("[data-starting-style]") &&
          document.getAnimations().every((animation) => animation.playState !== "running"),
      );
      const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
      expect(violations).toEqual([]);
    });
});
