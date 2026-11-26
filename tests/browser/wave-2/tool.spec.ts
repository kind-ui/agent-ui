import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindTool: {
    set(id: string, next: Record<string, unknown>): void;
    setCall(id: string, next: Record<string, unknown>): void;
  };
  kindAnnounced: string[];
  kindHost: { decisions: { choice: string; decision: unknown; resolve(): void }[] };
};

const tool = (page: Page, id: string) => page.locator(`#${id}`);
const trigger = (page: Page, id: string) => tool(page, id).locator('[data-slot="kind-tool-trigger"]');
const part = (page: Page, id: string, name: string) =>
  tool(page, id).locator(`[data-slot="kind-tool-${name}"]`);
const set = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTool.set(i, n), [id, next] as const);
const setCall = (page: Page, id: string, next: Record<string, unknown>) =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTool.setCall(i, n), [id, next] as const);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const outcome = (page: Page, id: string) =>
  part(page, id, "approval").locator('[data-slot="kind-confirmation-outcome"]');
const decisions = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.decisions.map(({ choice, decision }) => ({ choice, decision })),
  );
const sent = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindHost.decisions[0]?.resolve());
const approval = (state: string, decision?: { approved: boolean }) => ({
  approval: { approvalId: "a1", generation: 1, state, ...(decision && { decision }) },
});

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
  await expect(part(page, "search", "input").locator("code")).toHaveText('{ "query": "ste" }');
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

test("copy writes the input and output as shown", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await open(page);
  await part(page, "read", "input-copy").click();
  await expect.poll(() => readClipboard(page, browserName)).toBe('{ "path": "README.md" }');
  await setCall(page, "read", { output: { state: "preliminary", value: false } });
  await part(page, "read", "output-copy").click();
  await expect.poll(() => readClipboard(page, browserName)).toBe("false");
  await expect(part(page, "read", "output-copy")).toHaveAttribute("data-copied", "");
});

test("the header keeps its height from running through approval to complete", async ({ page }) => {
  await open(page);
  const height = async () => (await trigger(page, "run").boundingBox())?.height;
  const before = await height();
  await setCall(page, "run", { approval: { approvalId: "a2", generation: 1, state: "requested" } });
  await expect(outcome(page, "run")).toHaveText("Waiting for approval");
  await expect(outcome(page, "run").locator('[data-slot="kind-confirmation-outcome-icon"]')).toBeHidden();
  expect(await height()).toBe(before);
  await setCall(page, "run", {
    approval: { approvalId: "a2", generation: 1, state: "responded", decision: { approved: true } },
    output: { state: "available", value: { passed: 42 } },
  });
  await expect(outcome(page, "run")).toHaveText("Approved");
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

test("a denial is announced apart from a cancellation", async ({ page }) => {
  await open(page);
  await setCall(page, "approve", approval("responded", { approved: false }));
  await expect(outcome(page, "approve")).toHaveText("Denied");
  await expect.poll(() => announced(page)).toEqual(["Denied"]);
  await setCall(page, "approve", { outcome: "denied" });
  await expect(tool(page, "approve")).toHaveAttribute("data-status", "cancelled");
  await expect.poll(() => announced(page)).toEqual(["Denied", "delete_file denied"]);
  await setCall(page, "run", { outcome: "cancelled" });
  await expect.poll(() => announced(page)).toEqual(["Denied", "delete_file denied", "run_tests cancelled"]);
});

test("a host status and label replace the call's", async ({ page }) => {
  await open(page);
  await set(page, "run", { status: "error", label: "Run the tests" });
  await expect(trigger(page, "run")).toContainText("Run the tests");
  await expect(part(page, "run", "error")).toHaveText("The tool failed.");
});

test("with no input yet, there's nothing to copy", async ({ page }) => {
  await open(page);
  await setCall(page, "search", { input: { state: "streaming", value: undefined } });
  await expect(part(page, "search", "input-copy")).toBeHidden();
  await expectAgentActions(page, "search_docs", ["collapse", "expand", "press"]);
});

test("without onApprove or onDeny, an approval request shows as status", async ({ page }) => {
  await open(page);
  await setCall(page, "run", approval("requested"));
  await expect(tool(page, "run")).toHaveAttribute("data-status", "awaiting-input");
  await expect(outcome(page, "run")).toHaveText("Waiting for approval");
  await expect(part(page, "run", "approval")).toHaveAttribute("data-approval", "requested");
  await expect(tool(page, "run").getByRole("button", { name: /approve|deny/i })).toHaveCount(0);
});

test("an approval request is decided in the tool, which stays awaiting input until it's recorded", async ({
  page,
}) => {
  await open(page);
  const confirmation = tool(page, "approve").getByRole("group", { name: "Run delete_file?" });
  await expect(tool(page, "approve")).toHaveAttribute("data-status", "awaiting-input");
  await confirmation.getByRole("button", { name: "Approve" }).click();
  expect(await decisions(page)).toEqual([
    { choice: "approve", decision: { approvalId: "a1", generation: 1 } },
  ]);
  await sent(page);
  await setCall(page, "approve", approval("submit-failed"));
  await expect(tool(page, "approve")).toHaveAttribute("data-status", "awaiting-input");
  await expect(confirmation.getByRole("button", { name: "Approve" })).not.toHaveAttribute("aria-disabled");
  await expect.poll(() => announced(page)).toEqual(["Decision not sent"]);
});

test("when the choices leave with focus, focus moves to the outcome in their place", async ({ page }) => {
  await open(page);
  await tool(page, "approve").getByRole("button", { name: "Deny" }).focus();
  await setCall(page, "approve", approval("responded", { approved: false }));
  await expect(tool(page, "approve").locator('[data-slot="kind-confirmation-outcome"]')).toBeFocused();
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
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  type KindTool = HTMLElement & { open: boolean; api: { collapse(): boolean } };
  const search = tool(page, "search");
  expect(await search.evaluate((el: KindTool) => el.open)).toBe(true);
  expect(await search.evaluate((el: KindTool) => el.api.collapse())).toBe(true);
  await expect(search).not.toHaveAttribute("data-open");
});

test("kind-tool fills in input and output parts written empty", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web elements only");
  await open(page);
  await page.evaluate(() => {
    const element = document.createElement("kind-tool");
    element.id = "written";
    element.innerHTML = `<kind-tool-trigger><button><kind-tool-icon></kind-tool-icon><kind-tool-title>Search</kind-tool-title></button></kind-tool-trigger><kind-tool-content><kind-tool-input></kind-tool-input><kind-tool-output></kind-tool-output></kind-tool-content>`;
    document.querySelector("#root > div")?.append(element);
    Object.assign(element, {
      call: {
        toolCallId: "w1",
        name: "search_docs",
        dynamic: false,
        input: { state: "ready", value: { query: "steps" } },
        output: { state: "preliminary", value: 0 },
      },
    });
  });
  await expect(trigger(page, "written")).toHaveText("Search");
  await expect(part(page, "written", "input").locator("code")).toHaveText('{ "query": "steps" }');
  await expect(part(page, "written", "output").locator("code")).toHaveText("0");
  await expect(part(page, "written", "output").locator('[data-slot="kind-code-block-header"]')).toHaveCount(
    0,
  );
  await expect(part(page, "written", "input").locator("kind-code-block")).toHaveAttribute(
    "aria-label",
    "search_docs input",
  );
  await part(page, "written", "input").evaluate((el) => {
    el.innerHTML = `<kind-code-block headerless aria-label="Query"></kind-code-block>`;
  });
  await set(page, "written", { label: "Docs search" });
  await expect(part(page, "written", "output").locator("kind-code-block")).toHaveAttribute(
    "aria-label",
    "Docs search output",
  );
  await expect(part(page, "written", "input").locator("kind-code-block")).toHaveAttribute(
    "aria-label",
    "Query",
  );
});
