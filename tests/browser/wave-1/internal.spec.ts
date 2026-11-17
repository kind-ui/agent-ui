import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { layerOf } from "../layer.js";

const rootSlots = {
  button: "button",
  collapsible: "collapsible",
  "scroll-area": "scroll-area",
  toolbar: "toolbar",
  toggle: "toggle",
  menu: "menu-trigger",
  avatar: "avatar",
  "token-input": "token-input-editor",
  "trigger-menu": "trigger-menu-input",
  "file-input": "file-input",
  progress: "progress",
  command: "command",
  slider: "slider",
  switch: "switch",
  "menu-data": "menu-trigger",
};

const open = async (page: Page, name: string) => {
  await page.goto(`/?c=internal&case=${name}`);
  await expect(
    page.locator(`#root [data-slot="${rootSlots[name as keyof typeof rootSlots]}"]`).first(),
  ).toBeAttached();
};

for (const name of Object.keys(rootSlots)) {
  test(`${name}: carries its UI SDK data-slot and has no axe violations`, async ({ page }) => {
    await open(page, name);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("button: Enter and Space press it", async ({ page }) => {
  await open(page, "button");
  const button = page.getByRole("button", { name: "Save" });
  await expect(button).toHaveCSS("border-top-left-radius", "6px");
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.locator("output")).toHaveText("Pressed 2");
});

test("collapsible: Enter toggles aria-expanded", async ({ page }) => {
  await open(page, "collapsible");
  const trigger = page.getByRole("button", { name: "Details" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Hidden details")).toBeVisible();
});

test("toolbar: ArrowRight moves focus to the next item", async ({ page }) => {
  await open(page, "toolbar");
  await page.getByRole("button", { name: "Undo" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Redo" })).toBeFocused();
});

test("toolbar: a Kind part rendered as a toolbar button gets one class list", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "render composition is React only");
  await page.goto("/?c=internal&case=toolbar-menu");
  for (const [name, item] of [
    ["Share", "Copy link"],
    ["Export", "PDF"],
  ]) {
    const trigger = page.getByRole("button", { name });
    const classes = (await trigger.getAttribute("class"))?.split(" ") ?? [];
    expect(classes).toContain("h-7");
    expect(classes).not.toContain("h-8");
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("toggle: Space flips aria-pressed", async ({ page }) => {
  await open(page, "toggle");
  const toggle = page.getByRole("button", { name: "Bold" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveCSS("color", "oklch(1 0 0)");
});

test("menu: ArrowDown moves focus, Escape closes and returns focus", async ({ page }) => {
  await open(page, "menu");
  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  const before = await page.evaluate(() => document.activeElement?.textContent);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent)).not.toBe(before);
  await expect(page.locator(":focus")).toHaveAttribute("role", "menuitem");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("token input: Backspace removes the last token", async ({ page }) => {
  await open(page, "token-input");
  const tokens = page.locator('#root [data-slot="token-input-token"]');
  await expect(tokens).toHaveCount(1);
  await page.getByRole("textbox", { name: "Prompt" }).focus();
  // macOS keeps End for scrolling in Firefox and WebKit; Meta+ArrowRight moves to the end of the line there.
  await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowRight" : "End");
  await page.keyboard.press("Backspace");
  await expect(tokens).toHaveCount(0);
});

test("trigger menu: typing @ opens it, Escape dismisses it", async ({ page }) => {
  await open(page, "trigger-menu");
  await page.getByRole("textbox", { name: "Message" }).focus();
  await page.keyboard.type("@");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("file input: chosen files are listed", async ({ page }) => {
  await open(page, "file-input");
  await page.locator('#root input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hi"),
  });
  await expect(page.locator('#root [data-slot="file-input-item"]')).toContainText("notes.txt");
});

test("progress: exposes its value", async ({ page }) => {
  await open(page, "progress");
  await expect(page.getByRole("progressbar", { name: "Uploading" })).toHaveAttribute("aria-valuenow", "40");
});

test("command: typing filters the list, ArrowDown highlights a command", async ({ page }) => {
  await open(page, "command");
  const items = page.locator('#root [data-slot="command-item"]');
  await page.getByRole("combobox", { name: "Search commands" }).focus();
  await page.keyboard.type("re");
  await expect(items.filter({ hasText: "New file" })).toBeHidden();
  await expect(items.filter({ visible: true })).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expect(items.and(page.locator("[data-highlighted]"))).toHaveCount(1);
});

test("slider: ArrowRight raises the value", async ({ page }) => {
  await open(page, "slider");
  const thumb = page.getByRole("slider", { name: "Volume" });
  await expect(thumb).toHaveValue("40");
  await thumb.focus();
  await page.keyboard.press("ArrowRight");
  await expect(thumb).toHaveValue("41");
});

test("switch: Space toggles aria-checked", async ({ page }) => {
  await open(page, "switch");
  const control = page.getByRole("switch", { name: "Notifications" });
  await expect(control).toHaveAttribute("aria-checked", "false");
  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).toHaveAttribute("aria-checked", "true");
});

test("menu data: Space toggles a checkbox item and keeps the menu open", async ({ page }) => {
  await open(page, "menu-data");
  await page.getByRole("button", { name: "Settings" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  const wrap = page.getByRole("menuitemcheckbox", { name: "Word wrap" });
  await expect(wrap).toBeFocused();
  await expect(wrap).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(wrap).toHaveAttribute("aria-checked", "true");
  await expect(wrap).toBeVisible();
});
