import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { shareLink } from "../../../packages/agent-ui/tests/fixtures/shared/share-dialog.js";
import { expectAgentActions } from "../agent-snapshot.js";
import { allowClipboard, readClipboard } from "../clipboard.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: {
    calls: { action: string; reason: string; source?: string }[];
    copies: { link: string; reason: string }[];
    visibilities: { value: string; reason: string; source?: string }[];
    resolve(): void;
    reject(): void;
  };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const trigger = (page: Page) => page.locator("#share").getByRole("button", { name: "Share", exact: true });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Share chat" });
const button = (page: Page, name: string) => dialog(page).getByRole("button", { name, exact: true });
const anyone = (page: Page) => dialog(page).getByRole("radio", { name: "Anyone with the link" });
const linkBox = (page: Page) => dialog(page).getByRole("textbox", { name: "Link" });
const host = <Key extends keyof Fixture["kindHost"]>(page: Page, key: Key) =>
  page.evaluate((name) => {
    const value = (window as unknown as Fixture).kindHost[name];
    return typeof value === "function" ? void value() : value;
  }, key);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string, ...args: unknown[]) =>
  page.evaluate(
    ([action, args]) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Share", action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    [action, args] as const,
  );
const settled = (page: Page) =>
  page.waitForFunction(
    () =>
      !document.querySelector("[data-starting-style]") &&
      document
        .getAnimations()
        .every(
          (animation) =>
            !(animation.timeline instanceof DocumentTimeline) || animation.playState !== "running",
        ),
  );

const load = async (page: Page, name = "all") => {
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
  await page.goto(`/?c=share-dialog&case=${name}`);
  await expect(trigger(page)).toBeVisible();
};

const openForLink = async (page: Page) => {
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await anyone(page).click();
  await expect(button(page, "Create link")).toBeVisible();
};

test("closed, it offers agents only open, and its root asks for a person", async ({ page }) => {
  await load(page);
  await expect(page.locator("#share")).toHaveAttribute("data-agent-confirm", /.+/);
  // UI SDK's bridge offers its generic `press` to every component that opens.
  await expectAgentActions(page, "Share", ["open", "press"]);
});

test("the keyboard opens the dialog, chooses who can open the chat, and Escape returns focus", async ({
  page,
}) => {
  await load(page);
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect.poll(() => dialog(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expect(dialog(page)).toContainText("Share a link to let others open this chat.");
  await expect(button(page, "Create link")).toHaveCount(0);
  await anyone(page).focus();
  await page.keyboard.press("Space");
  await expect(anyone(page)).toBeChecked();
  await expect(button(page, "Create link")).toBeVisible();
  await expect(dialog(page)).toContainText("The link shows this chat up to now.");
  expect(await host(page, "visibilities")).toMatchObject([{ value: "link", reason: "input-change" }]);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("Create link stays pending until the host makes the link, then shows it", async ({ page }) => {
  await load(page);
  await openForLink(page);
  // Measured once the dialog has finished scaling in.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
  const before = await button(page, "Create link").boundingBox();
  await button(page, "Create link").click();
  // A pending button keeps full opacity and its place, and says what it's doing beside a running mark.
  const create = button(page, "Creating link");
  await expect(create).toHaveAttribute("aria-disabled", "true");
  await expect(create).toHaveAttribute("data-pending", "");
  await expect(create).toHaveCSS("opacity", "1");
  await expect(create.locator('[data-status-mark][data-status="running"]')).toHaveCount(1);
  expect(await create.boundingBox()).toEqual(before);
  // `aria-disabled` keeps it focusable, so a second press reaches it and calls nothing.
  await create.click({ force: true });
  expect(await host(page, "calls")).toEqual([{ action: "create", reason: "create-press", source: "mouse" }]);
  await host(page, "resolve");
  await expect(linkBox(page)).toHaveValue(shareLink);
  await expect(linkBox(page)).not.toBeEditable();
  await expect(button(page, "Copy link")).toBeVisible();
  await expect(button(page, "Create link")).toHaveCount(0);
  await expect(button(page, "Stop sharing")).not.toHaveAttribute("aria-disabled");
});

test("Copy link writes the link to the clipboard and says so", async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await load(page, "linked");
  await trigger(page).click();
  await button(page, "Copy link").click();
  await expect(button(page, "Copied")).toBeVisible();
  expect(await readClipboard(page, browserName)).toBe(shareLink);
  expect(await host(page, "copies")).toEqual([{ link: shareLink, reason: "copy-press" }]);
  await expect.poll(() => announced(page)).toContain("Copied");
});

test("a create that fails shows and announces why, and Create link works again", async ({ page }) => {
  await load(page);
  await openForLink(page);
  await button(page, "Create link").click();
  await host(page, "reject");
  const error = dialog(page).getByText("Couldn't create a link");
  await expect(error).toBeVisible();
  await expect.poll(() => announced(page)).toContain("Couldn't create a link");
  const create = button(page, "Create link");
  await expect(create).not.toHaveAttribute("aria-disabled");
  await create.click();
  await expect(error).toBeHidden();
  await host(page, "resolve");
  await expect(linkBox(page)).toHaveValue(shareLink);
  expect(await host(page, "calls")).toHaveLength(2);
});

test("Stop sharing calls the host, which clears the link and makes the chat private", async ({ page }) => {
  await load(page, "linked");
  await trigger(page).click();
  await button(page, "Stop sharing").click();
  expect(await host(page, "calls")).toEqual([{ action: "revoke", reason: "revoke-press", source: "mouse" }]);
  await host(page, "resolve");
  await expect(linkBox(page)).toHaveCount(0);
  await expect(button(page, "Stop sharing")).toHaveCount(0);
  await expect(dialog(page)).toContainText("Share a link to let others open this chat.");
  await expect(dialog(page).getByRole("radio", { name: "Only you" })).toBeChecked();
});

test("an agent's createLink needs a person while agentConfirm is on", async ({ page }) => {
  await load(page);
  await openForLink(page);
  await expectAgentActions(page, "Share", ["close", "setVisibility", "createLink", "press"]);
  expect(await act(page, "createLink")).toContain("Needs a person");
  expect(await host(page, "calls")).toEqual([]);
});

test("with agentConfirm off an agent shares the chat, and an unknown visibility is refused", async ({
  page,
}) => {
  await load(page, "unconfirmed");
  await expect(page.locator("#share")).not.toHaveAttribute("data-agent-confirm");
  expect(await act(page, "open")).toContain('"ok":true');
  await expect(dialog(page)).toBeVisible();
  await expectAgentActions(page, "Share", ["close", "setVisibility", "press"]);
  expect(await act(page, "setVisibility", "bogus")).toContain("error");
  expect(await act(page, "setVisibility", "link")).toContain('"ok":true');
  await expect(anyone(page)).toBeChecked();
  expect(await act(page, "createLink")).toContain('"ok":true');
  expect(await host(page, "calls")).toEqual([{ action: "create", reason: "imperative", source: "agent" }]);
  await host(page, "resolve");
  await expect(linkBox(page)).toHaveValue(shareLink);
  await expectAgentActions(page, "Share", ["close", "setVisibility", "copyLink", "revoke", "press"]);
});

test("a visibility the owner refuses is written back", async ({ page }) => {
  await load(page, "refusing");
  await trigger(page).click();
  await anyone(page).click();
  expect(await host(page, "visibilities")).toMatchObject([{ value: "link" }]);
  await expect(dialog(page).getByRole("radio", { name: "Only you" })).toBeChecked();
  await expect(dialog(page)).toContainText("Share a link to let others open this chat.");
  await expect(button(page, "Create link")).toHaveCount(0);
});

for (const [name, fixture, reducedMotion] of [
  ["the motion option", "reduced", null],
  ["prefers-reduced-motion", "all", "reduce"],
] as const) {
  test(`with reduced motion through ${name} the dialog only fades`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await load(page, fixture);
    await trigger(page).click();
    await expect(dialog(page)).toBeVisible();
    const transition = await dialog(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(transition).toEqual({ property: "opacity", duration: "0.12s" });
  });
}

test("a trigger someone wrote keeps its icon", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web fills in only empty parts");
  await load(page, "written");
  await expect(trigger(page).locator("svg")).toHaveCount(1);
  await expect(trigger(page)).toHaveText("");
});

test.describe("on a touch screen", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("Share opens the dialog as a bottom sheet", async ({ page }) => {
    await load(page);
    await trigger(page).tap();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAttribute("data-presentation", "sheet");
  });

  test("the sheet fits the screen, with Copy link in full", async ({ page }) => {
    await load(page, "linked");
    await trigger(page).tap();
    await expect(linkBox(page)).toHaveValue(shareLink);
    await settled(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const copy = await button(page, "Copy link").boundingBox();
    expect(copy && copy.x >= 0 && copy.x + copy.width <= 390).toBe(true);
  });
});

for (const colorScheme of ["light", "dark"] as const)
  test(`axe passes with the dialog open and a link shown, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await load(page, "linked");
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await trigger(page).click();
    await expect(linkBox(page)).toHaveValue(shareLink);
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
