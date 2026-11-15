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
  await page.getByRole("textbox", { name: "Message" }).fill("hi");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(form).toHaveAttribute("data-pending", "");
  await expect(form).toHaveCSS("opacity", "0.5");
});

test("composer is a live UI SDK primitive", async ({ page }) => {
  await page.goto("/?c=composer&case=shell");
  await expectAgentActions(page, "Message", ["setValue", "submit"]);
});
