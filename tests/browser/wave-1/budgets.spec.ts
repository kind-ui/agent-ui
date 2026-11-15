import { expect, type Page, test } from "@playwright/test";

// Count budgets: deterministic counts, never timings. Each runs at two list sizes against one limit, so
// work that grows with the list fails. `renders` counts React component renders and `notified` the
// elements UI SDK re-reads on web, so each is 0 in the other layer.
const BUDGETS = {
  conversationStream: { writes: 1, renders: 9, notified: 0 },
  conversationFollow: { layoutReads: 12 },
  markdownStream: { parses: 1, writes: 4, renders: 8, notified: 3 },
  remount: { nodes: 0, listeners: 0 },
};
const SIZES = [10, 500];

type Counts = { writes: number; renders: number; notified: number; layoutReads: number };
type Fixture = {
  kindCounts: { reset(): void; read(): Counts };
  kindConversation: { append(n?: number): void; stream(chunk: string): void };
  kindMarkdown: { records: { parses: number }[]; append(chunk: string): void };
  kindRemount(): void;
};
type Fiber = {
  tag: number;
  flags: number;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
};

function instrument() {
  let writes = 0;
  let renders = 0;
  let layoutReads = 0;
  // UI SDK reads each attribute of a part it notifies before it writes, so the elements read are the parts notified.
  let notified = 0;
  let read = new WeakSet<Element>();
  const { getAttribute } = Element.prototype;
  Element.prototype.getAttribute = function (this: Element, name: string) {
    if (!read.has(this)) {
      read.add(this);
      notified++;
    }
    return getAttribute.call(this, name);
  };

  const countCalls = <T extends object>(target: T, name: keyof T) => {
    const original = target[name] as (...args: unknown[]) => unknown;
    Object.assign(target, {
      [name](this: unknown, ...args: unknown[]) {
        layoutReads++;
        return original.apply(this, args);
      },
    });
  };
  countCalls(Element.prototype, "getBoundingClientRect");
  countCalls(Element.prototype, "getClientRects");
  countCalls(window, "getComputedStyle");
  const countGetters = (prototype: object, names: string[]) => {
    for (const name of names) {
      const { get } = Object.getOwnPropertyDescriptor(prototype, name) as PropertyDescriptor;
      Object.defineProperty(prototype, name, {
        get(this: unknown) {
          layoutReads++;
          return get?.call(this);
        },
      });
    }
  };
  countGetters(Element.prototype, [
    "clientWidth",
    "clientHeight",
    "scrollWidth",
    "scrollHeight",
    "scrollTop",
  ]);
  countGetters(HTMLElement.prototype, ["offsetWidth", "offsetHeight", "offsetTop", "offsetLeft"]);

  // React DevTools' global hook: a function component rendered when it performed work, and an unchanged
  // subtree keeps its children (as DevTools decides).
  const performedWork = 1;
  const components = new Set([0, 11, 14, 15]);
  const countRenders = (fiber: Fiber) => {
    const previous = fiber.alternate;
    if (components.has(fiber.tag) && (!previous || fiber.flags & performedWork)) renders++;
    if (previous && previous.child === fiber.child) return;
    for (let child = fiber.child; child; child = child.sibling) countRenders(child);
  };
  Object.assign(window, {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_id: number, root: { current: Fiber }) => countRenders(root.current),
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
    },
  });

  const observer = new MutationObserver((records) => {
    writes += records.length;
  });
  observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  Object.assign(window, {
    kindCounts: {
      reset() {
        observer.takeRecords();
        read = new WeakSet();
        writes = renders = notified = layoutReads = 0;
      },
      read: () => ({ writes: writes + observer.takeRecords().length, renders, notified, layoutReads }),
    },
  });
}

// Trace snapshots read every element's layout and attributes.
test.use({ trace: "off" });
test.beforeEach(({ page }) => page.addInitScript(instrument));

const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/** The most of each count that `action` took in one of `times` runs, each settled for two frames. */
async function most(page: Page, times: number, action: string): Promise<Counts> {
  const all: Counts[] = [];
  for (let run = 0; run < times; run++) {
    await page.evaluate(() => (window as unknown as Fixture).kindCounts.reset());
    await page.evaluate(action);
    await page.evaluate(frames);
    all.push(await page.evaluate(() => (window as unknown as Fixture).kindCounts.read()));
  }
  const max = (key: keyof Counts) => Math.max(...all.map((counts) => counts[key]));
  return {
    writes: max("writes"),
    renders: max("renders"),
    notified: max("notified"),
    layoutReads: max("layoutReads"),
  };
}

const openConversation = async (page: Page, name: string) => {
  await page.goto(`/?c=conversation&case=${name}`);
  await expect(page.locator('[data-slot="kind-conversation"]')).toHaveAttribute("data-following", "");
};

for (const size of SIZES) {
  test(`a streamed token in a ${size}-row conversation`, async ({ page }) => {
    await openConversation(page, `chat-${size}`);
    const counts = await most(page, 20, 'kindConversation.stream(" streamed")');
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.conversationStream.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.conversationStream.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.conversationStream.notified);
  });

  test(`following a new message in a ${size}-row conversation`, async ({ page }) => {
    await openConversation(page, `chat-${size}`);
    const counts = await most(page, 5, "kindConversation.append()");
    expect(counts.layoutReads).toBeLessThanOrEqual(BUDGETS.conversationFollow.layoutReads);
  });

  test(`a streamed chunk after ${size} markdown blocks`, async ({ page }) => {
    await page.goto("/?c=markdown&case=stream");
    await expect(page.locator('[data-slot="kind-markdown"]')).toBeAttached();
    await page.evaluate((blocks) => {
      const paragraphs = Array.from({ length: blocks }, (_, i) => `Paragraph ${i}.\n\n`);
      (window as unknown as Fixture).kindMarkdown.append(paragraphs.join(""));
    }, size);
    const counts = await most(page, 20, 'kindMarkdown.append(" word")');
    const parses = await page.evaluate(() =>
      Math.max(
        ...(window as unknown as Fixture).kindMarkdown.records.slice(-20).map((record) => record.parses),
      ),
    );
    expect(parses).toBeLessThanOrEqual(BUDGETS.markdownStream.parses);
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.markdownStream.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.markdownStream.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.markdownStream.notified);
  });
}

test("mounting and unmounting a conversation leaves no nodes or listeners behind", async ({ page }) => {
  await openConversation(page, "remount");
  const cdp = await page.context().newCDPSession(page);
  // One collection leaves DOM nodes that only the next frees, across the JS and DOM heaps.
  const counters = async () => {
    for (let i = 0; i < 3; i++) await cdp.send("HeapProfiler.collectGarbage");
    return cdp.send("Memory.getDOMCounters");
  };
  const remount = (times: number) =>
    page.evaluate(async (times) => {
      const { kindRemount } = window as unknown as Fixture;
      for (let i = 0; i < times * 2; i++) {
        kindRemount();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    }, times);
  await remount(3);
  const before = await counters();
  await remount(20);
  const after = await counters();
  expect(after.nodes - before.nodes).toBeLessThanOrEqual(BUDGETS.remount.nodes);
  expect(after.jsEventListeners - before.jsEventListeners).toBeLessThanOrEqual(BUDGETS.remount.listeners);
});
