import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindTranscript: {
    set(id: string, next: Record<string, unknown>): void;
    append(id: string, segment: Record<string, unknown>): void;
  };
  kindHost: { seeks: [number, string][]; queries: [string, string][] };
  kindAnnounced: string[];
  agent: { act(input: unknown): Promise<{ ok: boolean; steps: { result: unknown }[] }> };
};

const transcript = (page: Page, id = "standup") => page.locator(`#${id}`);
const part = (page: Page, name: string, id = "standup") =>
  transcript(page, id).locator(`[data-slot="kind-transcript-${name}"]`);
const set = (page: Page, next: Record<string, unknown>, id = "standup") =>
  page.evaluate(([i, n]) => (window as unknown as Fixture).kindTranscript.set(i, n), [id, next] as const);
const host = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost);
const announced = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindAnnounced);
const act = (page: Page, action: string, args: unknown[] = []) =>
  page.evaluate(
    ([name, rest]) =>
      (window as unknown as Fixture).agent.act({ steps: [{ ref: "Transcript", action: name, args: rest }] }),
    [action, args] as const,
  );
const scrollTopAtRest = (page: Page, id = "standup") =>
  part(page, "viewport", id).evaluate(async (el) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let top = -1;
    while (top !== el.scrollTop) {
      top = el.scrollTop;
      await frame();
      await frame();
    }
    return top;
  });

// Any error the page reports, a ResizeObserver loop included, fails the test.
test.beforeEach(({ page }) =>
  page.addInitScript(() => {
    const errors: string[] = [];
    Object.assign(window, { kindErrors: errors });
    window.addEventListener("error", (event) => errors.push(event.message));
  }),
);
test.afterEach(async ({ page }) => {
  expect(
    await page.evaluate(() => (window as unknown as { kindErrors?: string[] }).kindErrors ?? []),
  ).toEqual([]);
});

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
  await page.goto(`/?c=transcript&case=${name}`);
  await expect(page.locator('[data-slot="kind-transcript-segment"]').first()).toBeVisible();
};

test("shows each segment's speaker, time and words, and marks what's playing", async ({ page }) => {
  await open(page);
  await expect(transcript(page)).toHaveAttribute("role", "region");
  await expect(transcript(page)).toHaveAccessibleName("Transcript");
  const segments = part(page, "segment");
  await expect(segments).toHaveCount(7);
  await expect(segments.first()).toHaveAttribute("aria-posinset", "1");
  await expect(segments.first()).toHaveAttribute("aria-setsize", "7");
  await expect(segments.nth(1).locator('[data-slot="kind-transcript-speaker"]')).toHaveText("Marco");
  await expect(segments.nth(1).locator('[data-slot="kind-transcript-time"]')).toHaveText("0:06");
  await expect(segments.nth(1).locator('[data-slot="kind-transcript-seek"]')).toHaveAccessibleName(
    "Seek to 0:06",
  );
  await expect(segments.nth(4).locator('[data-slot="kind-transcript-text"]')).toHaveText(
    "I can take that review after lunch.",
  );
  await expect(part(page, "segment").locator("[aria-current]")).toHaveCount(0);

  await set(page, { currentTime: 6.6 });
  await expect(segments.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(segments.nth(1).locator("[data-current]")).toHaveText("The");
  await set(page, { currentTime: 7.5 });
  await expect(segments.nth(1).locator("[data-current]")).toHaveText("migration");
  await set(page, { currentTime: 45 });
  await expect(transcript(page).locator("[aria-current]")).toHaveCount(0);
});

test("a search keeps the segments that match and marks the match, and clearing it shows them all", async ({
  page,
}) => {
  await open(page);
  const field = transcript(page).getByRole("searchbox", { name: "Search transcript" });
  await field.fill("billing");
  await expect(part(page, "segment")).toHaveCount(2);
  await expect(part(page, "segment").first()).toHaveAttribute("aria-setsize", "2");
  await expect(part(page, "segment").first().locator("mark")).toHaveText(["billing"]);
  await expect(part(page, "count")).toHaveText("2 matches");
  await expect.poll(() => announced(page)).toContain("2 matches");
  expect((await host(page)).queries.at(-1)).toEqual(["billing", "input-change"]);

  await field.fill("zzzz");
  await expect(part(page, "segment")).toHaveCount(0);
  await expect(part(page, "count")).toHaveText("No matches");

  await transcript(page).getByRole("button", { name: "Clear search" }).click();
  await expect(field).toHaveValue("");
  await expect(part(page, "segment")).toHaveCount(7);
  await expect(part(page, "count")).toBeHidden();
  await expect(part(page, "segment").locator("mark")).toHaveCount(0);
});

test("an owner that refuses a search keeps the field and every segment", async ({ page }) => {
  await open(page, "refused");
  const field = transcript(page).getByRole("searchbox");
  await field.pressSequentially("bil");
  await expect(field).toHaveValue("");
  await expect(part(page, "segment")).toHaveCount(7);
  expect((await host(page)).queries).toContainEqual(["b", "input-change"]);
});

test("arrow keys move between times, Enter seeks, and a press on a segment seeks to its start", async ({
  page,
}) => {
  await open(page);
  const seeks = part(page, "seek");
  await seeks.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(seeks.nth(1)).toBeFocused();
  await page.keyboard.press("End");
  await expect(seeks.last()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(seeks.last()).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(seeks.nth(5)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await host(page)).seeks.at(-1)?.[0]).toBe(33.5);
  expect((await host(page)).seeks.at(-1)?.[1]).toMatch(/^segment-press:/);
  // One Tab stop for every time.
  await expect(seeks.locator("xpath=self::*[@tabindex='0']")).toHaveCount(1);

  await part(page, "segment").nth(2).locator('[data-slot="kind-transcript-text"]').click();
  await expect.poll(async () => (await host(page)).seeks.at(-1)?.[0]).toBe(13.5);
  expect((await host(page)).seeks).toHaveLength(2);
});

test("without onSeek, times are text and nothing seeks", async ({ page }) => {
  await open(page, "plain");
  await expect(transcript(page, "plain")).toHaveAccessibleName("Standup notes");
  await expect(part(page, "seek", "plain")).toHaveCount(0);
  await expect(part(page, "time", "plain").first()).toHaveText("0:00");
  await part(page, "segment", "plain").first().click();
  expect((await host(page)).seeks).toEqual([]);
});

test("playback brings its segment into view while focus is outside, and leaves the reader's place otherwise", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("#standup")?.style.setProperty("--kind-transcript-height", "8rem"),
  );
  await expect.poll(() => scrollTopAtRest(page)).toBe(0);

  await set(page, { currentTime: 62 });
  const last = part(page, "segment").filter({ hasText: "One more question" });
  await expect(last).toHaveAttribute("aria-current", "true");
  await expect.poll(() => scrollTopAtRest(page)).toBeGreaterThan(0);
  await expect(last).toBeInViewport();

  await part(page, "seek").first().focus();
  const top = await scrollTopAtRest(page);
  await set(page, { currentTime: 34 });
  await expect(part(page, "segment").filter({ hasText: "Perfect." })).toHaveAttribute("aria-current", "true");
  expect(await scrollTopAtRest(page)).toBe(top);

  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await set(page, { follow: false, currentTime: 1 });
  await expect(part(page, "segment").first()).toHaveAttribute("aria-current", "true");
  expect(await scrollTopAtRest(page)).toBe(top);
});

test("a segment that arrives later fades in once", async ({ page }) => {
  await open(page);
  const entered = await page.evaluate(async () => {
    const values: string[] = [];
    new MutationObserver((mutations) => {
      for (const { target, addedNodes } of mutations) {
        for (const node of [target, ...addedNodes]) {
          if (node instanceof Element && node.hasAttribute("data-entering"))
            values.push(node.textContent ?? "");
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-entering"],
    });
    (window as unknown as Fixture).kindTranscript.append("standup", {
      id: "s8",
      speaker: "Marco",
      start: 66,
      end: 70,
      text: "Noted, I'll send the invite.",
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return values;
  });
  expect(entered).toEqual([expect.stringContaining("Noted")]);
  await expect(part(page, "segment")).toHaveCount(8);
  await expect(part(page, "segment").locator("xpath=self::*[@data-entering]")).toHaveCount(0);
});

test("agents search and seek", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Transcript", ["search", "seek"]);
  expect((await act(page, "search", ["review"])).ok).toBe(true);
  await expect(part(page, "count")).toHaveText("2 matches");
  await expect(transcript(page).getByRole("searchbox")).toHaveValue("review");
  expect((await host(page)).queries.at(-1)).toEqual(["review", "imperative"]);

  expect((await act(page, "seek", ["s3"])).ok).toBe(true);
  expect((await host(page)).seeks.at(-1)).toEqual([13.5, "imperative:agent"]);
  expect((await act(page, "seek", ["nope"])).steps[0]?.result).toBe(false);
  // The search field is the transcript's, so the snapshot holds only "Transcript".
  const labels = await page.evaluate(() =>
    (window as unknown as { agent: { snapshot(): { label?: string }[] } }).agent
      .snapshot()
      .map((entry) => entry.label),
  );
  expect(labels).toEqual(["Transcript"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    // The fixture page has no background of its own, which axe reads as white.
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await set(page, { currentTime: 7.5 });
    await transcript(page).getByRole("searchbox").fill("review");
    await expect(part(page, "count")).toHaveText("2 matches");
    const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
    expect(violations).toEqual([]);
  });
}

test("kind-transcript put back in the page draws its segments and keeps its search", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "web", "web elements only");
  await open(page);
  await transcript(page).getByRole("searchbox").fill("billing");
  await expect(part(page, "segment")).toHaveCount(2);
  await transcript(page).evaluate(async (el) => {
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(el);
  });
  await expect(part(page, "segment")).toHaveCount(2);
  expect(await transcript(page).evaluate((el: HTMLElementTagNameMap["kind-transcript"]) => el.query)).toBe(
    "billing",
  );
  await transcript(page).evaluate((el: HTMLElementTagNameMap["kind-transcript"]) => {
    el.query = "";
  });
  await expect(part(page, "segment")).toHaveCount(7);
});
