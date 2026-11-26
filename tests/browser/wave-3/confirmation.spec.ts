import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Decision = { choice: string; decision: unknown; source: string; resolve(): void; reject(): void };
type Fixture = {
  kindHost: { decisions: Decision[]; permit: boolean };
  kindApproval: { set(approval: unknown, id?: string): void };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const confirmation = (page: Page, id = "confirm") => page.locator(`#${id}`);
const approve = (page: Page, id = "confirm") =>
  confirmation(page, id).getByRole("button", { name: "Approve" });
const deny = (page: Page, id = "confirm") => confirmation(page, id).getByRole("button", { name: "Deny" });
const part = (page: Page, name: string, id = "confirm") =>
  confirmation(page, id).locator(`[data-slot="kind-confirmation-${name}"]:not([hidden])`);
const decisions = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.decisions.map(({ choice, decision, source }) => ({
      choice,
      decision,
      source,
    })),
  );
const settle = (page: Page, index: number, outcome: "resolve" | "reject") =>
  page.evaluate(([i, o]) => (window as unknown as Fixture).kindHost.decisions[i]?.[o](), [
    index,
    outcome,
  ] as const);
const request = (state: string, generation = 1, decision?: { approved: boolean; reason?: string }) => ({
  approvalId: "a1",
  generation,
  state,
  ...(decision && { decision }),
});
const setApproval = (page: Page, approval: unknown) =>
  page.evaluate((a) => (window as unknown as Fixture).kindApproval.set(a), approval);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, ref: string, action: string, args: unknown[] = []) =>
  page.evaluate(
    ([r, a, i]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: r, action: a, args: i }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [ref, action, args] as const,
  );

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
  await page.goto(`/?c=confirmation&case=${name}`);
  await expect(approve(page)).toBeVisible();
};

test("a group named by its label offers the host's choices", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("group", { name: "Run search_docs?" })).toBeVisible();
  await expect(part(page, "title")).toHaveText("Run search_docs?");
  await expect(deny(page)).toBeVisible();
  await expect(confirmation(page)).toHaveAttribute("data-agent-confirm", /.+/);
  await expect(approve(page, "approve-only")).toBeVisible();
  await expect(deny(page, "approve-only")).toHaveCount(0);
  await expect(confirmation(page, "auto").getByRole("button")).toHaveCount(0);
  await expect(part(page, "outcome", "auto")).toHaveText("Approved automatically");
});

test("Approve then Deny within one task calls the host once", async ({ page }) => {
  await open(page);
  await confirmation(page).evaluate((root) => {
    for (const name of ["approve", "deny"])
      root
        .querySelector<HTMLElement>(
          `button[data-slot="kind-confirmation-${name}"], [data-slot="kind-confirmation-${name}"] button`,
        )
        ?.click();
  });
  await expect(approve(page)).toHaveAttribute("aria-disabled", "true");
  await expect(deny(page)).toHaveAttribute("aria-disabled", "true");
  await expect(approve(page)).toHaveAttribute("data-pending", "");
  expect(await decisions(page)).toMatchObject([
    { choice: "approve", decision: { approvalId: "a1", generation: 1 } },
  ]);
});

for (const late of ["reject", "resolve"] as const) {
  test(`a replaced generation is enabled with no error after the old one's late ${late}`, async ({
    page,
  }) => {
    await open(page);
    await approve(page).click();
    await setApproval(page, request("requested", 2));
    await settle(page, 0, late);
    await expect(approve(page)).not.toHaveAttribute("aria-disabled");
    await expect(deny(page)).not.toHaveAttribute("aria-disabled");
    await expect(part(page, "error")).toHaveCount(0);
    await deny(page).click();
    expect((await decisions(page))[1]?.decision).toEqual({ approvalId: "a1", generation: 2 });
  });
}

test("submit-failed enables both choices and announces once", async ({ page }) => {
  await open(page);
  await approve(page).click();
  await setApproval(page, request("submitting"));
  await expect(deny(page)).toHaveAttribute("aria-disabled", "true");
  await settle(page, 0, "resolve");
  await expect(part(page, "outcome")).toHaveText("Sending decision");
  await setApproval(page, request("submit-failed"));
  await expect(approve(page)).not.toHaveAttribute("aria-disabled");
  await expect(deny(page)).not.toHaveAttribute("aria-disabled");
  await expect(part(page, "error")).toHaveText("Decision not sent. Try again.");
  await expect.poll(() => announced(page)).toEqual(["Decision not sent"]);
});

test("deciding moves nothing above or below, and the outcome stays", async ({ page }) => {
  await open(page);
  const boxes = () =>
    page.evaluate(() =>
      ["above", "below"].map((id) => document.getElementById(id)?.getBoundingClientRect().toJSON()),
    );
  const before = await boxes();
  await approve(page).click();
  await setApproval(page, request("submitting"));
  await settle(page, 0, "resolve");
  await expect(part(page, "outcome")).toBeVisible();
  expect(await boxes()).toEqual(before);
  await setApproval(page, request("responded", 1, { approved: true }));
  await expect(part(page, "outcome")).toHaveText("Approved");
  await expect(part(page, "title")).toHaveText("Run search_docs?");
  await expect(confirmation(page).getByRole("button")).toHaveCount(0);
  expect(await boxes()).toEqual(before);
  await expect.poll(() => announced(page)).toEqual(["Approved"]);
});

test("when the choices leave with focus, focus moves to the outcome", async ({ page }) => {
  await open(page);
  await approve(page).focus();
  await page.keyboard.press("Enter");
  await setApproval(page, request("responded", 1, { approved: true }));
  await expect(part(page, "outcome")).toBeFocused();
});

test("an agent's deny needs a person, then sends its reason without opening the box", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Run search_docs?", ["approve", "deny"]);
  expect(await act(page, "Delete notes.md?", "deny", ["Too broad"])).toContain("The person said no");
  expect(await decisions(page)).toEqual([]);
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.permit = true;
  });
  expect(await act(page, "Delete notes.md?", "deny", ["Too broad"])).toContain('"ok":true');
  expect(await decisions(page)).toEqual([
    { choice: "deny", decision: { approvalId: "a1", generation: 1, reason: "Too broad" }, source: "agent" },
  ]);
  await expect(confirmation(page, "reason").getByRole("textbox")).toHaveCount(0);
});

test("with reason, Deny opens the box and calls nothing, then sends what the person typed", async ({
  page,
}) => {
  await open(page);
  await expect(confirmation(page, "reason").getByRole("textbox")).toHaveCount(0);
  await deny(page, "reason").click();
  const box = confirmation(page, "reason").getByRole("textbox", { name: "Reason for denying" });
  await expect(box).toBeFocused();
  await expect(approve(page, "reason")).toHaveCount(0);
  expect(await decisions(page)).toEqual([]);
  await box.fill("  Wrong file ");
  await deny(page, "reason").click();
  expect((await decisions(page))[0]?.decision).toEqual({
    approvalId: "a1",
    generation: 1,
    reason: "Wrong file",
  });
});

test("Cancel closes the reason box and returns focus to Deny", async ({ page }) => {
  await open(page);
  await deny(page, "reason").focus();
  await page.keyboard.press("Enter");
  await expect(confirmation(page, "reason").getByRole("textbox")).toBeFocused();
  await confirmation(page, "reason").getByRole("button", { name: "Cancel" }).click();
  await expect(confirmation(page, "reason").getByRole("textbox")).toHaveCount(0);
  await expect(confirmation(page, "reason").getByRole("button", { name: "Cancel" })).toHaveCount(0);
  await expect(approve(page, "reason")).toBeVisible();
  await expect(deny(page, "reason")).toBeFocused();
  expect(await decisions(page)).toEqual([]);
});

test("the reason box collapses once the decision is recorded, and the outcome keeps the reason", async ({
  page,
}) => {
  await open(page);
  await deny(page, "reason").click();
  await confirmation(page, "reason").getByRole("textbox").fill("Wrong file");
  await deny(page, "reason").click();
  await page.evaluate(() => (window as unknown as Fixture).kindHost.decisions[0]?.resolve());
  await page.evaluate(() =>
    (window as unknown as Fixture).kindApproval.set(
      {
        approvalId: "a1",
        generation: 1,
        state: "responded",
        decision: { approved: false, reason: "Wrong file" },
      },
      "reason",
    ),
  );
  await expect(part(page, "outcome", "reason")).toContainText("Denied");
  await expect(part(page, "outcome", "reason")).toContainText("Wrong file");
  await expect(confirmation(page, "reason").getByRole("textbox")).toHaveCount(0);
});

test("with reduced motion the swap only fades", async ({ page }) => {
  // Records the properties each animation of an outcome moves.
  await page.addInitScript(() => {
    const moved: string[] = [];
    Object.assign(window, { kindMoved: moved });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this.matches('[data-slot="kind-confirmation-outcome"]') && keyframes)
        for (const frame of Array.isArray(keyframes) ? keyframes : [keyframes])
          moved.push(...Object.keys(frame).filter((key) => !["offset", "easing", "composite"].includes(key)));
      return animate.call(this, keyframes, options);
    };
  });
  await open(page, "reduced");
  await approve(page).click();
  await setApproval(page, request("submitting"));
  await settle(page, 0, "resolve");
  await expect(part(page, "outcome")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => [...new Set((window as unknown as { kindMoved: string[] }).kindMoved)]))
    .toEqual(["opacity"]);
});

const choiceNames = (page: Page, id: string) =>
  confirmation(page, id)
    .locator('[data-slot="kind-confirmation-choices"] [data-kind-button]:visible')
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label") ?? button.textContent),
    );

test("Deny comes first and Approve, the primary, last; Always allow names what and where", async ({
  page,
}) => {
  await open(page);
  expect(await choiceNames(page, "confirm")).toEqual(["Deny", "Approve"]);
  expect(await choiceNames(page, "always")).toEqual([
    "Deny",
    "Always allow search_docs in this project",
    "Approve",
  ]);
  await expect(approve(page, "always")).toHaveAttribute("data-kind-button", "primary");
  await expect(confirmation(page, "always").locator("code").first()).toHaveText("search_docs");
  await expect(part(page, "detail", "always")).toHaveText(
    "Covers search_docs in this project. You can change it in Settings.",
  );
  await expectAgentActions(page, "Allow search_docs?", ["approve", "alwaysAllow", "deny"]);
});

test("Always allow sends always and its scope, and its outcome keeps both", async ({ page }) => {
  await open(page);
  const always = confirmation(page, "always").getByRole("button", { name: /^Always allow/ });
  await always.focus();
  await page.keyboard.press("Enter");
  await expect(part(page, "meta", "always")).toHaveText("Sending decision");
  await expect(always).toHaveAttribute("data-pending", "");
  expect(await decisions(page)).toEqual([
    {
      choice: "always",
      decision: { approvalId: "always", generation: 1, always: true, scope: "in this project" },
      source: "keyboard",
    },
  ]);
  await expect(part(page, "outcome", "always-allowed")).toHaveText(
    "Always allowed search_docs in this project",
  );
});

test("a danger request warns in words, has a danger Approve and no Always allow", async ({ page }) => {
  await open(page);
  await expect(part(page, "risk", "danger")).toHaveText("Changes how releases publish.");
  await expect(approve(page, "danger")).toHaveAttribute("data-kind-button", "danger");
  expect(await choiceNames(page, "danger")).toEqual(["Deny", "Approve"]);
});

test("a deadline reads in minutes, and past it Expired, with the choices kept", async ({ page }) => {
  await open(page);
  await expect(part(page, "meta", "deadline")).toHaveText("Decide in 4 min");
  await expect(part(page, "meta", "late")).toHaveText("Expired");
  await expect(approve(page, "late")).toBeVisible();
});

test("each outcome has its words and its mark", async ({ page }) => {
  await open(page);
  for (const [id, text, mark] of [
    ["always-allowed", "Always allowed search_docs in this project", "complete"],
    ["denied", "Denied: use the cached results instead", "denied"],
    ["expired", "Expired before a decision", "expired"],
    ["cancelled", "Cancelled before a decision", "cancelled"],
  ] as const) {
    await expect(part(page, "outcome", id)).toHaveText(text);
    await expect(part(page, "outcome-icon", id)).toHaveAttribute("data-status", mark);
  }
});

test("Always allow takes its own row above Deny and Approve only when the three don't fit", async ({
  page,
}) => {
  await open(page);
  const tops = () =>
    confirmation(page, "always")
      .locator('[data-slot="kind-confirmation-choices"] [data-kind-button]:visible')
      .evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().top)));
  const [deny, always, approve] = await tops();
  expect(new Set([deny, always, approve]).size).toBe(1);
  await page.setViewportSize({ width: 340, height: 900 });
  await expect(part(page, "choices", "always")).toHaveAttribute("data-stacked", "");
  const [deny2, always2, approve2] = await tops();
  expect(always2).toBeLessThan(deny2 as number);
  expect(deny2).toBe(approve2);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
