import type { BrowserContext, Page } from "@playwright/test";

type Recorded = { kindClipboard?: string };

// Only Chromium takes the clipboard permissions, so Firefox and WebKit record what the page writes instead
// of writing it. Call before the page opens.
export async function allowClipboard(context: BrowserContext, browserName: string): Promise<void> {
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    return;
  }
  await context.addInitScript(() => {
    navigator.clipboard.writeText = async (text) => {
      (window as Recorded).kindClipboard = text;
    };
  });
}

export function readClipboard(page: Page, browserName: string): Promise<string | undefined> {
  return browserName === "chromium"
    ? page.evaluate(() => navigator.clipboard.readText())
    : page.evaluate(() => (window as Recorded).kindClipboard);
}
