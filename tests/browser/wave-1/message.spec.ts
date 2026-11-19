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

test("Cancel and Save take the toolbar's place while editing; Tab reaches them without saving", async ({
  page,
}) => {
  await open(page, "all");
  const editor = page.getByRole("textbox", { name: "Edit message" });
  const edit = page.getByRole("button", { name: "Edit" });
  await edit.click();
  await expect(edit).toBeHidden();
  await editor.fill("Something else");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(editor).toBeHidden();
  await expect(edit).toBeFocused();
  expect(await calls(page)).toEqual([]);
  await edit.click();
  await editor.fill("How do I retry safely?");
  await page.getByRole("button", { name: "Save" }).click();
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

test.describe("author and time", () => {
  const message = (page: Page, id: string) => page.getByRole("article", { name: `Message ${id}` });

  test("shows the author's name and initials, and a continued message hides both", async ({ page }) => {
    await open(page, "author");
    const first = message(page, "today");
    await expect(first.locator('[data-slot="kind-message-author"]')).toHaveText("Ada Lovelace");
    await expect(first.locator('[data-slot="kind-message-avatar"]')).toHaveText("AL");
    const next = message(page, "continued");
    await expect(next.locator('[data-slot="kind-message-author"]')).toBeHidden();
    await expect(next.locator('[data-slot="kind-message-avatar"]')).toHaveCSS("visibility", "hidden");
  });

  test("reads the time of day today, the date otherwise, and how long it took", async ({ page }) => {
    await open(page, "author");
    const today = message(page, "today").locator("time");
    await expect(today).toHaveText("9:41 AM");
    await expect(today).toHaveAttribute("datetime", "2026-11-18T09:41:00Z");
    await expect(message(page, "today").locator('[data-slot="kind-message-duration"]')).toHaveText(
      "1 min 12 sec",
    );
    const yesterday = message(page, "yesterday").locator("time");
    await expect(yesterday).toHaveText("Nov 17, 9:41 AM");
    await expect(yesterday).toHaveAttribute("datetime", "2026-11-17T09:41:00Z");
  });

  test("without `now`, reads today from the browser's clock", async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("console", (entry) => {
      if (entry.type() === "error") errors.push(entry.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date("2026-11-18T12:00:00Z"));
    await open(page, "author-clock");
    const today = message(page, "today").locator("time");
    await expect(today).toHaveText("9:41 AM");
    await expect(today).toHaveAttribute("datetime", "2026-11-18T09:41:00Z");
    const yesterday = message(page, "yesterday").locator("time");
    await expect(yesterday).toHaveText("Nov 17, 9:41 AM");
    await expect(yesterday).toHaveAttribute("datetime", "2026-11-17T09:41:00Z");
    if (layerOf(testInfo) === "react") expect(errors).toEqual([]);
  });

  test("a page left open past midnight shows today's time with its date", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-18T23:59:30Z") });
    await open(page, "author-clock");
    const today = message(page, "today").locator("time");
    await expect(today).toHaveText("9:41 AM");
    await page.clock.runFor(60_000);
    await expect(today).toHaveText("Nov 18, 9:41 AM");
  });

  test("clearing the author empties the avatar it filled", async ({ page }, testInfo) => {
    test.skip(layerOf(testInfo) !== "web", "web fills its avatar part itself");
    await open(page, "author");
    const avatar = message(page, "today").locator('[data-slot="kind-message-avatar"]');
    await expect(avatar).toHaveText("AL");
    await page.evaluate(() => {
      (document.querySelector("#today") as HTMLElement & { author?: unknown }).author = undefined;
    });
    await expect(avatar).toBeEmpty();
  });
});

test.describe("an answer that stops or fails", () => {
  type Outcomes = {
    kindOutcome: { calls: string[]; status(id: string, value: string): void; settle(ok: boolean): void };
    kindAnnounced: string[];
  };
  const openOutcomes = async (page: Page) => {
    await page.addInitScript(() => {
      const announced: string[] = [];
      Object.assign(window, { kindAnnounced: announced });
      new MutationObserver((mutations) => {
        for (const { target } of mutations)
          if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
            announced.push(target.textContent);
      }).observe(document, { childList: true, subtree: true });
    });
    await open(page, "outcomes");
    await expect(page.getByRole("article", { name: "Earlier answer" })).toHaveAttribute(
      "data-status",
      "error",
    );
  };
  const status = (page: Page, id: string, value: string) =>
    page.evaluate(([name, next]) => (window as unknown as Outcomes).kindOutcome.status(name, next), [
      id,
      value,
    ] as const);
  const settle = (page: Page, ok: boolean) =>
    page.evaluate((value) => (window as unknown as Outcomes).kindOutcome.settle(value), ok);
  const outcomeCalls = (page: Page) => page.evaluate(() => (window as unknown as Outcomes).kindOutcome.calls);
  const announced = (page: Page) => page.evaluate(() => (window as unknown as Outcomes).kindAnnounced);
  const answer = (page: Page, name: string) => page.getByRole("article", { name });

  test("announces each outcome once, without moving the text above it", async ({ page }) => {
    await openOutcomes(page);
    const content = answer(page, "Stopped answer").locator('[data-slot="kind-message-content"]');
    const before = await content.boundingBox();
    await status(page, "stopped", "aborted");
    await expect(answer(page, "Stopped answer").getByText("Stopped", { exact: true })).toBeVisible();
    expect(await content.boundingBox()).toEqual(before);
    await expect.poll(() => announced(page)).toEqual(["Response stopped"]);
    await status(page, "failed", "error");
    await expect(answer(page, "Failed answer").getByText("The model is overloaded")).toBeVisible();
    await expect.poll(() => announced(page)).toEqual(["Response stopped", "Response failed"]);
  });

  test("Retry and Continue lock while pending and unlock once their promise settles", async ({ page }) => {
    await openOutcomes(page);
    await status(page, "failed", "error");
    const retry = answer(page, "Failed answer").getByRole("button", { name: "Retry" });
    await retry.click();
    await expect(retry).toHaveAttribute("aria-disabled", "true");
    await retry.click({ force: true });
    expect(await outcomeCalls(page)).toEqual(["retry:retry-press:mouse"]);
    await settle(page, false);
    await expect(retry).not.toHaveAttribute("aria-disabled");

    await status(page, "stopped", "aborted");
    const resume = answer(page, "Stopped answer").getByRole("button", { name: "Continue" });
    await resume.click();
    await expect(resume).toHaveAttribute("aria-disabled", "true");
    await settle(page, true);
    await expect(resume).not.toHaveAttribute("aria-disabled");
    expect(await outcomeCalls(page)).toEqual(["retry:retry-press:mouse", "continue:continue-press:mouse"]);
  });

  test("when Retry leaves holding focus, focus moves to the next tab stop after the message", async ({
    page,
  }) => {
    await openOutcomes(page);
    const retry = answer(page, "Earlier answer").getByRole("button", { name: "Retry" });
    await retry.focus();
    await page.keyboard.press("Enter");
    expect(await outcomeCalls(page)).toEqual(["retry:retry-press:keyboard"]);
    await status(page, "earlier", "submitted");
    await expect(page.getByRole("textbox", { name: "Reply" })).toBeFocused();
  });

  test("agents retry a failed answer and continue a stopped one", async ({ page }) => {
    await openOutcomes(page);
    await expectAgentActions(page, "Earlier answer", ["copy", "retry"]);
    await status(page, "stopped", "aborted");
    await expectAgentActions(page, "Stopped answer", ["copy", "continue"]);
    await act(page, [{ ref: "Stopped answer", action: "continue" }]);
    expect(await outcomeCalls(page)).toEqual(["continue:imperative:agent"]);
    await expectAgentActions(page, "Stopped answer", ["copy"]);
  });

  for (const scheme of ["light", "dark"] as const)
    test(`has no axe violations with its outcomes and author, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      for (const name of ["outcomes", "author"]) {
        await open(page, name);
        await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
        if (name === "outcomes") {
          await status(page, "stopped", "aborted");
          await status(page, "failed", "error");
        }
        await page.waitForFunction(() =>
          document.getAnimations().every((animation) => animation.playState !== "running"),
        );
        const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
        expect(violations, name).toEqual([]);
      }
    });
});
