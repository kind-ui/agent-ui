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

test("internal wrappers read the theme tokens, and --kind-radius squares all but the pills", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/?c=internal&case=token-input");
  const field = page.locator('[data-slot="token-input-editor"]').first();
  await expect(field).toHaveCSS("color", "oklch(0.96 0.003 286)");
  await expect(field).toHaveCSS("border-top-left-radius", "10px");
  await page.addStyleTag({ content: ":root { --kind-radius: 0px; }" });
  await expect(field).toHaveCSS("border-top-left-radius", "0px");
  await page.goto("/?c=internal&case=button");
  await page.addStyleTag({ content: ":root { --kind-radius: 0px; }" });
  await expect(page.locator('[data-slot="button"]').first()).toHaveCSS("border-top-left-radius", "9999px");
});
