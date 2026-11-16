import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindTool: {
    set(id: string, next: Record<string, unknown>): void;
    setCall(id: string, next: Record<string, unknown>): void;
  };
  kindAnnounced: string[];
};

const tool = (page: Page, id: string) => page.locator(`#${id}`);
const trigger = (page: Page, id: string) => tool(page, id).locator('[data-slot="kind-tool-trigger"]');
const part = (page: Page, id: string, name: string) =>
  tool(page, id).locator(`[data-slot="kind-tool-${name}"]`);
const setCall = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTool.setCall(i, n), [id, next] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);

const open = async (page: Page) => {
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
  await page.goto("/?c=tool&case=all");
  await expect(trigger(page, "search")).toHaveText("search_docs");
};

test("shows the input as partial while it streams, then as ready", async ({ page }) => {
  await open(page);
  const search = tool(page, "search");
  await expect(search).toHaveAttribute("data-kind", "tool");
  await expect(search).toHaveAttribute("data-status", "running");
  await expect(search).toHaveAttribute("data-open", "");
  await expect(part(page, "search", "input")).toHaveAttribute("data-state", "streaming");
  await expect(part(page, "search", "input").getByText("Partial")).toBeVisible();
  await expect(part(page, "search", "input").locator("code")).toHaveText('{  "query": "ste"}');
  await setCall(page, "search", { input: { state: "ready", value: { query: "steps" } } });
  await expect(part(page, "search", "input").getByText("Partial")).toBeHidden();
  await expect(part(page, "search", "output")).toBeHidden();
});

test("output of 0 shows 0, and agents can copy it", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "search_docs", ["collapse", "copyInput", "expand", "press"]);
  await setCall(page, "search", { output: { state: "preliminary", value: 0 } });
  await expect(part(page, "search", "output")).toHaveAttribute("data-state", "preliminary");
  await expect(part(page, "search", "output").getByText("Preliminary")).toBeVisible();
  await expect(part(page, "search", "output").locator("code")).toHaveText("0");
  await expectAgentActions(page, "search_docs", ["collapse", "copyInput", "copyOutput", "expand", "press"]);
});

test("collapses into a compact summary when complete, and shows text output as markdown", async ({
  page,
}) => {
  await open(page);
  await setCall(page, "search", { output: { state: "available", value: "Found **2** pages." } });
  await expect(tool(page, "search")).toHaveAttribute("data-status", "complete");
  await expect(tool(page, "search")).not.toHaveAttribute("data-open");
  await trigger(page, "search").click();
  await expect(part(page, "search", "output").locator("strong")).toHaveText("2");
  await expect(part(page, "search", "output").locator('[data-slot="kind-code-block"]')).toBeHidden();
});

test("updating one call leaves the others open and copied", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  await part(page, "search", "input-copy").click();
  await expect(part(page, "search", "input-copy")).toHaveAttribute("data-copied", "");
  await setCall(page, "read", { output: { state: "available", value: { lines: 12 } } });
  await expect(tool(page, "read")).not.toHaveAttribute("data-open");
  await expect(tool(page, "search")).toHaveAttribute("data-open", "");
  await expect(tool(page, "run")).toHaveAttribute("data-open", "");
  await expect(part(page, "search", "input-copy")).toHaveAttribute("data-copied", "");
});

test("copy writes the input as shown", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  await part(page, "read", "input-copy").click();
  await expect.poll(() => readClipboard(page, browserName)).toBe('{\n  "path": "README.md"\n}');
});

test("the header keeps its height from running through approval to complete", async ({ page }) => {
  await open(page);
  const height = async () => (await trigger(page, "run").boundingBox())?.height;
  const before = await height();
  await setCall(page, "run", { approval: { approvalId: "a2", generation: 1, state: "requested" } });
  await expect(part(page, "run", "approval")).toHaveText("Waiting for approval");
  expect(await height()).toBe(before);
  await setCall(page, "run", {
    approval: { approvalId: "a2", generation: 1, state: "responded", decision: { approved: true } },
    output: { state: "available", value: { passed: 42 } },
  });
  await expect(part(page, "run", "approval")).toHaveText("Approved");
  await expect(tool(page, "run")).toHaveAttribute("data-status", "complete");
  expect(await height()).toBe(before);
});

test("streaming input never moves the header", async ({ page }) => {
  await open(page);
  const box = () => trigger(page, "search").boundingBox();
  const before = await box();
  let query = "";
  for (let i = 0; i < 20; i++) {
    query += `word ${i} `;
    await setCall(page, "search", { input: { state: "streaming", value: { query } } });
  }
  await expect(part(page, "search", "input").locator("code")).toContainText("word 19");
  expect(await box()).toEqual(before);
});

test("an error shows its message and is announced once", async ({ page }) => {
  await open(page);
  await expect(part(page, "failed", "error")).toBeAttached();
  await trigger(page, "failed").click();
  await expect(part(page, "failed", "error")).toHaveText("Request timed out after 30 s.");
  await setCall(page, "search", { outcome: "error" });
  await expect(tool(page, "search")).toHaveAttribute("data-open", "");
  await expect(part(page, "search", "error")).toHaveText("The tool failed.");
  await expect.poll(() => announced(page)).toEqual(["search_docs failed"]);
});

test("an approval request shows as status, needing input", async ({ page }) => {
  await open(page);
  await expect(tool(page, "approve")).toHaveAttribute("data-status", "awaiting-input");
  await expect(part(page, "approve", "approval")).toHaveText("Waiting for approval");
  await expect(part(page, "approve", "approval")).toHaveAttribute("data-approval", "requested");
  await expect(tool(page, "approve").getByRole("button", { name: /approve|deny/i })).toHaveCount(0);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page, "failed").click();
    await trigger(page, "done").click();
    await setCall(page, "read", { output: { state: "preliminary", value: { lines: 3 } } });
    // Opening panels fade in, which axe would read as low contrast.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-tool exposes live open state and its api", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  type KindTool = HTMLElement & { open: boolean; api: { collapse(): boolean } };
  const search = tool(page, "search");
  expect(await search.evaluate((el: KindTool) => el.open)).toBe(true);
  expect(await search.evaluate((el: KindTool) => el.api.collapse())).toBe(true);
  await expect(search).not.toHaveAttribute("data-open");
});
