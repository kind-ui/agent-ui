import { expect, type Locator, type Page, test } from "@playwright/test";

// Forced colors replace a background, which is all a mask draws, so each mask-drawn icon sets a system color.
const pages = [
  "composer&case=full",
  "composer&case=attachments",
  "conversation&case=chat",
  "message&case=all",
  "markdown&case=answer",
  "markdown&case=table",
  "tool&case=all",
  "uploader&case=mixed",
  "queue&case=all",
  "checkpoint&case=all",
  "context-meter&case=high",
  "stack-trace&case=all",
  "terminal&case=all",
  "context-bar&case=all",
  "dictation&case=default",

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its pages right below its own line.

  // wave-6-task-2: Thread List

  "thread-list&case=all",

  // wave-6-task-3: Thread Search

  // wave-6-task-4: Sidebar

  "sidebar&case=all",

  // wave-6-task-5: Launcher

  "launcher&case=read",

  // wave-6-task-6: Day Separator

  // wave-6-task-7: Connection Status

  "connection-status&case=offline",

  // wave-6-task-8: Share Dialog

  "share-dialog&case=all",

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search

  "conversation-search&case=basic",
];

type Colors = { backdrop(el: Element): string };

// What shows behind an element: the first opaque background up its ancestors, else the page's Canvas.
const defineBackdrop = () => {
  (window as unknown as Colors).backdrop = (el) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      if (!/^rgba\(.*, 0\)$/.test(color)) return color;
    }
    const canvas = document.body.appendChild(document.createElement("div"));
    canvas.style.backgroundColor = "Canvas";
    const color = getComputedStyle(canvas).backgroundColor;
    canvas.remove();
    return color;
  };
};

const maskedIcons = (page: Page) =>
  page.evaluate(() => {
    const icons: { icon: string; color: string; backdrop: string }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("#root *")) {
      if (!el.checkVisibility()) continue;
      for (const pseudo of ["::before", "::after"]) {
        const style = getComputedStyle(el, pseudo);
        if (style.content === "none" || !style.maskImage.includes("url(")) continue;
        icons.push({
          icon: `${el.dataset.slot ?? el.tagName.toLowerCase()}${pseudo}`,
          color: style.backgroundColor,
          backdrop: (window as unknown as Colors).backdrop(el),
        });
      }
    }
    return icons;
  });

const iconColor = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
const backdrop = (locator: Locator) => locator.evaluate((el) => (window as unknown as Colors).backdrop(el));

test("in forced colors every mask-drawn icon keeps a system color", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.addInitScript(defineBackdrop);
  for (const query of pages) {
    await page.goto(`/?c=${query}`);
    await expect(page.locator("#root [data-slot]").first()).toBeAttached();
    if (query.startsWith("conversation")) {
      await page.locator('[data-slot="kind-conversation-viewport"]').hover();
      await page.mouse.wheel(0, -200);
      await expect(page.getByRole("button", { name: /^Jump to latest/ })).toBeVisible();
    }
    if (query.startsWith("tool")) {
      const trigger = page.locator('#failed [data-slot="kind-tool-trigger"]');
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    }
    const icons = await maskedIcons(page);
    expect(icons.length, query).toBeGreaterThan(0);
    for (const { icon, color, backdrop } of icons) {
      expect(color, `${query} ${icon}`).not.toMatch(/^rgba\(.*, 0\)$/);
      expect(color, `${query} ${icon}`).not.toBe(backdrop);
    }
  }

  await page.goto("/?c=composer&case=full");
  const send = page.getByRole("button", { name: "Send" });
  await expect(send).toHaveAttribute("aria-disabled", "true");
  const disabled = await iconColor(send);
  await page.getByRole("textbox", { name: "Prompt" }).click();
  await page.keyboard.type("hello");
  await expect(send).not.toHaveAttribute("aria-disabled", "true");
  expect(await iconColor(send)).not.toBe(disabled);

  await page.goto("/?c=markdown&case=answer");
  const wrap = page.getByRole("button", { name: "Wrap lines" });
  const off = await backdrop(wrap);
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  expect(await backdrop(wrap)).not.toBe(off);
  expect(await iconColor(wrap)).not.toBe(await backdrop(wrap));
});
