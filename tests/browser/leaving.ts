import type { Page } from "@playwright/test";

type Point = { x: number; y: number };

export type ExitWatch = {
  /** Whether the row was inert and hidden from assistive technology as it started leaving. */
  leaving: { inert: boolean; hidden: string | null }[];
  /** The properties the leaving row's exit animated. */
  exit: string[];
  /** Each remaining row's position before the removal, then at every frame until the removal settles. */
  paths: Record<string, Point[]>;
  /** The rows that slid (the motion helper's `layout` writes `translate`). */
  slid: string[];
};

/**
 * Has the host remove `id` through `window[host].remove`, then watches each frame until no row is leaving and the
 * rows have stopped moving. Rows are `row` elements inside `root`, named by the text of their `name` element.
 */
export const watchExit = (
  page: Page,
  { root, row, name, host, id }: { root: string; row: string; name: string; host: string; id: string },
): Promise<ExitWatch> =>
  page.evaluate(
    async ({ root, row, name, host, id }) => {
      const container = document.querySelector(root) as HTMLElement;
      const rows = () =>
        [...container.querySelectorAll<HTMLElement>(row)].filter((el) => !el.hasAttribute("data-leaving"));
      const nameOf = (el: HTMLElement) => el.querySelector(name)?.textContent ?? "";
      const paths: Record<string, Point[]> = {};
      const slid = new Set<string>();
      const record = () => {
        for (const el of rows()) {
          const { x, y } = el.getBoundingClientRect();
          const label = nameOf(el);
          paths[label] = [...(paths[label] ?? []), { x, y }];
          if (el.style.translate) slid.add(label);
        }
      };
      const leaving: ExitWatch["leaving"] = [];
      const observer = new MutationObserver((mutations) => {
        for (const { target } of mutations)
          if (target instanceof HTMLElement && target.hasAttribute("data-leaving"))
            leaving.push({ inert: target.inert, hidden: target.getAttribute("aria-hidden") });
      });
      observer.observe(container, { attributes: true, attributeFilter: ["data-leaving"], subtree: true });
      record();
      (window as unknown as Record<string, { remove(id: string): void }>)[host]?.remove(id);
      const exit = new Set<string>();
      let quietFrames = 0;
      for (let frame = 0; frame < 180 && quietFrames < 5; frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const gone = container.querySelector(`${row}[data-leaving]`);
        // The motion helper's own animations, not the row's CSS transitions.
        for (const animation of gone?.getAnimations().filter((each) => !(each instanceof CSSTransition)) ??
          [])
          for (const keyframe of (animation.effect as KeyframeEffect).getKeyframes())
            for (const property of Object.keys(keyframe)) exit.add(property);
        record();
        const moving = rows().some((el) => el.style.translate);
        quietFrames = gone || moving ? 0 : quietFrames + 1;
      }
      observer.disconnect();
      return {
        leaving,
        exit: [...exit].filter((property) => !/offset|easing|composite/i.test(property)),
        paths,
        slid: [...slid],
      };
    },
    { root, row, name, host, id },
  );

/** How far a row moved in all, and its largest move between two frames. */
export const travel = (path: Point[]) => {
  const first = path[0] as Point;
  const last = path.at(-1) as Point;
  const step = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
  return {
    total: step(first, last),
    largestStep: Math.max(0, ...path.slice(1).map((point, index) => step(path[index] as Point, point))),
  };
};

/** Adds `id` back through `window[host].add` and resolves with whether its new row, named `text`, plays an entrance. */
export const addBack = (
  page: Page,
  {
    root,
    row,
    name,
    host,
    id,
    text,
  }: { root: string; row: string; name: string; host: string; id: string; text: string },
) =>
  page.evaluate(
    async ({ root, row, name, host, id, text }) => {
      const container = document.querySelector(root) as HTMLElement;
      (window as unknown as Record<string, { add(id: string): void }>)[host]?.add(id);
      for (let frame = 0; frame < 30; frame++) {
        const added = [...container.querySelectorAll<HTMLElement>(row)].find(
          (el) => el.querySelector(name)?.textContent === text,
        );
        if (added) return added.getAnimations().length > 0;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return false;
    },
    { root, row, name, host, id, text },
  );

/**
 * Watches the element `selector` matches, every frame from now, and returns a function that resolves with the
 * properties its animations moved: call it once whatever starts them has run. Reading each frame catches a reduced
 * fade (120 ms), which can end before a later round trip to the page reads it. Resolves once they end, or with none
 * if nothing plays within 30 frames of the call.
 */
export const watchAnimations = async (page: Page, selector: string) => {
  const watch = await page.evaluateHandle((selector) => {
    const watch = { called: false, done: Promise.resolve<string[]>([]) };
    watch.done = (async () => {
      const moved = new Set<string>();
      let idle = 0;
      while (idle < 30) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const animations = document.querySelector(selector)?.getAnimations() ?? [];
        for (const animation of animations)
          for (const keyframe of (animation.effect as KeyframeEffect).getKeyframes())
            for (const property of Object.keys(keyframe)) moved.add(property);
        if (moved.size > 0 && animations.length === 0) break;
        if (watch.called && animations.length === 0) idle++;
      }
      return [...moved].filter(
        (property) => !["offset", "easing", "composite", "computedOffset"].includes(property),
      );
    })();
    return watch;
  }, selector);
  return () =>
    page.evaluate((watch) => {
      watch.called = true;
      return watch.done;
    }, watch);
};
