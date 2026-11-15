import { expect, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

test("composer renders in light DOM with Tailwind utilities applied", async ({ page }) => {
  await page.goto("/?c=composer&case=shell");
  const form = page.getByRole("form", { name: "Message" });
  await expect(form).toBeVisible();
  expect(await page.evaluate(() => [...document.querySelectorAll("*")].some((el) => el.shadowRoot))).toBe(
    false,
  );
  await expect(form).toHaveCSS("border-top-color", "rgb(1, 2, 3)");
  await page.getByRole("textbox", { name: "Prompt" }).fill("hi");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(form).toHaveAttribute("data-pending", "");
  await expect(form).toHaveCSS("opacity", "0.5");
});

test("composer is a live UI SDK primitive", async ({ page }) => {
  await page.goto("/?c=composer&case=shell");
  await expectAgentActions(page, "Message", ["insertToken", "removeAttachment", "setValue", "submit"]);
});

test("kind-composer exposes a live value and its api", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wave-1-web", "web elements only");
  await page.goto("/?c=composer&case=shell");
  const textbox = page.getByRole("textbox", { name: "Prompt" });
  await expect(textbox).toBeVisible();
  type Draft = { text: string };
  type KindComposer = HTMLElement & { value: Draft | string; api: { getValue(): Draft } };
  const composer = page.locator("kind-composer");
  await composer.evaluate((c: KindComposer) => {
    c.value = "hello";
  });
  await expect(textbox).toHaveText("hello");
  await textbox.fill("typed");
  expect(
    await composer.evaluate((c: KindComposer) => [(c.value as Draft).text, c.api.getValue().text]),
  ).toEqual(["typed", "typed"]);
});
