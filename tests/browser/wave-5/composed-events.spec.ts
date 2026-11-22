import { expect, type Page, test } from "@playwright/test";
import { isWebElements } from "../layer.js";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "hearComposed hears @ui-sdk/web events");
  await page.goto("/?c=composed-events&case=menu");
  await expect(page.locator("kind-test-menu")).toBeAttached();
});

const lines = (page: Page) => page.locator("output");

test("a menu's choices reach the primitive once each, with who made them", async ({ page }) => {
  const root = page.locator("kind-test-menu");
  await page.getByRole("button", { name: "Edit" }).focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-open", "");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  // Menu runs an item on Enter's keydown, with no click.
  await page.keyboard.press("Enter");
  await expect(lines(page)).toHaveText("action rename keyboard\n");
  await expect(root).not.toHaveAttribute("data-open");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Word wrap" }).click();
  await page.getByRole("menuitemradio", { name: "Comfortable" }).click();
  await page.getByRole("menuitem", { name: "More" }).press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(lines(page)).toHaveText(
    "action rename keyboard\nchecked wrap true mouse\nvalue density comfortable mouse\naction delete keyboard\n",
  );
});

test("an event from a kind-* element, a cancelled one, or one after unbinding isn't handed on", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const fire = (target: Element, value: string) =>
      target.dispatchEvent(new CustomEvent("action", { detail: { value }, cancelable: true }));
    const root = document.querySelector("kind-test-menu") as Element;
    const menu = root.querySelector("ui-menu") as Element;
    fire(menu, "first");
    fire(root.querySelector("kind-test-other") as Element, "from-kind");
    const cancel = (event: Event) => event.preventDefault();
    document.addEventListener("action", cancel, true);
    fire(menu, "cancelled");
    document.removeEventListener("action", cancel, true);
    // UI SDK unbinds a removed element a microtask after it leaves, unless it's back by then.
    root.remove();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    fire(menu, "unbound");
  });
  await expect(lines(page)).toHaveText("action first programmatic\n");
});

test("an event of a component nested in the root's content reaches only that component", async ({ page }) => {
  await page.evaluate(async () => {
    const inner = document.createElement("kind-test-menu");
    inner.innerHTML = "<ui-menu><ui-menu-content></ui-menu-content></ui-menu>";
    document.querySelector("kind-test-menu")?.append(inner);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    inner
      .querySelector("ui-menu")
      ?.dispatchEvent(new CustomEvent("action", { detail: { value: "inner" }, cancelable: true }));
  });
  await expect(lines(page)).toHaveText("action inner programmatic\n");
});

test("a disabled menu doesn't open, and closes when disabled while open", async ({ page }) => {
  const root = page.locator("kind-test-menu");
  const trigger = page.getByRole("button", { name: "Edit" });
  await trigger.click();
  await expect(root).toHaveAttribute("data-open", "");
  await root.evaluate((el) => el.setAttribute("disabled", ""));
  await expect(root).not.toHaveAttribute("data-open");
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeHidden();
  await expect(root).not.toHaveAttribute("data-open");
});
