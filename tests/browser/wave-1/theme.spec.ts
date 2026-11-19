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

test("internal wrappers read the theme tokens", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/?c=internal&case=button");
  const button = page.locator('[data-slot="button"]').first();
  await expect(button).toHaveCSS("color", "oklch(0.96 0.003 286)");
  await page.addStyleTag({ content: ":root { --kind-radius: 0px; }" });
  await expect(button).toHaveCSS("border-radius", "0px");
});
