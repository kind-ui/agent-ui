import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type Fixture = { kindStream: { set(text: string): void } };

const indicators = [
  ["kind-loader", "Loading"],
  ["kind-thinking-indicator", "Thinking"],
  ["kind-typing-indicator", "Typing"],
] as const;

const open = async (page: Page) => {
  await page.goto("/?c=indicators&case=all");
  await expect(page.getByRole("status", { name: "Thinking" })).toBeVisible();
};
const dotAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target instanceof Element && target.hasAttribute("data-dot");
      }).length,
  );
// Sets the text, then reads each chunk once the next frame has painted.
const stream = (page: Page, text: string) =>
  page.evaluate(async (next) => {
    (window as unknown as Fixture).kindStream.set(next);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return [...document.querySelectorAll('[data-slot="kind-streaming-text-chunk"]')].map((chunk) => ({
      text: chunk.textContent,
      opacity: Number(getComputedStyle(chunk).opacity),
      animations: chunk.getAnimations().length,
    }));
  }, text);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((a) => a.effect?.getTiming().iterations === Number.POSITIVE_INFINITY),
  );

test("each indicator is a named status whose dots are hidden from assistive technology", async ({ page }) => {
  await open(page);
  for (const [slot, label] of indicators) {
    await expect(page.getByRole("status", { name: label })).toBeVisible();
    await expect(page.locator(`[data-slot="${slot}-dots"]`)).toHaveAttribute("aria-hidden", "true");
  }
});

test("dots flow with a stagger instead of blinking together", async ({ page }) => {
  await open(page);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const dots = document.querySelectorAll('[data-slot="kind-thinking-indicator-dot"]');
        return new Set([...dots].map((dot) => getComputedStyle(dot).opacity)).size;
      }),
    )
    .toBeGreaterThan(1);
});

test("reduced motion holds the dots still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect.poll(() => dotAnimations(page)).toBe(0);
});

test("turning on reduced motion after mount stills the dots at one opacity", async ({ page }) => {
  await open(page);
  await expect.poll(() => dotAnimations(page)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => dotAnimations(page)).toBe(0);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const opacities = await page.evaluate(() =>
    [...document.querySelectorAll("[data-dot]")].map((dot) => getComputedStyle(dot).opacity),
  );
  expect(new Set(opacities)).toEqual(new Set(["0.6"]));
});

test("appended text fades in; a reset replaces it without fading", async ({ page }) => {
  await open(page);
  await settled(page);
  const appended = await stream(page, "Streaming text fades in, chunk by chunk");
  expect(appended.map((chunk) => chunk.text)).toEqual(["Streaming text fades in", ", chunk by chunk"]);
  expect(appended[0]?.opacity).toBe(1);
  expect(appended[1]?.opacity).toBeLessThan(1);
  await settled(page);
  const reset = await stream(page, "Regenerated");
  expect(reset).toEqual([{ text: "Regenerated", opacity: 1, animations: 0 }]);
});

test("reduced motion appends text at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const appended = await stream(page, "Streaming text fades in, at once");
  expect(appended.at(-1)).toEqual({ text: ", at once", opacity: 1, animations: 0 });
});

test("the caret is hidden from assistive technology", async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-slot="kind-streaming-text-caret"]')).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("the caret holds still while text arrives and pulses once it stops", async ({ page }) => {
  await open(page);
  const caret = page.locator('[data-slot="kind-streaming-text-caret"]');
  await expect(caret).toHaveAttribute("data-stalled", "");
  const held = await page.evaluate(async () => {
    (window as unknown as Fixture).kindStream.set("Streaming text fades in, still");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const caret = document.querySelector('[data-slot="kind-streaming-text-caret"]');
    return {
      stalled: caret?.hasAttribute("data-stalled"),
      animations: caret?.getAnimations({ subtree: true }).length,
    };
  });
  expect(held).toEqual({ stalled: false, animations: 0 });
  await expect(caret).toHaveAttribute("data-stalled", "");
});

test("indicators are listed for agents with no actions", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Thinking", []);
});

test("axe reports no violations", async ({ page }) => {
  await open(page);
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});
