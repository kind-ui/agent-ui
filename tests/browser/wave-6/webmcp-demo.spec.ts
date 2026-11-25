import { expect, type Page, test } from "@playwright/test";
import { layerOf } from "../layer.js";

// The Agents docs page's demo: a scripted model drives the page through WebMCP, with AI SDK's WebMCP transport.
test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "the docs demo is React");
});

const panel = (page: Page) => page.getByRole("region", { name: "WebMCP calls" });

const entries = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as { agent: { snapshot(): { component: string; label?: string; status?: string }[] } }
    ).agent
      .snapshot()
      .map(({ component, label, status }) => ({ component, label, status })),
  );

async function send(page: Page) {
  await page.goto("/?c=webmcp-demo&case=default");
  await expect(panel(page)).toContainText("act, query, snapshot");
  await page.getByRole("button", { name: "Send" }).click();
}

test("the scripted model reads the page, switches the model and effort, and approves once the person allows it", async ({
  page,
}) => {
  await send(page);
  const question = page.getByRole("group", { name: "The agent asks" });
  await expect(question).toContainText("The agent wants to approve: Run delete_branch?");
  // The steps before the one waiting for the person are already done.
  await expect(page.getByRole("button", { name: /^Model, Claude Opus 5\.5, High effort/ })).toBeVisible();
  await question.getByRole("button", { name: "Allow", exact: true }).click();

  await expect(panel(page)).toContainText("Agent: Done: 3 changes.");
  await expect(question).toBeHidden();
  const calls = panel(page).locator('[data-line="call"]');
  await expect(calls).toHaveCount(2);
  await expect(calls.nth(0)).toContainText("snapshot");
  await expect(calls.nth(1)).toContainText('model-control.setModel("claude-opus-5.5")');
  await expect(calls.nth(1)).toContainText('model-control.setEffort("high")');
  await expect(calls.nth(1)).toContainText("confirmation.approve()");
  await expect(page.getByText("Approved")).toBeVisible();
  expect(await entries(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        component: "kind-model-control",
        label: "Model, Claude Opus 5.5, High effort",
      }),
      expect.objectContaining({ component: "kind-tool", label: "delete_branch", status: "complete" }),
    ]),
  );
});

test("when the person doesn't allow it, the tool keeps waiting and the agent says so", async ({ page }) => {
  await send(page);
  const question = page.getByRole("group", { name: "The agent asks" });
  await question.getByRole("button", { name: "Don't allow" }).click();
  await expect(panel(page)).toContainText("Agent: Stopped: The app refused approve");
  expect(await entries(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ component: "kind-tool", label: "delete_branch", status: "awaiting-input" }),
    ]),
  );
});

test("the panel is off limits to agents, and Reset puts the screen back", async ({ page }) => {
  await send(page);
  await page
    .getByRole("group", { name: "The agent asks" })
    .getByRole("button", { name: "Allow", exact: true })
    .click();
  await expect(panel(page)).toContainText("Agent: Done");
  expect((await entries(page)).map((entry) => entry.label)).not.toContain("Reset");

  await panel(page).getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("button", { name: /^Model, Claude Sonnet 5\.5, Medium effort/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  await expect(panel(page).locator("[data-line]")).toHaveCount(0);
});
