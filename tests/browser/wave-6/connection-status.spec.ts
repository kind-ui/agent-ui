import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";
import { watchAnimations } from "../leaving.js";

type ConnectionState = "online" | "connecting" | "reconnecting" | "offline";
type Fixture = {
  kindHost: {
    retries: number;
    resolve(): void;
    set(state: ConnectionState, options?: { retryAt?: string; resuming?: boolean }): void;
  };
  kindAnnounced: string[];
};

const pill = (page: Page) => page.locator("#connection");
const retryButton = (page: Page) => pill(page).getByRole("button", { name: "Retry" });
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const retries = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.retries);
const set = (page: Page, state: ConnectionState, options?: { retryAt?: string; resuming?: boolean }) =>
  page.evaluate(([state, options]) => (window as unknown as Fixture).kindHost.set(state, options), [
    state,
    options,
  ] as const);
// The installed clock runs while the page loads, which can take seconds under load, so it pauses ahead of the
// page's own time rather than at a fixed one, and countdowns are set from there.
const pauseClock = async (page: Page) => {
  const paused = (await page.evaluate(() => Date.now())) + 5000;
  await page.clock.pauseAt(paused);
  return (seconds: number) => new Date(paused + seconds * 1000).toISOString();
};
const settled = (page: Page) =>
  page.waitForFunction(() =>
    // The conversation's edge fades run on a scroll timeline, which never ends.
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running" || animation.timeline !== document.timeline),
  );
const open = async (page: Page, name: "online" | "offline" | "reduced" | "written") => {
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
  await page.goto(`/?c=connection-status&case=${name}`);
  await expect(page.locator("[data-message]").first()).toBeVisible();
  if (name !== "online") await expect(pill(page)).toBeVisible();
};

test("the pill comes and goes over the conversation without moving a message", async ({ page }) => {
  await open(page, "online");
  await expect(pill(page)).toBeHidden();
  const boxes = () =>
    page
      .locator("[data-message]")
      .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().toJSON()));
  const before = await boxes();
  await set(page, "offline");
  await expect(pill(page)).toBeVisible();
  await settled(page);
  expect(await boxes()).toEqual(before);
  await set(page, "online");
  await expect(pill(page)).toBeHidden();
  expect(await boxes()).toEqual(before);
});

test("reconnecting counts down to the next try each second, without a live region or an announcement per tick", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00Z") });
  await open(page, "online");
  const after = await pauseClock(page);
  await set(page, "reconnecting", { retryAt: after(3) });
  await expect(pill(page)).toHaveText(/Retrying in 3 s/);
  for (const text of ["Retrying in 2 s", "Retrying in 1 s", "Reconnecting"]) {
    await page.clock.runFor(1000);
    await expect(pill(page)).toHaveText(new RegExp(text));
  }
  await expect(pill(page)).toHaveAttribute("role", "group");
  await expect(pill(page)).not.toHaveAttribute("aria-live");
  await expect(pill(page).locator('[aria-live], [role="status"], [role="alert"], [role="log"]')).toHaveCount(
    0,
  );
  expect(await announced(page)).toEqual(["Connection lost"]);
});

test("the pill keeps its width as the countdown loses a digit", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00Z") });
  await open(page, "online");
  const after = await pauseClock(page);
  await set(page, "reconnecting", { retryAt: after(10) });
  await expect(pill(page)).toHaveText(/Retrying in 10 s/);
  const width = () => pill(page).evaluate((el) => el.getBoundingClientRect().width);
  const before = await width();
  await page.clock.runFor(1000);
  await expect(pill(page)).toHaveText(/Retrying in 9 s/);
  // Within a layout unit: the figure spaces shape as a run of their own. A lost digit is about 7px.
  expect(await width()).toBeCloseTo(before, 1);
});

test("words a host wrote get no room for lost digits", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web hosts write the words");
  await page.clock.install({ time: new Date("2026-11-18T12:00:00Z") });
  await open(page, "written");
  const after = await pauseClock(page);
  await set(page, "reconnecting", { retryAt: after(10) });
  const width = () => pill(page).evaluate((el) => el.getBoundingClientRect().width);
  await expect(pill(page)).toHaveAttribute("data-state", "reconnecting");
  const before = await width();
  await page.clock.runFor(1000);
  // A spare digit would add about 7px.
  expect(await width()).toBeCloseTo(before, 1);
});

test("losing the connection and getting it back are announced once each", async ({ page }) => {
  await open(page, "online");
  await set(page, "reconnecting");
  await expect.poll(() => announced(page)).toEqual(["Connection lost"]);
  await set(page, "offline");
  await expect(pill(page)).toHaveAccessibleName("Offline");
  await set(page, "reconnecting");
  await expect(pill(page)).toHaveAccessibleName("Reconnecting");
  await set(page, "online", { resuming: true });
  await expect(pill(page)).toHaveAccessibleName("Resuming");
  await expect(retryButton(page)).toHaveCount(0);
  await expect.poll(() => announced(page)).toEqual(["Connection lost", "Reconnected"]);
  await set(page, "online");
  await expect(pill(page)).toBeHidden();
  expect(await announced(page)).toEqual(["Connection lost", "Reconnected"]);
});

test("focus moves on from Retry when the connection comes back, and a pending retry doesn't outlast it", async ({
  page,
}) => {
  await open(page, "offline");
  await retryButton(page).focus();
  await set(page, "online");
  await expect(page.locator('[data-slot="kind-conversation-viewport"]')).toBeFocused();
  await set(page, "offline");
  await retryButton(page).focus();
  await page.keyboard.press("Enter");
  await set(page, "online");
  await set(page, "offline");
  await expect(retryButton(page)).toBeVisible();
});

// Recovery follows the flat tree, as Tab does: a shadow root in its host's place, slotted elements in their slot's.
for (const { name, shadow, light, expected } of [
  {
    name: "into a shadow root after the pill",
    shadow: "<button>Shadow</button>",
    light: "",
    expected: "Shadow",
  },
  {
    name: "to a host's slotted child before its shadow button",
    shadow: "<slot></slot><button>Shadow</button>",
    light: "<button>Light</button>",
    expected: "Light",
  },
])
  test(`focus moves from Retry ${name}`, async ({ page }) => {
    await open(page, "offline");
    await pill(page).evaluate(
      (el, [shadowHtml, lightHtml]) => {
        const host = document.createElement("div");
        host.attachShadow({ mode: "open" }).innerHTML = shadowHtml as string;
        host.innerHTML = lightHtml as string;
        el.after(host);
      },
      [shadow, light],
    );
    await retryButton(page).focus();
    await set(page, "online");
    await expect(page.getByRole("button", { name: expected, exact: true })).toBeFocused();
  });

test("focus moves from a Retry slotted into a host to the host's shadow button after it", async ({
  page,
}) => {
  await open(page, "offline");
  await pill(page).evaluate((el) => {
    const host = document.createElement("div");
    host.attachShadow({ mode: "open" }).innerHTML = "<slot></slot><button>Footer</button>";
    el.replaceWith(host);
    host.append(el);
    host.after(Object.assign(document.createElement("button"), { textContent: "Later" }));
  });
  await retryButton(page).focus();
  await set(page, "online");
  await expect(page.getByRole("button", { name: "Footer", exact: true })).toBeFocused();
});

test("Retry calls the host once and shows Reconnecting in its place while it waits", async ({ page }) => {
  await open(page, "offline");
  await retryButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(pill(page)).toHaveText(/^Reconnecting/);
  await expect(pill(page)).toHaveAccessibleName("Reconnecting");
  await expect(pill(page).locator("[data-status-mark]")).toHaveAttribute("data-status", "running");
  await expect(pill(page).getByRole("button")).toHaveCount(0);
  await expect(page.locator('[data-slot="kind-conversation-viewport"]')).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await retries(page)).toBe(1);
  await page.evaluate(() => (window as unknown as Fixture).kindHost.resolve());
  await expect(retryButton(page)).toBeVisible();
  await expect(pill(page)).toHaveAccessibleName("Offline");
  await retryButton(page).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => retries(page)).toBe(2);
});

test("at full motion the pill drops in and fades out; reduced motion only fades", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "online");
  const entrance = await watchAnimations(page, "#connection");
  await set(page, "offline");
  expect((await entrance()).sort()).toEqual(["opacity", "translate"]);
  await settled(page);
  const exit = await watchAnimations(page, "#connection");
  await set(page, "online");
  expect(await exit()).toEqual(["opacity"]);
  await expect(pill(page)).toBeHidden();

  await open(page, "reduced");
  await settled(page);
  const reduced = await watchAnimations(page, "#connection");
  await set(page, "online");
  expect(await reduced()).toEqual(["opacity"]);
  await expect(pill(page)).toBeHidden();
});

test("web keeps the words written into its parts and adds only the parts it lacks", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "web markup");
  await open(page, "written");
  await expect(pill(page)).toHaveText("Sin conexiónReintentar");
  await expect(pill(page).locator("> *")).toHaveCount(3);
  await expect(pill(page).getByRole("button")).toHaveCount(1);
});

test("agents retry", async ({ page }) => {
  await open(page, "offline");
  await expectAgentActions(page, "Offline", ["retry"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page, "offline");
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}
