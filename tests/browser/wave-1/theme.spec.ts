import { expect, type Page, test } from "@playwright/test";

const open = async (page: Page) => {
  await page.goto("/?c=step&case=list");
  await expect(page.locator('[data-slot="kind-step"]').first()).toHaveAttribute("data-status", /.+/);
};
const step = (page: Page) => page.locator('[data-slot="kind-step"]').first();

test("theme colors follow color-scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page);
  await expect(step(page)).toHaveCSS("color", "oklch(0.21 0.006 286)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(step(page)).toHaveCSS("color", "oklch(0.96 0.003 286)");
});

test("a consumer's own token values win", async ({ page }) => {
  await open(page);
  await page.addStyleTag({ content: ":root { --kind-color-fg: rgb(1, 2, 3); }" });
  await expect(step(page)).toHaveCSS("color", "rgb(1, 2, 3)");
});
