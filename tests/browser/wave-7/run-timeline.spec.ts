import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Fixture = {
  kindHost: { loads: string[]; append(): void; settle(): void };
  kindAnimated: Element[];
  kindServerMarkup?: string;
  kindHydrationErrors?: string[];
};

const root = (page: Page) => page.locator('#run-timeline [data-run-timeline-part="root"]');
const list = (page: Page) => root(page).getByRole("list", { name: "Activity" });
const event = (page: Page, name: string) => root(page).getByRole("listitem", { name });
const more = (page: Page) => root(page).locator('[data-run-timeline-part="more"]');
const host = (page: Page, change: "append" | "settle") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost[name](), change);
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" || animation.effect?.getComputedTiming().iterations === Infinity,
      ),
  );

const open = async (page: Page, name = "all", time = "2026-11-10T15:00:00Z") => {
  // Records each event an animation starts on.
  await page.addInitScript(() => {
    const animated: Element[] = [];
    Object.assign(window, { kindAnimated: animated });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      if (this.getAttribute("data-run-timeline-part") === "item") animated.push(this);
      return animate.apply(this, args);
    };
  });
  await page.clock.install({ time: new Date(time) });
  await page.goto(`/?c=run-timeline&case=${name}`);
  await expect(page.locator('[data-run-timeline-part="root"]').first()).toBeVisible();
};

test("events are a named list, each named by its title and described by its time and description", async ({
  page,
}) => {
  await open(page);
  await expect(root(page)).toHaveAttribute("role", "group");
  await expect(root(page)).toHaveAccessibleName("Activity");
  await expect(list(page).getByRole("listitem")).toHaveCount(5);
  await expect(event(page, "Run started")).toHaveAccessibleDescription(
    "2:02 PM Ada Fix the login redirect on main.",
  );
  await expect(event(page, "Ran the tests (failed)")).toHaveAccessibleDescription(
    "2:09 PM 2 of 312 tests failed in auth.test.ts.",
  );
  await expect(event(page, "Retrying with a fix")).toHaveAccessibleDescription("2:11 PM");
  await expect(event(page, "Run started").locator("time")).toHaveAttribute(
    "datetime",
    "2026-11-10T14:02:00Z",
  );
  // Without a status, the marker is a dot; a status is a mark.
  await expect(
    event(page, "Retrying with a fix").locator('[data-run-timeline-part="marker"]'),
  ).not.toHaveAttribute("data-status-mark");
  await expect(
    event(page, "Ran the tests (failed)").locator('[data-run-timeline-part="marker"]'),
  ).toHaveAttribute("data-status", "error");
});

test("a day other than today reads its date", async ({ page }) => {
  await open(page, "all", "2026-11-12T15:00:00Z");
  await expect(event(page, "Run started").locator('[data-run-timeline-part="time"]')).toHaveText(
    "Nov 10, 2:02 PM",
  );
});

test("Tab lands on the running event, the current step, and Up, Down, Home and End move", async ({
  page,
}) => {
  await open(page);
  const running = event(page, "Running checks (running)");
  await expect(running).toHaveAttribute("aria-current", "step");
  await page.locator("body").focus();
  await page.keyboard.press("Tab");
  await expect(more(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(running).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(event(page, "Retrying with a fix")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(event(page, "Run started")).toBeFocused();
  await page.keyboard.press("End");
  await expect(running).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(event(page, "Run started")).toBeFocused();
});

test("a feed is articles, newest first, that Page Down and Page Up move between", async ({ page }) => {
  await open(page, "feed");
  const feed = root(page).getByRole("feed", { name: "Activity" });
  await expect(feed.getByRole("article")).toHaveCount(5);
  const first = feed.getByRole("article").first();
  await expect(first).toHaveAccessibleName("Running checks (running)");
  await expect(first).toHaveAttribute("aria-posinset", "1");
  await expect(first).toHaveAttribute("aria-setsize", "5");
  await first.focus();
  await page.keyboard.press("PageDown");
  await expect(feed.getByRole("article", { name: "Retrying with a fix" })).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(first).toBeFocused();
});

test("an appended event plays its entrance once and moves nothing above it", async ({ page }) => {
  await open(page);
  await settled(page);
  const before = await list(page).getByRole("listitem").first().boundingBox();
  await host(page, "append");
  const added = event(page, "Pull request opened");
  await expect(added).toBeVisible();
  await expect(event(page, "Running checks")).not.toHaveAttribute("aria-current", "step");
  await settled(page);
  expect(await list(page).getByRole("listitem").first().boundingBox()).toEqual(before);
  const animated = await page.evaluate(() =>
    [...new Set((window as unknown as Fixture).kindAnimated)].map(
      (item) => item.querySelector('[data-run-timeline-part="title"]')?.textContent,
    ),
  );
  expect(animated).toEqual(["Pull request opened"]);
});

test("Show earlier loads earlier events, reads Loading meanwhile, and hands focus to the oldest", async ({
  page,
}) => {
  await open(page);
  await expect(more(page)).toHaveText("Show earlier");
  await more(page).focus();
  await page.keyboard.press("Enter");
  await expect(more(page)).toHaveText("Loading");
  await expect(more(page)).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => (window as unknown as Fixture).kindHost.loads)).toEqual(["more-press"]);
  await host(page, "settle");
  await expect(more(page)).toHaveCount(0);
  await expect(list(page).getByRole("listitem").first()).toHaveAccessibleName("Run queued");
  await expect(list(page).getByRole("listitem").first()).toBeFocused();
});

test("agents see one Activity entry, with no actions of its own", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Activity", []);
});

test("server markup shows each date and hydrates into times of day without an error", async ({
  page,
}, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "React renders server markup");
  await open(page, "hydrate");
  await expect(page.locator('#hydrated [data-run-timeline-part="time"]').first()).toHaveText("2:02 PM");
  const { kindServerMarkup, kindHydrationErrors } = await page.evaluate(() => {
    const { kindServerMarkup, kindHydrationErrors } = window as unknown as Fixture;
    return { kindServerMarkup, kindHydrationErrors };
  });
  expect(kindServerMarkup).toContain("Nov 10, 2026, 2:02 PM");
  expect(kindHydrationErrors).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const name of ["all", "feed"]) {
    test(`axe reports no violations in ${colorScheme} mode, ${name}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await open(page, name);
      await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
      await settled(page);
      const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
      expect(violations).toEqual([]);
    });
  }
}
