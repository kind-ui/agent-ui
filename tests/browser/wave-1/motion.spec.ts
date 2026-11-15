import { expect, type Page, test } from "@playwright/test";

type Helper = typeof import("@kind-ui/agent-ui/core");
declare global {
  interface Window {
    kindMotion: Pick<Helper, "enter" | "exit" | "layout">;
  }
}

const open = async (page: Page) => {
  await page.goto("/?c=motion&case=box");
  await expect(page.locator("#box")).toBeVisible();
};

test("enter during exit reverses and ends at opacity 1", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box") as HTMLElement;
    const exiting = window.kindMotion.exit(box, "fade-up").then(
      () => "resolved",
      (error: DOMException) => error.name,
    );
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const mid = Number(getComputedStyle(box).opacity);
    await window.kindMotion.enter(box, "fade-up");
    const style = getComputedStyle(box);
    return {
      mid,
      exit: await exiting,
      opacity: style.opacity,
      transform: style.transform,
      ending: box.hasAttribute("data-ending-style"),
      inert: box.inert,
    };
  });
  expect(result.mid).toBeGreaterThan(0);
  expect(result).toMatchObject({
    exit: "AbortError",
    opacity: "1",
    transform: "none",
    ending: false,
    inert: false,
  });
});

test("exit keeps UI SDK presence attributes until it resolves", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box") as HTMLElement;
    const done = window.kindMotion.exit(box, "fade");
    const during = { ending: box.hasAttribute("data-ending-style"), inert: box.inert };
    await done;
    return { during, opacity: getComputedStyle(box).opacity };
  });
  expect(result).toEqual({ during: { ending: true, inert: true }, opacity: "0" });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const preset of ["fade-up", "expand"] as const) {
    test(`${preset} fades opacity only, for at most 120 ms`, async ({ page }) => {
      await open(page);
      const result = await page.evaluate(async (p) => {
        const box = document.getElementById("box") as HTMLElement;
        const done = window.kindMotion.enter(box, p);
        await new Promise((r) => requestAnimationFrame(r));
        const timings = box.getAnimations().map((a) => ({
          end: Number(a.effect?.getComputedTiming().endTime),
          props: (a.effect as KeyframeEffect)
            .getKeyframes()
            .flatMap((k) =>
              Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x)),
            ),
        }));
        await done;
        const style = getComputedStyle(box);
        return { timings, opacity: style.opacity, transform: style.transform, height: style.height };
      }, preset);
      expect(result.timings.length).toBeGreaterThan(0);
      for (const t of result.timings) {
        expect(t.end).toBeLessThanOrEqual(120);
        expect(new Set(t.props)).toEqual(new Set(["opacity"]));
      }
      expect(result).toMatchObject({ opacity: "1", transform: "none", height: "64px" });
    });
  }

  test("dot-flow keeps dots at steady opacity", async ({ page }) => {
    await open(page);
    const animated = await page.evaluate(async () => {
      const box = document.getElementById("box") as HTMLElement;
      await window.kindMotion.enter(box, "dot-flow");
      return [...box.querySelectorAll("[data-dot]")].map((d) => d.getAnimations().length);
    });
    expect(animated).toEqual([0, 0, 0]);
  });

  test("layout applies the new position at once", async ({ page }) => {
    await open(page);
    const animations = await page.evaluate(async () => {
      const box = document.getElementById("box") as HTMLElement;
      const before = box.getBoundingClientRect();
      box.style.marginLeft = "40px";
      await window.kindMotion.layout(box, before);
      return box.getAnimations().length;
    });
    expect(animations).toBe(0);
  });
});

test("dot-flow staggers the dots instead of blinking together", async ({ page }) => {
  await open(page);
  const delays = await page.evaluate(async () => {
    const box = document.getElementById("box") as HTMLElement;
    await window.kindMotion.enter(box, "dot-flow");
    return [...box.querySelectorAll("[data-dot]")].map((d) =>
      d.getAnimations().map((a) => a.effect?.getTiming().delay),
    );
  });
  expect(delays.map((d) => d.length)).toEqual([1, 1, 1]);
  expect(new Set(delays.flat()).size).toBe(3);
});

test("layout animates from the measured position", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box") as HTMLElement;
    const before = box.getBoundingClientRect();
    box.style.marginLeft = "40px";
    const done = window.kindMotion.layout(box, before);
    await new Promise((r) => requestAnimationFrame(r));
    const moving = box.getBoundingClientRect().left < 40 + before.left;
    await done;
    return { moving, transform: getComputedStyle(box).transform };
  });
  expect(result).toEqual({ moving: true, transform: "none" });
});

test("expand ends at natural height; motion none is instant", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box") as HTMLElement;
    await window.kindMotion.enter(box, "expand");
    const expanded = { height: getComputedStyle(box).height, inline: box.style.height };
    await window.kindMotion.exit(box, "expand", { motion: "none" });
    const gone = { opacity: getComputedStyle(box).opacity, animations: box.getAnimations().length };
    return { expanded, gone };
  });
  expect(result).toEqual({ expanded: { height: "64px", inline: "" }, gone: { opacity: "0", animations: 0 } });
});
