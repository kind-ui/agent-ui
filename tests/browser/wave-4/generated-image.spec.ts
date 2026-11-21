import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { ROOT_ID_GAP, rootIdGap } from "../svelte-root-id.js";

type Fixture = {
  kindHost: {
    downloads: string[];
    resolve(): void;
    reject(): void;
    progress(value: number): void;
    preview(show: boolean): void;
    ready(url: string): void;
    fail(): void;
    generate(): void;
    missing: string;
  };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<unknown> };
};

const png = readFileSync(
  new URL("../../../packages/agent-ui/tests/fixtures/shared/lighthouse.png", import.meta.url),
);

const part = (page: Page, id: string, slot: string) =>
  page.locator(`#${id} [data-slot="kind-generated-image-${slot}"]:not([hidden])`);
const root = (page: Page, id: string) => page.locator(`#${id}`);
const host = <Key extends keyof Fixture["kindHost"]>(page: Page, key: Key, ...args: unknown[]) =>
  page.evaluate(
    ([name, rest]) => {
      const value = (window as unknown as Fixture).kindHost[name as Key];
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown)(...rest) : value;
    },
    [key, args] as const,
  );
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
// Two frames first, so a transition a change starts on the next frame (the dialog's entrance) is running by then.
const settled = async (page: Page) => {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
};

const open = async (page: Page, name = "all") => {
  // Records each text UI SDK's live regions are given.
  await page.addInitScript(() => {
    const texts: string[] = [];
    Object.assign(window, { kindAnnounced: texts });
    new MutationObserver((mutations) => {
      for (const { target } of mutations) {
        if (target instanceof Element && target.hasAttribute("aria-live") && target.textContent)
          texts.push(target.textContent);
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`/?c=generated-image&case=${name}`);
  await expect(root(page, "loaded")).toHaveAttribute("data-phase", "loaded");
};

/** Holds `/late.png` until the returned function answers it with the fixture image. */
const holdImage = async (page: Page) => {
  let held: Route | undefined;
  await page.route("**/late.png", (route) => {
    held = route;
  });
  return async () => {
    await expect.poll(() => held !== undefined).toBe(true);
    await held?.fulfill({ body: png, contentType: "image/png" });
  };
};

test("the frame keeps its box from generating through loading to loaded", async ({ page }) => {
  await open(page);
  const frame = part(page, "lifecycle", "frame");
  const box = await frame.boundingBox();
  expect(box?.width).toBeCloseTo(((box?.height ?? 0) * 768) / 512, 0);
  await expect(root(page, "lifecycle")).toHaveAttribute("data-phase", "generating");
  await expect(root(page, "lifecycle")).toHaveAttribute("aria-busy", "true");
  await expect(part(page, "lifecycle", "preview")).toBeVisible();
  await host(page, "preview", false);
  await expect(part(page, "lifecycle", "preview")).toHaveCount(0);
  expect(await frame.boundingBox()).toEqual(box);
  await host(page, "preview", true);
  const progress = page.locator("#lifecycle").getByRole("progressbar", { name: "Creating image" });
  await expect(progress).toHaveAttribute("aria-valuenow", "40");
  await host(page, "progress", 70);
  await expect(progress).toHaveAttribute("aria-valuenow", "70");

  const answer = await holdImage(page);
  await host(page, "ready", "/late.png");
  await expect(root(page, "lifecycle")).toHaveAttribute("data-phase", "loading");
  await expect(page.locator("#lifecycle").getByRole("progressbar", { name: "Loading image" })).toBeVisible();
  expect(await frame.boundingBox()).toEqual(box);

  await answer();
  await expect(root(page, "lifecycle")).toHaveAttribute("data-phase", "loaded");
  await expect(root(page, "lifecycle")).not.toHaveAttribute("aria-busy");
  await expect(part(page, "lifecycle", "progress")).toHaveCount(0);
  await expect(page.locator("#lifecycle").getByRole("img", { name: "A lighthouse at night" })).toBeVisible();
  expect(await frame.boundingBox()).toEqual(box);
  await expect.poll(() => announced(page)).toEqual(["Image ready"]);
});

test("an image that fails after ready keeps its frame, shows why, announces it once and can't open", async ({
  page,
}) => {
  await open(page);
  const frame = part(page, "lifecycle", "frame");
  const box = await frame.boundingBox();
  await host(page, "ready", await host(page, "missing"));
  await expect(root(page, "lifecycle")).toHaveAttribute("data-phase", "error");
  await expect(part(page, "lifecycle", "error")).toHaveText("The image couldn't be loaded.");
  expect(await frame.boundingBox()).toEqual(box);
  // UI SDK's bridge offers its generic `press` to every component that opens.
  await expectAgentActions(page, "A lighthouse at night", ["press"]);
  await expect(part(page, "lifecycle", "trigger")).toHaveCount(0);
  await expect.poll(() => announced(page)).toEqual(["Image failed"]);
  await host(page, "fail");
  await expect(part(page, "lifecycle", "error")).toHaveText("The image couldn't be generated.");
  expect(await announced(page)).toEqual(["Image failed"]);
  await host(page, "generate");
  await expect(root(page, "lifecycle")).toHaveAttribute("data-phase", "generating");
  await host(page, "fail");
  await expect.poll(() => announced(page)).toEqual(["Image failed", "Image failed"]);
  await expect(part(page, "failed", "error")).toHaveText("Generation timed out.");
});

test("the trigger opens the image full size, and Escape returns focus to it", async ({ page }) => {
  await open(page);
  const trigger = page.locator("#loaded").getByRole("button", { name: "View full size" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "A lighthouse at dusk" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: "A lighthouse at dusk" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Download" })).toBeVisible();
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the preview sharpens as progress rises and nothing loops while generating", async ({ page }) => {
  const blur = () =>
    part(page, "lifecycle", "preview").evaluate((el) =>
      Number(/blur\(([\d.]+)px/.exec(getComputedStyle(el).filter)?.[1]),
    );
  const looping = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .some((animation) => animation.effect?.getTiming().iterations === Number.POSITIVE_INFINITY),
    );
  await open(page);
  await expect(part(page, "lifecycle", "progress")).toHaveText("Creating image40%");
  const early = await blur();
  await host(page, "progress", 90);
  await expect.poll(blur).toBeLessThan(early);
  expect(await looping()).toBe(false);
  expect(
    await part(page, "lifecycle", "progress").evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toBe("none");
});

test("agents open, close and download once the image is loaded", async ({ page }, testInfo) => {
  test.skip(rootIdGap(testInfo), ROOT_ID_GAP);
  await open(page);
  // UI SDK's bridge offers its generic `press` to every component that opens.
  await expectAgentActions(page, "A lighthouse at dusk", ["open", "download", "press"]);
  await expectAgentActions(page, "A lighthouse at night", ["press"]);
  await expectAgentActions(page, "A lighthouse in a storm", ["press"]);
  await page.locator("#loaded").hover();
  await page.locator("#loaded").getByRole("button", { name: "Download" }).click();
  const frameDownload = part(page, "loaded", "frame").locator('[data-slot="kind-generated-image-download"]');
  await expect(frameDownload).toHaveAttribute("data-pending", "");
  await expectAgentActions(page, "A lighthouse at dusk", ["open", "press"]);
  await host(page, "reject");
  await expect(frameDownload).not.toHaveAttribute("data-pending", "");
  await expect.poll(() => announced(page)).toContain("Download failed");
  await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({
      steps: [{ ref: "A lighthouse at dusk", action: "download", args: [] }],
    }),
  );
  await expect.poll(() => host(page, "downloads")).toEqual(["mouse", "agent"]);
  await host(page, "resolve");
  await page.evaluate(() =>
    (window as unknown as Fixture).agent.act({
      steps: [{ ref: "A lighthouse at dusk", action: "open", args: [] }],
    }),
  );
  await expect(page.getByRole("dialog", { name: "A lighthouse at dusk" })).toBeVisible();
  await expectAgentActions(page, "A lighthouse at dusk", ["close", "download", "press"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in each phase and with the dialog open, in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    const check = async () => {
      await settled(page);
      const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
      expect(violations).toEqual([]);
    };
    await check();
    await host(page, "ready", await host(page, "missing"));
    // Firefox crashes when a locator queries the page right after axe and a DOM change, so this waits in the page.
    await page.waitForFunction(
      () => document.querySelector<HTMLElement>("#lifecycle")?.dataset.phase === "error",
    );
    await page.locator("#loaded").getByRole("button", { name: "View full size" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await check();
  });
}
