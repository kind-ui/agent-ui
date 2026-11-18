import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type DictationEvent = { level: number } | { text: string; final: boolean } | { error: string };
type Fixture = {
  kindDictation: {
    texts: { text: string; reason: string; source?: string }[];
    starts: number;
    aborted: boolean;
    push(event: DictationEvent): void;
    end(): void;
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const mic = (page: Page) => page.getByRole("button", { name: "Dictate" });
const stop = (page: Page) => page.getByRole("button", { name: "Stop" });
const cancel = (page: Page) => page.getByRole("button", { name: "Cancel" });
const status = (page: Page) => page.locator("[data-dictation-text]");
const root = (page: Page) => page.locator('[data-dictation-part="root"]');
const push = (page: Page, ...events: DictationEvent[]) =>
  page.evaluate((events) => {
    for (const event of events) (window as unknown as Fixture).kindDictation.push(event);
  }, events);
const end = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindDictation.end());
const texts = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindDictation.texts);

const load = async (page: Page, name = "default") => {
  await page.goto(`/?c=dictation&case=${name}`);
  await expect(root(page)).toHaveAttribute("data-phase", "idle");
};

const listen = async (page: Page) => {
  await mic(page).click();
  await expect(root(page)).toHaveAttribute("data-phase", "listening");
};

test("a blocked microphone says so and brings the mic button back", async ({ page }) => {
  await load(page);
  await listen(page);
  await push(page, { error: "denied" });
  await expect(root(page)).toHaveAttribute("data-phase", "error");
  await expect(status(page)).toHaveText("Microphone blocked");
  await expect(mic(page)).toBeVisible();
  await expect(stop(page)).toHaveCount(0);
  expect(await texts(page)).toEqual([]);
});

test("Cancel sends nothing, even a final text the source reports after it", async ({ page }) => {
  await load(page);
  await listen(page);
  await push(page, { text: "Hello", final: true });
  await cancel(page).click();
  await expect(root(page)).toHaveAttribute("data-phase", "idle");
  await push(page, { text: "world", final: true });
  await end(page);
  await expect(mic(page)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as Fixture).kindDictation.aborted)).toBe(true);
  expect(await texts(page)).toEqual([]);
});

test("interim text shows while listening and Stop sends the final text once, never the interim", async ({
  page,
}) => {
  await load(page);
  await listen(page);
  await expect(status(page)).toHaveText("Listening");
  await push(page, { text: " Hello", final: true }, { text: "wor", final: false });
  await expect(status(page)).toHaveText("wor");
  await stop(page).click();
  await expect(root(page)).toHaveAttribute("data-phase", "transcribing");
  await expect(status(page)).toHaveText("Transcribing");
  await expect(stop(page)).toHaveAttribute("aria-disabled", "true");
  await push(page, { text: " world", final: true });
  await end(page);
  await expect(root(page)).toHaveAttribute("data-phase", "idle");
  expect(await texts(page)).toEqual([{ text: "Hello world", reason: "stop-press", source: "mouse" }]);
});

test("the keyboard starts and stops, and focus moves between the mic button and Stop", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await expect(mic(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(stop(page)).toBeFocused();
  await push(page, { text: "Hello", final: true });
  await page.keyboard.press("Enter");
  await expect(root(page)).toHaveAttribute("data-phase", "transcribing");
  await expect(stop(page)).toBeFocused();
  await end(page);
  await expect(mic(page)).toBeFocused();
  expect(await texts(page)).toEqual([{ text: "Hello", reason: "stop-press", source: "keyboard" }]);
});

const scales = (page: Page) =>
  page
    .locator('[data-dictation-part="bar"]')
    .evaluateAll((bars) => bars.slice(-3).map((bar) => getComputedStyle(bar).scale));

test("levels move the bars", async ({ page }) => {
  await load(page);
  await listen(page);
  await push(page, { level: 0.3 }, { level: 0.9 }, { level: 0.6 });
  await expect.poll(() => scales(page)).toEqual(["1 0.3", "1 0.9", "1 0.6"]);
});

for (const motion of ["reduced", "none"] as const)
  test(`with motion="${motion}" the bars hold still`, async ({ page }) => {
    await load(page, motion);
    await listen(page);
    await push(page, { level: 0.3 }, { level: 0.9 }, { level: 0.6 });
    await expect(page.locator('[data-dictation-part="waveform"]')).toHaveCSS(
      "--kind-dictation-level-23",
      "0.6",
    );
    expect(await scales(page)).toEqual(["1 0.35", "1 0.35", "1 0.35"]);
  });

test("without a source there's no mic button", async ({ page }) => {
  await page.goto("/?c=dictation&case=no-source");
  await expect(root(page)).toHaveAttribute("data-phase", "idle");
  await expect(mic(page)).toHaveCount(0);
  await expectAgentActions(page, "Dictate", []);
});

test("an agent's start needs a person; once listening it can stop or cancel", async ({ page }) => {
  await load(page);
  await expectAgentActions(page, "Dictate", ["start"]);
  const result = await page.evaluate(() =>
    (window as unknown as Fixture).agent
      .act({ steps: [{ ref: "Dictate", action: "start" }] })
      .then(JSON.stringify, (error: Error) => error.message),
  );
  expect(result).toContain("Needs a person");
  await expect(root(page)).toHaveAttribute("data-phase", "idle");
  expect(await page.evaluate(() => (window as unknown as Fixture).kindDictation.starts)).toBe(0);
  await listen(page);
  await expect(root(page)).not.toHaveAttribute("data-agent-confirm");
  await expectAgentActions(page, "Dictate", ["stop", "cancel"]);
});

for (const scheme of ["light", "dark"] as const)
  test(`axe passes idle, listening and after an error, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const check = async () => {
      const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
      expect(violations).toEqual([]);
    };
    await load(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await check();
    await listen(page);
    await push(page, { text: "Hello", final: false }, { level: 0.5 });
    await expect(status(page)).toHaveText("Hello");
    await check();
    await push(page, { error: "denied" });
    await expect(status(page)).toHaveText("Microphone blocked");
    await check();
  });
