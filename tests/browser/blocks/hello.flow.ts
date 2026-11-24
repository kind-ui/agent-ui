import { expect, type Page } from "@playwright/test";

// The test-only hello block's flow: the Step streams its reply from the mock transport.
export async function run(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Say hello" }).click();
  await expect(page.getByText("Hello from the mock.")).toBeVisible();
  await expect(page.locator('[data-status="complete"]').first()).toBeAttached();
}
