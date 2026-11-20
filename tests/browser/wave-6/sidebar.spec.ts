import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = { kindHost: { changes: { open: boolean; reason: string; source?: string }[] } };

const wide = { width: 1280, height: 800 };
const narrow = { width: 390, height: 844 };

const panel = (page: Page, name = "Chats") => page.getByRole("complementary", { name });
const handle = (page: Page, name = "Chats") => page.getByRole("separator", { name: `Resize ${name}` });
const trigger = (page: Page, name = "Chats") =>
  page.getByRole("button", { name: new RegExp(`^(Hide|Show) ${name}$`) });
const reasons = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.changes.map(({ open, reason }) => `${open} ${reason}`),
  );
const panelWidth = (page: Page) =>
  page.locator('[data-sidebar-part="panel"]').evaluate((el) => el.getBoundingClientRect().width);
// The slide ends before the next press, so each press starts from a settled panel.
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-animating], [data-starting-style], [data-ending-style]") &&
      document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const load = async (page: Page, name = "all", label = "Chats") => {
  await page.goto(`/?c=sidebar&case=${name}`);
  await expect(trigger(page, label)).toBeVisible();
};

test.describe("beside the page", () => {
  test.use({ viewport: wide });

  test("the trigger, Enter on the handle and the shortcut agree on open", async ({ page }) => {
    await load(page);
    const aside = page.locator('[data-sidebar-part="panel"]');
    await expect(panel(page)).toBeVisible();
    await expect(trigger(page)).toHaveAccessibleName("Hide Chats");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toHaveAttribute("aria-controls", (await aside.getAttribute("id")) ?? "");
    await expect(trigger(page)).toHaveAttribute("aria-keyshortcuts", /^(Control|Meta)\+B$/);
    await page.evaluate(() => {
      const runs: string[] = [];
      document.addEventListener("transitionrun", (event) => {
        if (event.propertyName === "translate") runs.push(event.propertyName);
      });
      Object.assign(window, { runs });
    });
    const runs = () => page.evaluate(() => (window as unknown as { runs: string[] }).runs.length);

    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(aside).not.toHaveAttribute("data-open");
    await settled(page);
    // Only the trigger and the shortcut slide the panel.
    expect(await runs()).toBeGreaterThan(0);
    const before = await runs();

    await handle(page).focus();
    await page.keyboard.press("Enter");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(aside).toHaveAttribute("data-open", "");
    await settled(page);
    expect(await runs()).toBe(before);

    await page.keyboard.press("ControlOrMeta+b");
    await expect(trigger(page)).toHaveAccessibleName("Show Chats");
    await expect(aside).not.toHaveAttribute("data-open");
    await expect(panel(page)).toBeHidden();
    expect(await reasons(page)).toEqual(["false trigger-press", "true handle", "false shortcut"]);
  });

  test("a slide moves the panel and sets the page's width once", async ({ page }) => {
    await load(page);
    const widths = async (press: () => Promise<void>) => {
      await page.evaluate(() => {
        const seen = new Set<number>();
        const inset = document.querySelector('[data-sidebar-part="inset"]') as HTMLElement;
        const read = () => {
          seen.add(Math.round(inset.getBoundingClientRect().width));
          if (document.querySelector("[data-animating]") || seen.size === 1) requestAnimationFrame(read);
        };
        Object.assign(window, { seen });
        requestAnimationFrame(read);
      });
      await press();
      await settled(page);
      return page.evaluate(() => (window as unknown as { seen: Set<number> }).seen.size);
    };
    expect(await widths(() => trigger(page).click())).toBe(2);
    expect(await widths(() => trigger(page).click())).toBe(2);
  });

  test("the handle resizes within bounds, which hold as the window shrinks", async ({ page }) => {
    await load(page);
    // Percentages of the sidebar: 280px of 1280px, up to 420px.
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "22");
    await expect(handle(page)).toHaveAttribute("aria-valuemax", "33");
    await handle(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "23");
    for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "33");
    expect(await panelWidth(page)).toBeLessThanOrEqual(420.5);
    for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowLeft");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "18");
    expect(await panelWidth(page)).toBeGreaterThanOrEqual(220);
    // 18% of a narrower window would be under 220px.
    await page.setViewportSize({ width: 900, height: 800 });
    await expect.poll(() => panelWidth(page)).toBeGreaterThanOrEqual(219.5);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    expect(await reasons(page)).toEqual([]);
  });

  test("a saved width comes back on reload", async ({ page, context }) => {
    await context.clearCookies();
    await load(page, "saved");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "22");
    await handle(page).focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowLeft");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "19");
    await page.reload();
    // Read in the first frame the handle is in the page, before anything could move it.
    const first = await page.evaluate(
      () =>
        new Promise<string | null>((resolve) => {
          const read = () => {
            const el = document.querySelector('[role="separator"]');
            if (el?.hasAttribute("aria-valuenow")) resolve(el.getAttribute("aria-valuenow"));
            else requestAnimationFrame(read);
          };
          read();
        }),
    );
    expect(first).toBe("19");
    await expect(handle(page)).toHaveAttribute("aria-valuenow", "19");
  });

  test("the end panel keeps its draft across collapse and restore", async ({ page }) => {
    await load(page, "end", "Assistant");
    await expect(page.locator('[data-sidebar-part="panel"]')).toHaveAttribute("data-side", "end");
    const prompt = page.getByRole("textbox", { name: "Prompt" });
    await prompt.click();
    await page.keyboard.type("Summarize the page");
    await trigger(page, "Assistant").click();
    await expect(panel(page, "Assistant")).toBeHidden();
    await settled(page);
    await trigger(page, "Assistant").click();
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveText("Summarize the page");
  });

  test("an agent closes an open sidebar", async ({ page }) => {
    await load(page);
    // The bridge adds its generic `press` for the trigger.
    await expectAgentActions(page, "Chats", ["close", "press"]);
    await page.evaluate(() =>
      (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
        steps: [{ ref: "Chats", action: "close" }],
      }),
    );
    await expect(trigger(page)).toHaveAccessibleName("Show Chats");
    await expectAgentActions(page, "Chats", ["open", "press"]);
    expect(
      await page.evaluate(() => (window as unknown as Fixture).kindHost.changes.map(({ source }) => source)),
    ).toEqual(["agent"]);
    expect(await reasons(page)).toEqual(["false imperative"]);
  });
});

test.describe("on a narrow screen", () => {
  test.use({ viewport: narrow, hasTouch: true });

  for (const [name, label, edge] of [
    ["all", "Chats", "left"],
    ["end", "Assistant", "right"],
  ] as const)
    test(`the trigger opens a modal drawer from the ${edge}, ${name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await load(page, name, label);
      const drawer = page.getByRole("dialog", { name: label });
      await expect(trigger(page, label)).toHaveAttribute("aria-expanded", "false");
      await expect(drawer).toBeHidden();
      await expect(handle(page, label)).toHaveCount(0);
      await trigger(page, label).click();
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveAttribute("aria-modal", "true");
      await settled(page);
      const box = await drawer.boundingBox();
      if (edge === "left") expect(box?.x).toBe(0);
      else expect((box?.x ?? 0) + (box?.width ?? 0)).toBe(narrow.width);
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(trigger(page, label)).toBeFocused();
      // A sidebar that binds under the breakpoint starts closed without a change.
      expect(await reasons(page)).toEqual(["true trigger-press", "false escape-key"]);

      // Widening gives the panel back beside the page, open as it started.
      await page.setViewportSize(wide);
      await expect(panel(page, label)).toBeVisible();
      await expect(handle(page, label)).toBeVisible();
      await expect(trigger(page, label)).toHaveAttribute("aria-expanded", "true");
      expect(await reasons(page)).toEqual(["true trigger-press", "false escape-key", "true breakpoint"]);
      expect(errors).toEqual([]);
    });
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes with the panel open and the drawer open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize(wide);
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await expect(panel(page)).toBeVisible();
    await settled(page);
    // `region` (best practice) refuses the handle, which sits between the panel and the page's landmarks.
    expect((await new AxeBuilder({ page }).disableRules(["region"]).analyze()).violations).toEqual([]);

    await page.setViewportSize(narrow);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await trigger(page).click();
    await expect(page.getByRole("dialog", { name: "Chats" })).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await reasons(page)).toEqual(["false breakpoint", "true trigger-press"]);
  });
