import type { Page } from "@playwright/test";

// Vue warns "Hydration … mismatch", Svelte "hydration_mismatch", Solid "Hydration Mismatch"; an error thrown while
// hydrating counts too.
const mismatch = /hydration.*mismatch|hydration_mismatch|mismatch.*hydrat|failed to hydrate/i;

/** Every hydration warning or page error the page reports from now on. */
export function mismatches(page: Page) {
  const found: string[] = [];
  page.on("console", (message) => {
    if (mismatch.test(message.text())) found.push(message.text());
  });
  page.on("pageerror", (error) => found.push(error.message));
  return found;
}
