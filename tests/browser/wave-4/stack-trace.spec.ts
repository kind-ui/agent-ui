import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindStackTrace: { set(id: string, next: Record<string, unknown>): void };
  kindHost: { copies: [string, string][]; opened: [number, string, string][]; shown: [boolean, string][] };
  agent: { act(input: unknown): Promise<unknown> };
};

const trace = (page: Page, id: string) => page.locator(`#${id}`);
const part = (page: Page, id: string, name: string) =>
  trace(page, id).locator(`[data-slot="kind-stack-trace-${name}"]`);
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindStackTrace.set(i, n), [id, next] as const);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
      ),
  );
const act = (page: Page, ref: string, action: string, args?: unknown[]) =>
  page.evaluate(
    ([r, a, rest]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a, ...(rest ? { args: rest } : {}) }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action, args] as const,
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=stack-trace&case=${name}`);
  await expect(page.locator('[data-slot="kind-stack-trace"]').first()).toBeVisible();
};

test("shows the error's name and message, and its frames with library frames folded", async ({ page }) => {
  await open(page);
  const stack = trace(page, "stack");
  await expect(stack).toHaveAttribute("role", "group");
  await expect(stack).toHaveAccessibleName("TypeError: x is undefined");
  await expect(stack).toHaveAttribute("data-status", "error");
  await expect(stack).toHaveAttribute("data-open", "");
  await expect(part(page, "stack", "title").locator("[data-stack-trace-name]")).toHaveText("TypeError");

  const frames = part(page, "stack", "frame");
  await expect(frames.first()).toHaveText("readConfigconfig/read.ts:12:9");
  await expect(part(page, "stack", "frame-open").first()).toHaveAttribute(
    "title",
    "/app/src/config/read.ts:12:9",
  );
  const libraries = part(page, "stack", "library");
  await expect(libraries).toHaveText(["2 library frames", "2 library frames"]);
  await expect(libraries.first()).toHaveAttribute("aria-expanded", "false");
  await expect(frames.filter({ hasText: "loadPlugins" })).toBeHidden();
  await expect(frames.filter({ hasText: "loadPlugins" })).toHaveAttribute("data-library", "");
  await expect(frames.filter({ visible: true })).toHaveText([
    "readConfigconfig/read.ts:12:9",
    "startServersrc/server.ts:41:3",
    "mainsrc/index.ts:7:1",
  ]);

  await libraries.first().click();
  await expect(libraries.first()).toHaveAttribute("aria-expanded", "true");
  await expect(libraries.last()).toHaveAttribute("aria-expanded", "true");
  await expect(frames.filter({ hasText: "loadPlugins" })).toBeVisible();
  await expect(frames.filter({ hasText: "processTicksAndRejections" })).toHaveText(
    "process.processTicksAndRejectionsprocess/task_queues:95:5",
  );
  await libraries.last().click();
  await expect(frames.filter({ hasText: "loadPlugins" })).toBeHidden();
});

test("a stack string and the same frames render alike", async ({ page }) => {
  await open(page);
  await part(page, "frames", "library").first().click();
  await part(page, "stack", "library").first().click();
  const text = (id: string) => part(page, id, "list").evaluate((el) => el.textContent);
  expect(await text("frames")).toBe(await text("stack"));
  await expect(part(page, "frames", "frame-open")).toHaveCount(0);
});

test("a multi-line message shows its other lines, and a line it can't read stays raw", async ({ page }) => {
  await open(page);
  await expect(trace(page, "assertion")).not.toHaveAttribute("data-open", "");
  await part(page, "assertion", "trigger").click();
  await expect(trace(page, "assertion")).toHaveAttribute("data-open", "");
  await expect(trace(page, "assertion")).toHaveAccessibleName(
    "AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:",
  );
  await expect(part(page, "assertion", "message")).toHaveText("3 !== 4");
  await expect(part(page, "assertion", "frame")).toHaveText([
    "Context.<anonymous>test/sum.test.ts:8:12",
    "at async Promise.all (index 0)",
  ]);
  await expect(part(page, "stack", "message")).toBeHidden();
});

test("arrow keys move between frames, and Enter opens one", async ({ page }) => {
  await open(page);
  const buttons = part(page, "stack", "frame-open");
  await part(page, "stack", "trigger").focus();
  await page.keyboard.press("Tab");
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(buttons.filter({ hasText: "startServer" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(buttons.filter({ hasText: /^main/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await host(page)).opened).toEqual([[4, "main", "frame-press:keyboard"]]);

  await page.keyboard.press("Home");
  await expect(buttons.first()).toBeFocused();
  // A folded library frame is skipped, and Tab leaves the list for the next control.
  await page.keyboard.press("Tab");
  await expect(part(page, "stack", "library").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(buttons.filter({ hasText: "loadPlugins" })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ArrowDown");
  await expect(buttons.filter({ hasText: "loadPlugins" })).toBeFocused();
});

test("copy copies the message and raw frames, and an owner keeps what it holds", async ({
  page,
  context,
  browserName,
}) => {
  await allowClipboard(context, browserName);
  await open(page);
  await part(page, "stack", "copy").click();
  await expect
    .poll(() => readClipboard(page, browserName))
    .toMatch(/^TypeError: x is undefined\n {4}at readConfig/);
  await expect(part(page, "stack", "copy")).toHaveAttribute("data-copied", "");
  await expect(part(page, "stack", "copy")).toHaveAccessibleName("Copy stack trace");
  expect((await host(page)).copies.at(-1)?.[1]).toBe("copy-press");

  await page.goto("about:blank");
  await open(page, "owned");
  await page.evaluate(() => navigator.clipboard.writeText("kept"));
  await part(page, "held", "copy").click();
  await expect.poll(async () => (await host(page)).copies.length).toBe(1);
  expect(await readClipboard(page, browserName)).toBe("kept");
  await part(page, "held", "library").first().click();
  await expect(part(page, "held", "library").first()).toHaveAttribute("aria-expanded", "false");
});

test("an owner that takes the change shows library frames, and find in page reveals them", async ({
  page,
}) => {
  await open(page, "owned");
  const frames = part(page, "accepted", "library-frames");
  await part(page, "accepted", "library").last().click();
  await expect(frames.first()).toBeVisible();
  await expect(part(page, "accepted", "library").first()).toHaveAttribute("aria-expanded", "true");
  await part(page, "accepted", "library").first().click();
  await expect(frames.first()).toHaveAttribute("hidden", "until-found");
  await frames.first().evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
  await expect(frames.first()).toBeVisible();
  expect((await host(page)).shown).toEqual([
    [true, "library-press"],
    [false, "library-press"],
    [true, "find-in-page"],
  ]);
});

test("new frames replace the list", async ({ page }) => {
  await open(page);
  await set(page, "frames", {
    frames: [{ raw: "at only (/app/a.ts:1:2)", fn: "only", file: "/app/a.ts", line: 1 }],
  });
  await expect(part(page, "frames", "frame")).toHaveText(["onlyapp/a.ts:1"]);
  await expect(part(page, "frames", "library")).toHaveCount(0);
});

test("agents copy, show library frames and open a frame", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  const label = "TypeError: x is undefined";
  await expectAgentActions(page, label, [
    "collapse",
    "copy",
    "expand",
    "openFrame",
    "press",
    "toggleLibraryFrames",
  ]);
  await expectAgentActions(page, "TypeError from frames", [
    "collapse",
    "copy",
    "expand",
    "press",
    "toggleLibraryFrames",
  ]);

  await act(page, label, "toggleLibraryFrames");
  await expect(part(page, "stack", "library").first()).toHaveAttribute("aria-expanded", "true");
  await act(page, label, "openFrame", ["1"]);
  await expect.poll(async () => (await host(page)).opened).toEqual([[1, "loadPlugins", "imperative:agent"]]);
  expect(JSON.parse(await act(page, label, "openFrame", ["99"]))).toMatchObject({ ok: false });
  expect((await host(page)).opened).toHaveLength(1);
  await act(page, label, "copy");
  await expect.poll(() => readClipboard(page, browserName)).toContain("at startServer");
  expect((await host(page)).copies.at(-1)?.[1]).toBe("imperative");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await part(page, "stack", "library").first().click();
    await part(page, "assertion", "trigger").click();
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-stack-trace takes can-open-frame and keeps its list when put back", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  const frames = trace(page, "frames");
  await part(page, "frames", "library").first().click();
  await frames.evaluate((el) => el.setAttribute("can-open-frame", ""));
  await expect(part(page, "frames", "frame-open")).toHaveCount(7);
  await frames.evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(el);
  });
  await expect(frames).toHaveAttribute("data-open", "");
  await expect(part(page, "frames", "library").first()).toHaveAttribute("aria-expanded", "true");
  const before = await part(page, "frames", "frame").first().elementHandle();
  await frames.evaluate((el: HTMLElementTagNameMap["kind-stack-trace"]) => {
    el.label = "Renamed";
    el.frames = [...(el.frames ?? [])];
  });
  await expect(part(page, "frames", "title")).toHaveText("Renamed");
  expect(await before?.evaluate((el) => el.isConnected)).toBe(true);
  await part(page, "frames", "frame-open").first().click();
  await expect.poll(async () => (await host(page)).opened.at(-1)?.[1]).toBe("readConfig");
});

test("kind-stack-trace fills in the empty parts someone wrote", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page, "written");
  await expect(part(page, "written", "frame").first()).toHaveText("readConfigconfig/read.ts:12:9");
  await expect(part(page, "written", "library")).toHaveAccessibleName("2 library frames");
  await part(page, "written", "library").click();
  await expect(
    part(page, "written", "library-frames").locator('[data-slot="kind-stack-trace-frame"]'),
  ).toHaveText(["loadPluginsdist/index.js:88:14", "PluginHost.startdist/host.js:31:5"]);
  await expect(part(page, "written", "frame").last()).toHaveText("Minesrc/server.ts:41:3");
});
