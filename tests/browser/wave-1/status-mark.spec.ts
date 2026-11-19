import { readdirSync, readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const styles = new URL("../../../packages/agent-ui/src/styles/", import.meta.url);
const core = new URL("../../../packages/agent-ui/src/core/", import.meta.url);

const sizes = [
  ...new Set([
    16,
    ...readdirSync(styles)
      .filter((file) => file.endsWith(".css"))
      .flatMap((file) =>
        [
          ...readFileSync(new URL(file, styles), "utf8").matchAll(/--kind-status-mark-size:\s*([\d.]+)px/g),
        ].map((match) => Number(match[1])),
      ),
  ]),
].sort((a, b) => a - b);

// The slot that shows each core file's mark.
const consumers: Record<string, string> = {
  "step/base.ts": "kind-step-icon",
  "chain-of-thought/chain-of-thought.ts": "kind-chain-of-thought-item-icon",
  "status/status.ts": "kind-status-icon",
  "confirmation/confirmation.ts": "kind-confirmation-outcome-icon",
  "feedback/feedback.ts": "kind-feedback-comment-status-icon",
  "notice/base.ts": "kind-notice-icon",
  "question/question.ts": "kind-question-summary-icon",
  "queue/queue.ts": "kind-queue-item-icon",
  "item-list.ts": "kind-task-item-icon",
  "test-results/test-results.ts": "kind-test-results-item-status",
  "dictation-button/dictation-button.ts": "kind-dictation-status-icon",
  "thread-list/thread-list.ts": "kind-thread-list-status",
};

type Fixture = {
  kindCheckpoint: { restore(restored: boolean): void };
  kindQuestion: { record(answers: unknown): void };
  kindDictation: { push(event: { error: string }): void };
};

const pages: { url: string; slots: string[]; show?: (page: Page) => Promise<unknown> }[] = [
  {
    url: "/?c=agent&case=wave-3",
    slots: [
      "kind-step-icon",
      "kind-status-icon",
      "kind-reasoning-icon",
      "kind-tool-icon",
      "kind-chain-of-thought-icon",
      "kind-chain-of-thought-item-icon",
      "kind-task-icon",
      "kind-task-item-icon",
      "kind-plan-icon",
      "kind-plan-item-icon",
      "kind-subagent-icon",
      "kind-queue-item-icon",
      "kind-notice-icon",
      "kind-guardrail-notice-icon",
    ],
  },
  {
    url: "/?c=test-results&case=all",
    slots: ["kind-test-results-icon", "kind-test-results-item-status", "kind-stack-trace-icon"],
  },
  { url: "/?c=stack-trace&case=all", slots: ["kind-stack-trace-icon"] },
  { url: "/?c=terminal&case=all", slots: ["kind-terminal-icon"] },
  { url: "/?c=thread-list&case=all", slots: ["kind-thread-list-status"] },
  {
    url: "/?c=checkpoint&case=all",
    slots: ["kind-checkpoint-restored"],
    show: async (page) => {
      await page.waitForFunction(() => "kindCheckpoint" in window);
      await page.evaluate(() => (window as unknown as Fixture).kindCheckpoint.restore(true));
    },
  },
  { url: "/?c=confirmation&case=all", slots: ["kind-confirmation-outcome-icon"] },
  {
    url: "/?c=question&case=all",
    slots: ["kind-question-summary-icon"],
    show: async (page) => {
      await page.waitForFunction(() => "kindQuestion" in window);
      await page.evaluate(() => (window as unknown as Fixture).kindQuestion.record({ env: "prod" }));
    },
  },
  {
    url: "/?c=feedback&case=all",
    slots: ["kind-feedback-comment-status-icon"],
    show: async (page) => {
      await page.getByRole("button", { name: "Good response" }).click();
      await page.getByRole("button", { name: "Add a comment" }).click();
      await page.getByRole("textbox", { name: "Comment" }).fill("Too long");
      await page.getByRole("button", { name: "Send" }).click();
    },
  },
  {
    url: "/?c=dictation&case=default",
    slots: ["kind-dictation-status-icon"],
    show: async (page) => {
      await page.getByRole("button", { name: "Dictate" }).click();
      await page.evaluate(() => (window as unknown as Fixture).kindDictation.push({ error: "denied" }));
    },
  },
];

test("every mark size is an even whole number of pixels", () => {
  expect(sizes).toContain(16);
  for (const size of sizes) expect(size % 2, `${size}px`).toBe(0);
});

test("every core file that draws a mark has a consumer page", () => {
  const files = readdirSync(core, { recursive: true, encoding: "utf8" }).filter(
    (file) =>
      file.endsWith(".ts") && readFileSync(new URL(file, core), "utf8").includes('"data-status-mark"'),
  );
  expect(files.sort()).toEqual(Object.keys(consumers).sort());
  const shown = pages.flatMap(({ slots }) => slots);
  for (const slot of Object.values(consumers)) expect(shown).toContain(slot);
});

for (const { url, slots, show } of pages) {
  test(`${url} renders each mark square, at a mark size`, async ({ page }) => {
    await page.goto(url);
    await show?.(page);
    await expect(page.locator(`[data-slot="${slots.at(-1)}"]:visible`).first()).toBeVisible();
    // Measured once two frames agree, so a popup that scales in has settled.
    const marks = await page.evaluate(async () => {
      const measure = () =>
        [...document.querySelectorAll("[data-status-mark]")].flatMap((mark) => {
          const { width, height } = mark.getBoundingClientRect();
          const slot = mark.closest("[data-slot]")?.getAttribute("data-slot");
          return width ? [{ slot, width, height }] : [];
        });
      const frame = () => new Promise(requestAnimationFrame);
      let [last, next] = ["", JSON.stringify(measure())];
      while (last !== next) {
        await frame();
        await frame();
        [last, next] = [next, JSON.stringify(measure())];
      }
      return JSON.parse(next) as { slot?: string; width: number; height: number }[];
    });
    expect(marks.length).toBeGreaterThanOrEqual(slots.length);
    for (const slot of slots) expect(marks.map((mark) => mark.slot)).toContain(slot);
    for (const { slot, width, height } of marks) {
      expect(height, slot ?? "").toBe(width);
      expect(sizes, `${slot} is ${width}px`).toContain(width);
    }
  });
}

const statuses = ["complete", "error", "cancelled", "skipped", "info", "warning", "awaiting-input"];

const place = (page: Page, status: string, size: number) =>
  page.evaluate(
    ([status, size]) => {
      document.querySelector("#kind-mark-test")?.remove();
      const host = document.createElement("div");
      host.id = "kind-mark-test";
      host.innerHTML = `<style>
        html { color-scheme: light dark; background: var(--kind-color-surface); }
        #kind-mark-test { position: fixed; inset: 0; z-index: 2147483647; background: var(--kind-color-surface); }
        #kind-mark-test [data-status-mark] { position: absolute; top: 20px; left: 20px; }
        #kind-mark-test.bare [data-status-mark]::after,
        #kind-mark-test.bare [data-status="awaiting-input"]::before { opacity: 0; }
      </style><span data-status-mark data-status="${status}" data-motion="none" style="--kind-status-mark-size: ${size}px"></span>`;
      document.body.append(host);
    },
    [status, size] as const,
  );

// Screenshots the mark with and without its glyph; the glyph is where the two differ, and its center is the
// difference's centroid. Returns its offset from the mark's center, in CSS pixels.
const glyphOffset = async (page: Page, scale: number) => {
  const mark = page.locator("#kind-mark-test [data-status-mark]");
  const shot = async () => (await mark.screenshot({ animations: "disabled" })).toString("base64");
  const glyph = await shot();
  await page.locator("#kind-mark-test").evaluate((host) => host.classList.add("bare"));
  const bare = await shot();
  return page.evaluate(
    async ([shots, ratio]) => {
      const read = async (data: string) => {
        const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
        const context = new OffscreenCanvas(image.width, image.height).getContext(
          "2d",
        ) as OffscreenCanvasRenderingContext2D;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      };
      const [a, b] = await Promise.all(shots.map(read));
      const { width, height } = a as ImageData;
      let [sum, sx, sy] = [0, 0, 0];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          let weight = 0;
          for (let c = 0; c < 3; c++)
            weight += Math.abs(
              ((a as ImageData).data[i + c] as number) - ((b as ImageData).data[i + c] as number),
            );
          sum += weight;
          sx += weight * (x + 0.5);
          sy += weight * (y + 0.5);
        }
      }
      return [(sx / sum - width / 2) / ratio, (sy / sum - height / 2) / ratio, sum];
    },
    [[glyph, bare], scale] as const,
  );
};

for (const scale of [1, 2]) {
  for (const size of sizes) {
    for (const status of statuses) {
      test(`at ${scale}x a ${size}px ${status} mark has its glyph centered`, async ({
        browser,
      }, testInfo) => {
        const page = await browser.newPage({
          deviceScaleFactor: scale,
          baseURL: testInfo.project.use.baseURL,
        });
        await page.goto("/?c=status&case=all");
        for (const colorScheme of ["light", "dark"] as const) {
          await page.emulateMedia({ colorScheme });
          await place(page, status, size);
          const [x, y, sum] = await glyphOffset(page, scale);
          expect(sum, colorScheme).toBeGreaterThan(0);
          expect(Math.abs(x as number), `${colorScheme} x`).toBeLessThan(0.5);
          expect(Math.abs(y as number), `${colorScheme} y`).toBeLessThan(0.5);
        }
        await page.close();
      });
    }

    test(`at ${scale}x a ${size}px running mark has its arc on its track`, async ({ browser }, testInfo) => {
      const page = await browser.newPage({ deviceScaleFactor: scale, baseURL: testInfo.project.use.baseURL });
      await page.goto("/?c=status&case=all");
      await place(page, "running", size);
      const [ring, arc, inset] = await page.locator("#kind-mark-test [data-status-mark]").evaluate((mark) => {
        const before = getComputedStyle(mark, "::before");
        return [getComputedStyle(mark).borderTopWidth, before.borderTopWidth, before.top];
      });
      expect(arc).toBe(ring);
      expect(inset).toBe(`-${ring}`);
      await page.close();
    });
  }
}
