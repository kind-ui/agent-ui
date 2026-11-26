import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindTerminal: {
    set(id: string, next: Record<string, unknown>): void;
    append(id: string, text: string): void;
  };
  kindHost: { copies: [string, string][] };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const terminal = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  terminal(page, id).locator(`[data-slot="kind-terminal-${name}"]`);
const trigger = (page: Page, id: string) => part(page, id, "trigger");
const viewport = (page: Page, id: string) => part(page, id, "viewport");
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTerminal.set(i, n), [id, next] as const);
const append = (page: Page, id: string, text: string) =>
  page.evaluate(([i, t]) => (window as unknown as Fixture).kindTerminal.append(i, t), [id, text] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
      ),
  );
// WebKit, like Safari, doesn't focus a button on click, so there it presses the focused button with Enter.
const activate = async (button: Locator, browserName: string) => {
  if (browserName !== "webkit") return button.click();
  await button.focus();
  await button.press("Enter");
};
const scrollTopAtRest = (page: Page, id: string) =>
  viewport(page, id).evaluate(async (el) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let top = -1;
    while (top !== el.scrollTop) {
      top = el.scrollTop;
      await frame();
      await frame();
    }
    return top;
  });
const scrolledToEnd = (page: Page, id: string) =>
  viewport(page, id).evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop <= 1);

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
  await page.goto(`/?c=terminal&case=${name}`);
  await expect(page.locator('[data-slot="kind-terminal"]').first()).toBeVisible();
};

test("shows the command, its colored output, exit code and duration", async ({ page }) => {
  await open(page);
  await expect(terminal(page, "test")).toHaveAttribute("data-status", "running");
  await expect(terminal(page, "test")).toHaveAttribute("data-open", "");
  await expect(trigger(page, "test")).toHaveText("npm test4 sec");
  // The title is the command, so the screen doesn't show it again.
  await expect(part(page, "test", "command")).toBeHidden();
  await expect(part(page, "test", "exit")).toBeHidden();
  await expect(viewport(page, "test")).toHaveAttribute("role", "log");
  await expect(viewport(page, "test")).toHaveAccessibleName("npm test output");
  await expect(part(page, "test", "line").nth(6)).toHaveText("building 100%");

  await expect(terminal(page, "failed")).toHaveAttribute("data-status", "error");
  await expect(part(page, "failed", "exit")).toHaveText("Exit 1");
  await expect(part(page, "failed", "exit")).toHaveAttribute("data-exit", "failure");
  await expect(terminal(page, "install")).not.toHaveAttribute("data-open", "");
  // The result is said once: a clean exit is the complete mark and the duration, without "Exit 0".
  await expect(part(page, "install", "exit")).toBeHidden();

  // The cursor shows only while the command runs.
  const cursor = (id: string) =>
    part(page, id, "line")
      .last()
      .evaluate((el) => getComputedStyle(el, "::after").content);
  expect(await cursor("test")).not.toBe("none");
  expect(await cursor("failed")).toBe("none");

  await set(page, "test", { label: "Tests" });
  await expect(part(page, "test", "title")).toHaveText("Tests");
  await expect(part(page, "test", "command")).toHaveText("npm test");
});

test("each line sits right after the one before, however the lines before it wrapped", async ({ page }) => {
  await open(page, "owned");
  await terminal(page, "empty").evaluate((el) => {
    (el.parentElement as HTMLElement).style.width = "20rem";
  });
  const lines = ["first line", "a line long enough to wrap in a narrow terminal, twice over", "", "last"];
  for (let count = 1; count <= lines.length; count++) {
    await set(page, "empty", { output: lines.slice(0, count).join("\n") });
    await expect(part(page, "empty", "line")).toHaveCount(count);
  }
  await expect
    .poll(() =>
      part(page, "empty", "line").evaluateAll((els) =>
        els.slice(1).every((el, i) => {
          const before = els[i] as HTMLElement;
          return (el as HTMLElement).offsetTop === before.offsetTop + before.offsetHeight;
        }),
      ),
    )
    .toBe(true);
});

test("colors read their tokens in each scheme", async ({ page }) => {
  await open(page);
  const red = part(page, "test", "line").nth(5).getByText("Expected");
  await expect(red).toHaveAttribute("style", /--kind-ansi-red/);
  await page.emulateMedia({ colorScheme: "light" });
  const light = await red.evaluate((el) => getComputedStyle(el).color);
  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await red.evaluate((el) => getComputedStyle(el).color);
  expect(light).not.toEqual(dark);
});

test("an escape split across chunks styles the text after it, and other escapes show nothing", async ({
  page,
}) => {
  await open(page, "stream-10");
  await append(page, "stream", "\n\x1b[3");
  await append(page, "stream", "1mred\x1b[0m\x1b[2A\x1b[K done");
  const last = part(page, "stream", "line").last();
  await expect(last).toHaveText("red done");
  await expect(last.locator("span").first()).toHaveAttribute("style", /--kind-ansi-red/);
});

test("exit 0 completes and collapses, a failure stays open and names its exit code", async ({ page }) => {
  await open(page);
  await set(page, "test", { exitCode: 1 });
  await expect(terminal(page, "test")).toHaveAttribute("data-status", "error");
  await expect(terminal(page, "test")).toHaveAttribute("data-open", "");
  await expect(part(page, "test", "exit")).toHaveText("Exit 1");
  await expect.poll(() => announced(page)).toContain("npm test failed, exit code 1");

  await set(page, "test", { exitCode: undefined });
  await expect(terminal(page, "test")).toHaveAttribute("data-status", "running");
  await set(page, "test", { exitCode: 0 });
  await expect(terminal(page, "test")).not.toHaveAttribute("data-open", "");
  await expect(part(page, "test", "exit")).toBeHidden();
  await expect.poll(() => announced(page)).toContain("npm test complete");
});

test("follows new output, and releases when the reader scrolls up", async ({ page, browserName }) => {
  await open(page, "stream-10");
  for (let chunk = 0; chunk < 20; chunk++) {
    await append(page, "stream", Array.from({ length: 100 }, (_, i) => `\nline ${chunk * 100 + i}`).join(""));
  }
  await expect(part(page, "stream", "line").last()).toHaveText("line 1999");
  await expect.poll(() => scrolledToEnd(page, "stream")).toBe(true);
  await expect(terminal(page, "stream").locator('[data-slot="kind-terminal-line"]')).not.toHaveCount(2010);

  await viewport(page, "stream").hover();
  await page.mouse.wheel(0, -400);
  await expect(viewport(page, "stream")).not.toHaveAttribute("data-following", "");
  const jump = part(page, "stream", "jump");
  await expect(jump).toBeVisible();
  const top = await scrollTopAtRest(page, "stream");
  const first = part(page, "stream", "line").first();
  const before = await first.evaluate((el) => [el.textContent, el.getBoundingClientRect().top]);
  await append(page, "stream", "\nmore\nand more");
  await expect.poll(() => viewport(page, "stream").evaluate((el) => el.scrollHeight)).toBeGreaterThan(0);
  expect(await viewport(page, "stream").evaluate((el) => el.scrollTop)).toBe(top);
  expect(await first.evaluate((el) => [el.textContent, el.getBoundingClientRect().top])).toEqual(before);

  await activate(jump, browserName);
  await expect(viewport(page, "stream")).toHaveAttribute("data-following", "");
  await expect(jump).toBeHidden();
  await expect(viewport(page, "stream")).toBeFocused();
  await expect(part(page, "stream", "line").last()).toHaveText("and more");
});

test("a chunk updates only the lines it reaches, and output that starts over replaces them all", async ({
  page,
}) => {
  await open(page, "stream-10");
  const lines = part(page, "stream", "line");
  await append(page, "stream", "\nd");
  await expect(lines.last()).toHaveText("d");
  await expect(terminal(page, "stream").locator("[data-last]")).toHaveCount(1);
  await expect(lines.last()).toHaveAttribute("data-last", "");
  await set(page, "stream", { output: "a\nb\x1b[31mc" });
  await expect(lines).toHaveText(["a", "bc"]);
  await expect(lines.nth(1)).toHaveAttribute("data-last", "");
  await expect(lines.nth(0)).not.toHaveAttribute("data-last", "");
});

test("an owner keeps the run open and the clipboard, and empty output offers no copy", async ({
  page,
  context,
  browserName,
}) => {
  await allowClipboard(context, browserName);
  await open(page, "owned");
  await trigger(page, "held").click();
  await expect(terminal(page, "held")).toHaveAttribute("data-open", "");
  await page.evaluate(() => navigator.clipboard.writeText("kept"));
  await part(page, "held", "copy").click();
  await expect.poll(() => page.evaluate(() => (window as unknown as Fixture).kindHost.copies.length)).toBe(1);
  expect(await readClipboard(page, browserName)).toBe("kept");
  await expect(part(page, "held", "copy")).not.toHaveAttribute("data-copied", "");

  await expect(part(page, "empty", "copy")).toBeHidden();
  await expectAgentActions(page, "npm run build", ["collapse", "expand", "press"]);
  await append(page, "empty", "building");
  await expect(part(page, "empty", "copy")).toBeVisible();
  await expectAgentActions(page, "npm run build", ["collapse", "copy", "expand", "press"]);
});

test("the keyboard opens the run, copies its output and scrolls it", async ({
  page,
  context,
  browserName,
}) => {
  await allowClipboard(context, browserName);
  await open(page);
  await trigger(page, "install").focus();
  await page.keyboard.press("Enter");
  await expect(terminal(page, "install")).toHaveAttribute("data-open", "");
  await page.keyboard.press("Tab");
  await expect(part(page, "install", "copy")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => readClipboard(page, browserName))
    .toBe("added 214 packages in 3s\n\n48 packages are looking for funding\n  run `npm fund` for details");
  await expect(part(page, "install", "copy")).toHaveAttribute("data-copied", "");
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.copies.at(-1)?.[1])).toBe(
    "copy-press",
  );
  await page.keyboard.press("Tab");
  await expect(viewport(page, "install")).toBeFocused();
});

test("agents expand, collapse and copy", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  await expectAgentActions(page, "npm install", ["collapse", "copy", "expand", "press"]);
  const act = (action: string) =>
    page.evaluate(
      (name) => (window as unknown as Fixture).agent.act({ steps: [{ ref: "npm install", action: name }] }),
      action,
    );
  await act("expand");
  await expect(terminal(page, "install")).toHaveAttribute("data-open", "");
  await act("copy");
  await expect.poll(() => readClipboard(page, browserName)).toContain("added 214 packages");
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.copies.at(-1)?.[1])).toBe(
    "imperative",
  );
  await act("collapse");
  await expect(terminal(page, "install")).not.toHaveAttribute("data-open", "");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page, "install").click();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-terminal put back in the page draws its lines and keeps open", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  const failed = terminal(page, "failed");
  await failed.evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(el);
  });
  await expect(failed).toHaveAttribute("data-open", "");
  await expect(part(page, "failed", "line").nth(6)).toHaveText("building 100%");
  await append(page, "failed", "\nagain");
  await expect(part(page, "failed", "line").last()).toHaveText("again");
});

test("kind-terminal exposes live open state and its api", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  const install = terminal(page, "install");
  expect(await install.evaluate((el: HTMLElementTagNameMap["kind-terminal"]) => el.open)).toBe(false);
  await install.evaluate((el: HTMLElementTagNameMap["kind-terminal"]) => el.api.expand());
  await expect(install).toHaveAttribute("data-open", "");
  expect(await install.evaluate((el: HTMLElementTagNameMap["kind-terminal"]) => el.open)).toBe(true);
});
