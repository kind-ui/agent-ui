import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { isWebElements } from "../layer.js";

type Fixture = {
  kindHost: {
    ratings: { rating: string | null; reason: string; source: string }[];
    comments: { text: string; source: string; resolve(): void; reject(): void }[];
    setCommentSent(sent: boolean): void;
  };
  agent: { act(input: unknown): Promise<unknown> };
};

const feedback = (page: Page) => page.getByRole("group", { name: "Feedback" });
const up = (page: Page) => page.getByRole("button", { name: "Good response" });
const down = (page: Page) => page.getByRole("button", { name: "Bad response" });
const addComment = (page: Page) => page.getByRole("button", { name: "Add a comment" });
const box = (page: Page) => page.getByRole("dialog", { name: "Add a comment" });
const text = (page: Page) => page.getByRole("textbox", { name: "Comment" });
const send = (page: Page) => page.getByRole("button", { name: "Send" });
const thanks = (page: Page) => feedback(page).locator('[data-slot="kind-feedback-thanks"]');

const ratings = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindHost.ratings);
const comments = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as Fixture).kindHost.comments.map(({ text, source }) => ({ text, source })),
  );
const settle = (page: Page, outcome: "resolve" | "reject") =>
  page.evaluate((name) => (window as unknown as Fixture).kindHost.comments.at(-1)?.[name](), outcome);
const setCommentSent = (page: Page) =>
  page.evaluate(() => (window as unknown as Fixture).kindHost.setCommentSent(true));
const act = (page: Page, action: string, args: unknown[] = []) =>
  page.evaluate(
    ({ action, args }) =>
      (window as unknown as Fixture).agent
        .act({ steps: [{ ref: "Feedback", action, args }] })
        .then(JSON.stringify, (error: Error) => error.message),
    { action, args },
  );
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );

const open = async (page: Page, name = "all") => {
  await page.goto(`/?c=feedback&case=${name}`);
  await expect(up(page)).toBeVisible();
};

const openBox = async (page: Page) => {
  await up(page).click();
  await addComment(page).click();
  await expect(box(page)).toBeVisible();
};

test("a group named Feedback with two thumbs, neither pressed, and no comment button yet", async ({
  page,
}) => {
  await open(page);
  await expect(feedback(page)).toBeVisible();
  await expect(up(page)).toHaveAttribute("aria-pressed", "false");
  await expect(down(page)).toHaveAttribute("aria-pressed", "false");
  await expect(addComment(page)).toBeHidden();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("the comment box asks what went well after a thumbs up, what could be better after a thumbs down", async ({
  page,
}) => {
  await open(page);
  await openBox(page);
  await expect(text(page)).toHaveAttribute("placeholder", "What went well…");
  await page.keyboard.press("Escape");
  await down(page).click();
  await addComment(page).click();
  await expect(text(page)).toHaveAttribute("placeholder", "What could be better…");
});

test("a comment box a web host wrote keeps its own placeholder and name", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "React hands them to a render function to override");
  await open(page);
  const written = await page.evaluate(async () => {
    const source = document.querySelector("kind-feedback");
    const feedback = document.createElement("kind-feedback") as HTMLElement & { rating: string | null };
    feedback.innerHTML = source?.innerHTML ?? "";
    const area = feedback.querySelector("kind-feedback-comment-text textarea") as HTMLTextAreaElement;
    area.placeholder = "Tell us more";
    area.ariaLabel = "Your note";
    document.body.append(feedback);
    feedback.rating = "up";
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return [area.placeholder, area.ariaLabel];
  });
  expect(written).toEqual(["Tell us more", "Your note"]);
});

test("the thumbs are one Tab stop with arrow keys between them", async ({ page }) => {
  await open(page);
  await page.locator("#above").click();
  await page.keyboard.press("Tab");
  await expect(up(page)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(down(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(down(page)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await expect(addComment(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(down(page)).toBeFocused();
  expect(await ratings(page)).toEqual([{ rating: "down", reason: "item-press", source: "keyboard" }]);
});

for (const name of ["all", "controlled"]) {
  test(`pressing the pressed thumb clears the rating (${name})`, async ({ page }) => {
    await open(page, name);
    await up(page).click();
    await expect(up(page)).toHaveAttribute("aria-pressed", "true");
    await down(page).click();
    await expect(down(page)).toHaveAttribute("aria-pressed", "true");
    await expect(up(page)).toHaveAttribute("aria-pressed", "false");
    await down(page).click();
    await expect(down(page)).toHaveAttribute("aria-pressed", "false");
    await expect(addComment(page)).toBeHidden();
    expect((await ratings(page)).map(({ rating }) => rating)).toEqual(["up", "down", null]);
  });
}

test("a controlling host that refuses a rating keeps the thumbs unpressed", async ({ page }) => {
  await open(page, "refuse");
  await up(page).click();
  await expect(up(page)).toHaveAttribute("aria-pressed", "false");
  await expect(addComment(page)).toBeHidden();
  expect((await ratings(page)).map(({ rating }) => rating)).toEqual(["up"]);
});

test("the comment button appears without moving the thumbs", async ({ page }) => {
  await open(page);
  const boxes = () =>
    Promise.all(
      [up(page), down(page)].map((thumb) => thumb.evaluate((el) => el.getBoundingClientRect().toJSON())),
    );
  const before = await boxes();
  await up(page).click();
  await expect(addComment(page)).toBeVisible();
  expect(await boxes()).toEqual(before);
});

test("the box focuses its text, sends once on a double press, then closes and returns focus", async ({
  page,
}) => {
  await open(page);
  await openBox(page);
  await expect(text(page)).toBeFocused();
  const top = await box(page).evaluate((el) => el.getBoundingClientRect().top);
  const bottom = await addComment(page).evaluate((el) => el.getBoundingClientRect().bottom);
  expect(top).toBeGreaterThanOrEqual(bottom);
  await expect(send(page)).toHaveAttribute("aria-disabled", "true");
  await text(page).fill("  Too long  ");
  await send(page).dblclick();
  await expect(send(page)).toHaveAttribute("data-pending", "");
  await expect(box(page).getByText("Sending")).toBeVisible();
  expect(await comments(page)).toEqual([{ text: "Too long", source: "mouse" }]);
  await settle(page, "resolve");
  await expect(box(page)).toBeHidden();
  await expect(addComment(page)).toBeFocused();
  await setCommentSent(page);
  await expect(thanks(page)).toHaveText("Thanks for your feedback");
  await expect(addComment(page)).toBeHidden();
  await expect(thanks(page)).toBeFocused();
});

test("a rejected comment keeps the text and the box, with an error, and Send works again", async ({
  page,
}) => {
  await open(page);
  await openBox(page);
  await text(page).fill("Wrong file");
  await send(page).click();
  await settle(page, "reject");
  await expect(box(page).getByText("Comment not sent. Try again.")).toBeVisible();
  await expect(text(page)).toHaveValue("Wrong file");
  await expect(send(page)).not.toHaveAttribute("aria-disabled", "true");
  await send(page).click();
  await expect(box(page).getByText("Comment not sent. Try again.")).toBeHidden();
  expect((await comments(page)).map(({ text }) => text)).toEqual(["Wrong file", "Wrong file"]);
});

test("Escape closes the box and returns focus to its button, and the text waits for the next open", async ({
  page,
}) => {
  await open(page);
  await openBox(page);
  await text(page).fill("Half a thought");
  await page.keyboard.press("Escape");
  await expect(box(page)).toBeHidden();
  await expect(addComment(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(text(page)).toHaveValue("Half a thought");
});

test("an element put back in the page keeps the comment its box held, and sends it", async ({
  page,
}, testInfo) => {
  test.skip(!isWebElements(testInfo), "Web Components only");
  await open(page);
  await openBox(page);
  await text(page).fill("Kept text");
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    const el = document.querySelector("#feedback") as HTMLElement;
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 50));
    parent.prepend(el);
  });
  await addComment(page).click();
  await expect(text(page)).toHaveValue("Kept text");
  await send(page).click();
  expect((await comments(page)).map(({ text }) => text)).toEqual(["Kept text"]);
});

test("with reduced motion the box only fades", async ({ page }) => {
  await open(page, "reduced");
  await openBox(page);
  expect(await box(page).evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("opacity");
  const exit = await box(page).evaluate((el) => {
    el.setAttribute("data-ending-style", "");
    const duration = getComputedStyle(el).transitionDuration;
    el.removeAttribute("data-ending-style");
    return duration;
  });
  expect(exit).toBe("0.12s");
});

test("an agent rates and comments, each offered only when it applies", async ({ page }) => {
  await open(page);
  // The bridge adds its generic `press` to any component holding a button.
  await expectAgentActions(page, "Feedback", ["press", "rate"]);
  expect(await act(page, "rate", ["down"])).toContain('"ok":true');
  await expect(down(page)).toHaveAttribute("aria-pressed", "true");
  expect(await ratings(page)).toEqual([{ rating: "down", reason: "imperative", source: "agent" }]);
  await expectAgentActions(page, "Feedback", ["press", "rate", "submitComment"]);
  const sent = act(page, "submitComment", ["Missed the point"]);
  await expect.poll(() => comments(page)).toEqual([{ text: "Missed the point", source: "agent" }]);
  await expectAgentActions(page, "Feedback", ["press", "rate"]);
  await settle(page, "resolve");
  expect(await sent).toContain('"ok":true');
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe reports no violations, rated and with the box open, in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    await page.addStyleTag({ content: "html { background: var(--kind-color-surface); }" });
    await up(page).click();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#feedback").analyze()).violations).toEqual([]);
    await addComment(page).click();
    await expect(box(page)).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).include("#feedback").analyze()).violations).toEqual([]);
  });
}
