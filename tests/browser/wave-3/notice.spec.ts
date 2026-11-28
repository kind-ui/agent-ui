import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";
import { watchAnimations } from "../leaving.js";

type Fixture = {
  kindHost: {
    dismisses: string[];
    reject: boolean;
    add(): void;
    remove(): void;
    escalate(): void;
    edit(): void;
  };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const notice = (page: Page, name: string) => page.getByRole("note", { name });
const dismissButton = (page: Page, name: string) =>
  notice(page, name).getByRole("button", { name: "Dismiss" });
const dismisses = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.dismisses);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const host = (page: Page, method: "add" | "remove" | "escalate" | "edit") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), method);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
const afterFrames = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
  await page.goto(`/?c=notice&case=${name}`);
  await expect(notice(page, "Indexing your files")).toBeVisible();
};

test("each variant shows its mark, named for the variant, beside its title and text", async ({ page }) => {
  await open(page);
  for (const [name, variant, mark, text] of [
    ["Indexing your files", "Info", "info", "Answers may miss files"],
    ["Connected to GitHub", "Success", "complete", "can read your repositories"],
    ["Rate limited", "Warning", "warning", "slower for the next few minutes"],
    ["Couldn't reach the model", "Error", "error", "Check your connection"],
  ] as const) {
    const icon = notice(page, name).getByRole("img", { name: variant });
    await expect(icon).toHaveAttribute("data-status", mark);
    await expect(icon).toBeVisible();
    await expect(notice(page, name)).toContainText(text);
  }
  await expect(dismissButton(page, "Indexing your files")).toHaveCount(0);
  await expect(dismissButton(page, "Rate limited")).toBeVisible();
});

test("a notice on the page as it loads isn't announced; one added later is, once, and so is a new variant", async ({
  page,
}) => {
  await open(page);
  await afterFrames(page);
  await host(page, "edit");
  await afterFrames(page);
  expect(await announced(page)).toEqual([]);
  const top = await page.locator("#above").evaluate((el) => el.getBoundingClientRect().top);
  const entrance = await watchAnimations(page, "#notice-added");
  await host(page, "add");
  expect(await entrance()).toEqual(expect.arrayContaining(["opacity", "transform"]));
  await expect(notice(page, "Saved")).toBeVisible();
  await expect.poll(() => announced(page)).toEqual(["Saved"]);
  await host(page, "escalate");
  await expect.poll(() => announced(page)).toEqual(["Saved", "Indexing your files"]);
  expect(await page.locator("#above").evaluate((el) => el.getBoundingClientRect().top)).toBe(top);
});

test("Dismiss moves focus to the next control, fades the notice out, then calls the host once", async ({
  page,
}) => {
  await open(page);
  // Records the notice's opacity as the host is asked to remove it, which a later round trip would read too late.
  await page.evaluate(() => {
    const { dismisses } = (window as unknown as Fixture).kindHost;
    const push = dismisses.push.bind(dismisses);
    dismisses.push = (...ids) => {
      Object.assign(window, {
        kindOpacity: getComputedStyle(document.getElementById("notice-warning") as HTMLElement).opacity,
      });
      return push(...ids);
    };
  });
  await dismissButton(page, "Rate limited").focus();
  const exit = await watchAnimations(page, "#notice-warning");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Retry" })).toBeFocused();
  expect(await exit()).toEqual(["opacity"]);
  await expect.poll(() => dismisses(page)).toEqual(["warning"]);
  expect(await page.evaluate(() => (window as unknown as { kindOpacity: string }).kindOpacity)).toBe("0");
  await expect(notice(page, "Rate limited")).toHaveCount(0);
});

test("Dismiss on the last notice moves focus on to the next control after it", async ({ page }) => {
  await open(page);
  await dismissButton(page, "Couldn't reach the model").click();
  await expect(page.locator("#below")).toBeFocused();
  await expect.poll(() => dismisses(page)).toEqual(["error"]);
});

test("Dismiss skips a link without href, which takes no focus", async ({ page }) => {
  await open(page);
  await page
    .locator("#notice-warning")
    .evaluate((el) => el.after(Object.assign(document.createElement("a"), { textContent: "Anchor" })));
  await dismissButton(page, "Rate limited").press("Enter");
  await expect(page.getByRole("button", { name: "Retry" })).toBeFocused();
});

test("a notice the host removes during its exit doesn't call onDismiss", async ({ page }) => {
  await open(page);
  await dismissButton(page, "Couldn't reach the model").click();
  await host(page, "remove");
  await settled(page);
  await afterFrames(page);
  expect(await dismisses(page)).toEqual([]);
});

test("Dismiss stays after buttons added to a connected notice", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "the element adds Dismiss itself");
  await open(page);
  await page.locator("#notice-warning").evaluate((el) => {
    const actions = document.createElement("kind-notice-actions");
    actions.append(Object.assign(document.createElement("button"), { textContent: "Details" }));
    el.append(actions);
  });
  await expect
    .poll(() =>
      page
        .locator("#notice-warning")
        .evaluate((el) => [...el.children].map((child) => child.localName).at(-1)),
    )
    .toBe("kind-notice-dismiss");
});

test("a notice put back on the page neither comes in nor is announced again", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "React puts back a new element, which is a new notice");
  await open(page);
  await afterFrames(page);
  const entrance = await watchAnimations(page, "#notice-warning");
  await page.locator("#notice-warning").evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    const next = el.nextSibling;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.insertBefore(el, next);
  });
  expect(await entrance()).toEqual([]);
  expect(await announced(page)).toEqual([]);
});

test("Dismiss moves focus to focusFallback when given", async ({ page }) => {
  await open(page, "fallback");
  await dismissButton(page, "Rate limited").press("Enter");
  await expect(page.locator("#above")).toBeFocused();
});

test("a host that rejects the dismiss gets the notice back", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    (window as unknown as Fixture).kindHost.reject = true;
  });
  await dismissButton(page, "Rate limited").click();
  await expect.poll(() => dismisses(page)).toEqual(["warning"]);
  await settled(page);
  await expect(notice(page, "Rate limited")).toHaveCSS("opacity", "1");
  await expect(notice(page, "Rate limited")).not.toHaveAttribute("inert");
  await expectAgentActions(page, "Rate limited", ["dismiss"]);
});

test("with reduced motion a new notice only fades in", async ({ page }) => {
  await open(page, "reduced");
  await afterFrames(page);
  const entrance = await watchAnimations(page, "#notice-added");
  await host(page, "add");
  expect(await entrance()).toEqual(["opacity"]);
});

test("agents dismiss a notice that offers it, once", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Indexing your files", []);
  await expectAgentActions(page, "Rate limited", ["dismiss"]);
  const result = await page.evaluate(() =>
    (window as unknown as Fixture).agent
      .act({ steps: [{ ref: "Rate limited", action: "dismiss", args: [] }] })
      .then(JSON.stringify, (error: Error) => error.message),
  );
  expect(result).toContain('"ok":true');
  await expect.poll(() => dismisses(page)).toEqual(["warning"]);
});

test("in forced colors each mark keeps its glyph in system colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  for (const name of ["Info", "Success", "Warning", "Error"]) {
    const glyph = await page
      .getByRole("img", { name })
      .evaluate((el) => getComputedStyle(el, "::after").backgroundColor);
    expect(glyph).not.toBe("rgba(0, 0, 0, 0)");
    expect(glyph).not.toBe(
      await page.getByRole("img", { name }).evaluate((el) => getComputedStyle(el).backgroundColor),
    );
  }
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("the limit recipe: a reset line, ways out, and no Dismiss at the limit", async ({ page }) => {
  await page.goto("/?c=notice&case=quota");
  await expect(notice(page, "12 requests left")).toBeVisible();
  const reset = (name: string) => notice(page, name).locator('[data-notice-part="reset"]');
  await expect(reset("12 requests left")).toHaveText(/^Resets [A-Z][a-z]{2} \d+\.$/);
  await expect(dismissButton(page, "12 requests left")).toBeVisible();
  await expect(reset("You've reached your weekly limit")).toHaveText(
    /^Resets [A-Z][a-z]+day at \d+:\d\d [AP]M\.$/,
  );
  await expect(dismissButton(page, "You've reached your weekly limit")).toHaveCount(0);
  await expect(notice(page, "You've reached your weekly limit").getByRole("button")).toHaveText([
    "Continue at reset",
    "Switch to Claude Haiku 5.5",
    "Use credits",
  ]);
  await expect(reset("You've reached your 5-hour limit")).toHaveText(
    /^You can send messages again in (41|42) min\.$/,
  );
  await expect(dismissButton(page, "You've reached your 5-hour limit")).toHaveCount(0);
  await expect(dismissButton(page, "Now using credits")).toBeVisible();
  expect((await new AxeBuilder({ page }).include('[data-notice-part="root"]').analyze()).violations).toEqual(
    [],
  );
});
