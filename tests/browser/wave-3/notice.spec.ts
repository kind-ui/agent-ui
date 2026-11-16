import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = {
  kindHost: {
    dismisses: string[];
    reject: boolean;
    add(): void;
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
const host = (page: Page, method: "add" | "escalate" | "edit") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), method);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
const afterFrames = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
// The properties of every animation running on the notice, read before it finishes.
const animated = (page: Page, name: string) =>
  notice(page, name).evaluate((el) => [
    ...new Set(
      el
        .getAnimations()
        .flatMap((animation) =>
          (animation.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame)),
        )
        .filter((key) => !["offset", "easing", "composite", "computedOffset"].includes(key)),
    ),
  ]);

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
  await host(page, "add");
  await expect(notice(page, "Saved")).toBeVisible();
  expect(await animated(page, "Saved")).toEqual(expect.arrayContaining(["opacity", "transform"]));
  await expect.poll(() => announced(page)).toEqual(["Saved"]);
  await host(page, "escalate");
  await expect.poll(() => announced(page)).toEqual(["Saved", "Indexing your files"]);
  expect(await page.locator("#above").evaluate((el) => el.getBoundingClientRect().top)).toBe(top);
});

test("Dismiss moves focus to the next control, fades the notice out, then calls the host once", async ({
  page,
}) => {
  await open(page);
  await dismissButton(page, "Rate limited").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Retry" })).toBeFocused();
  expect(await dismisses(page)).toEqual([]);
  expect(await animated(page, "Rate limited")).toEqual(["opacity"]);
  await expect.poll(() => dismisses(page)).toEqual(["warning"]);
  await expect(notice(page, "Rate limited")).toHaveCount(0);
});

test("Dismiss on the last notice moves focus on to the next control after it", async ({ page }) => {
  await open(page);
  await dismissButton(page, "Couldn't reach the model").click();
  await expect(page.locator("#below")).toBeFocused();
  await expect.poll(() => dismisses(page)).toEqual(["error"]);
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
  await host(page, "add");
  expect(await animated(page, "Saved")).toEqual(["opacity"]);
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
