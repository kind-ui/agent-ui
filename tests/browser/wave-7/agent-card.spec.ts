import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: { runs: { id: string; reason: string; source: string | undefined }[] };
  agent: { act(input: unknown): Promise<unknown> };
};

const card = (page: Page, id: string) => page.locator(`#${id} [data-agent-card-part="root"]`);
const runs = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.runs);

const open = async (page: Page) => {
  await page.goto("/?c=agent-card&case=all");
  await expect(card(page, "planner").getByRole("heading", { name: "Planner" })).toBeVisible();
};

test("the card is an article named by its heading, at the level it's given", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("article", { name: "Planner" })).toBeVisible();
  await expect(card(page, "planner").getByRole("heading", { level: 3 })).toHaveText("Planner");
  await expect(
    page.getByRole("article", { name: "Code Reviewer" }).getByRole("heading", { level: 2 }),
  ).toHaveText("Code Reviewer");
});

test("an href makes the name a link, and an unsafe one doesn't", async ({ page }) => {
  await open(page);
  await expect(card(page, "planner").getByRole("link", { name: "Planner" })).toHaveAttribute(
    "href",
    "https://example.com/agents/planner",
  );
  await expect(card(page, "reviewer").getByRole("link")).toHaveCount(0);
  await expect(card(page, "minimal").getByRole("link")).toHaveCount(0);
  await expect(card(page, "minimal").getByRole("heading")).toHaveText("Scout");
});

test("the capabilities are a list of badges, and the status reads in words", async ({ page }) => {
  await open(page);
  const list = card(page, "planner").getByRole("list", { name: "Capabilities" });
  await expect(list.getByRole("listitem")).toHaveText(["Planning", "Web search", "Code review"]);
  await expect(list.getByRole("listitem").first()).toHaveAttribute("data-kind-badge", "");
  await expect(card(page, "planner").locator('[data-agent-card-part="status"]')).toHaveText("Working");
  await expect(card(page, "reviewer").locator('[data-agent-card-part="status"]')).toHaveText("Done");
  await expect(card(page, "planner").locator("[data-status-mark]")).toHaveAttribute("data-status", "running");
  await expect(card(page, "planner").locator('[data-agent-card-part="model"]')).toHaveText("GPT-5");
  await expect(card(page, "minimal").locator('[data-agent-card-part="status"]')).toBeHidden();
  await expect(card(page, "minimal").getByRole("list")).toHaveCount(0);
  await expect(card(page, "minimal").locator('[data-agent-card-part="avatar"]')).toHaveText("S");
});

test("the action runs by pointer and by keyboard, and shows only with onAction", async ({ page }) => {
  await open(page);
  const action = card(page, "reviewer").getByRole("button", { name: "Start Code Reviewer" });
  await expect(action).toHaveText("Start");
  await action.click();
  await card(page, "planner").getByRole("button", { name: "Open Planner" }).focus();
  await page.keyboard.press("Enter");
  expect(await runs(page)).toEqual([
    { id: "reviewer", reason: "action-press", source: "mouse" },
    { id: "planner", reason: "action-press", source: "keyboard" },
  ]);
  await expect(card(page, "minimal").getByRole("button")).toHaveCount(0);
});

test("agents run the action, and only where it's offered", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Planner", ["run"]);
  await expectAgentActions(page, "Scout", []);
  await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({ steps: [{ ref: "Planner", action: "run" }] }),
  );
  expect(await runs(page)).toEqual([{ id: "planner", reason: "imperative", source: "agent" }]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
