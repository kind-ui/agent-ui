import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";

type HighlightRequest = { code: string; resolve: (tokens: { content: string; color?: string }[]) => void };
type Fixture = {
  kindMarkdown: {
    source: string;
    records: { parses: number; open: number; final: number }[];
    append(chunk: string): void;
    finish(): void;
  };
  kindCode: { requests: HighlightRequest[]; setCode(code: string): void; append(chunk: string): void };
};

const open = async (page: Page, name: string) => {
  await page.goto(`/?c=markdown&case=${name}`);
  await expect(
    page.locator('[data-slot="kind-markdown"], [data-slot="kind-code-block"]').first(),
  ).toBeAttached();
};
const code = (page: Page) => page.locator('[data-slot="kind-code-block-code"] code').first();

test("streams the 10k-token answer: final blocks keep their nodes and place, and only open blocks parse", async ({
  page,
}) => {
  await open(page, "stream");
  const result = await page.evaluate(async () => {
    const { kindMarkdown } = window as unknown as Fixture;
    type Shift = PerformanceEntry & {
      value: number;
      sources: { previousRect: DOMRect; currentRect: DOMRect }[];
    };
    const shifts: number[] = [];
    // A shift whose sources all paint where they were is sub-pixel snapping while the view follows, not movement.
    const visible = ({ previousRect: a, currentRect: b }: Shift["sources"][number]) =>
      a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Shift[])
        if (entry.sources.some(visible)) shifts.push(entry.value);
    }).observe({ type: "layout-shift" });
    const kept = new Map<string, Element>();
    // Measured after a rendered frame, since a final block can't move once painted.
    const tops = new Map<string, number>();
    const moved: string[] = [];
    const replaced: string[] = [];
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const wrappers = () => [...document.querySelectorAll<HTMLElement>("[data-block-key]")];
    const source = kindMarkdown.source;
    for (let at = 0, step = 0; at < source.length; at += 20, step++) {
      kindMarkdown.append(source.slice(at, at + 20));
      const { final } = kindMarkdown.records[kindMarkdown.records.length - 1] as { final: number };
      const all = wrappers();
      for (const [key, el] of kept) {
        if (all.find((wrapper) => wrapper.dataset.blockKey === key) !== el) replaced.push(key);
      }
      for (const el of all.slice(0, final)) {
        if (!kept.has(el.dataset.blockKey as string)) kept.set(el.dataset.blockKey as string, el);
      }
      if (step % 25 === 0) {
        await frame();
        for (const [key, el] of kept) {
          const top = (el as HTMLElement).offsetTop;
          if (Math.abs(top - (tops.get(key) ?? top)) > 0.5) moved.push(key);
          tops.set(key, top);
        }
      }
    }
    await frame();
    const over = kindMarkdown.records.filter((record) => record.parses > record.open).length;
    return { kept: kept.size, replaced, moved: [...new Set(moved)], shifts, over };
  });
  expect(result.replaced).toEqual([]);
  expect(result.moved).toEqual([]);
  expect(result.shifts).toEqual([]);
  expect(result.over).toBe(0);
  expect(result.kept).toBeGreaterThan(100);
});

test("unsafe links and raw HTML render as text", async ({ page }) => {
  await open(page, "unsafe");
  const view = page.locator('[data-slot="kind-markdown"]');
  await expect(view).toContainText("A bad link and <img src=x onerror=alert(1)> stay text.");
  await expect(view.locator("a")).toHaveCount(0);
  await expect(view.locator("img")).toHaveCount(0);
});

test("copies code to the clipboard and announces it", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "answer");
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("async function retry<T>");
  await expect(page.getByRole("button", { name: "Copy code" })).toHaveAttribute("data-copied", "");
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll("[aria-live]")].map((el) => el.textContent).join("|"),
      ),
    )
    .toContain("Copied");
});

test("wrap toggles line wrapping", async ({ page }) => {
  await open(page, "answer");
  const wrap = page.getByRole("button", { name: "Wrap lines" });
  await expect(wrap).toHaveAttribute("aria-pressed", "false");
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-slot="kind-code-block"]')).toHaveAttribute("data-wrap", "");
});

test("shows highlighted tokens and ignores a late result for replaced code", async ({ page }) => {
  await open(page, "highlight");
  await expect(code(page)).toHaveText("const a = 1;");
  const resolve = (index: number, tokens: { content: string; color?: string }[]) =>
    page.evaluate(
      ([i, t]) => (window as unknown as Fixture).kindCode.requests[i as number]?.resolve(t as never),
      [index, tokens] as const,
    );
  await page.evaluate(() => (window as unknown as Fixture).kindCode.setCode("let b = 2;"));
  await resolve(0, [{ content: "const", color: "rgb(200, 0, 0)" }, { content: " a = 1;" }]);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Fixture).kindCode.requests.length))
    .toBe(2);
  await expect(code(page)).toHaveText("let b = 2;");
  await expect(code(page).locator('[style*="--kind-code-block-token"]')).toHaveCount(0);
  await resolve(1, [{ content: "let", color: "rgb(0, 0, 200)" }, { content: " b = 2;" }]);
  await expect(code(page).locator("span span").first()).toHaveCSS("color", "rgb(0, 0, 200)");
  await expect(code(page)).toHaveText("let b = 2;");
});

test("streaming code follows its end", async ({ page }) => {
  await open(page, "code-stream");
  const viewport = page.locator('[data-slot="scroll-area-viewport"]');
  for (let line = 0; line < 60; line++)
    await page.evaluate((n) => (window as unknown as Fixture).kindCode.append(`console.log(${n});\n`), line);
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
    .toBeLessThanOrEqual(1);
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(page.locator("[data-line]")).toHaveCount(60);
});

test("a wide table scrolls sideways inside its container and copies as TSV", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "table");
  const table = page.locator('[data-slot="kind-markdown-table"]');
  const viewport = table.locator('[data-slot="scroll-area-viewport"]');
  const [frame, root] = await Promise.all([
    page.locator('[data-slot="kind-markdown"]').evaluate((el) => el.getBoundingClientRect().width),
    table.evaluate((el) => el.getBoundingClientRect().width),
  ]);
  expect(root).toBeLessThanOrEqual(frame);
  expect(await viewport.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Copy table" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/^Region\tRequests\tErrors\t.*\nus-east-1\t18,204,113\t/);
});

test("has no axe violations", async ({ page }) => {
  await open(page, "answer");
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

test("code blocks and tables are live UI SDK primitives agents can use", async ({ page }) => {
  await open(page, "answer");
  await expectAgentActions(page, "Code", ["copy", "toggleWrap"]);
  await expectAgentActions(page, "Table", ["copy"]);
  await page.evaluate(() =>
    (window as unknown as { agent: { act(input: unknown): Promise<unknown> } }).agent.act({
      steps: [{ ref: "Code", action: "toggleWrap" }],
    }),
  );
  await expect(page.locator('[data-slot="kind-code-block"]')).toHaveAttribute("data-wrap", "");
});
