import { expect, type Page, test } from "@playwright/test";

// Count budgets: deterministic counts, never timings. Each runs at two list sizes against one limit, so
// work that grows with the list fails. `renders` counts React component renders and `notified` the
// shown parts UI SDK re-reads on web, so each is 0 in the other layer.
const BUDGETS = {
  conversationStream: { writes: 1, renders: 9, notified: 0 },
  conversationFollow: { layoutReads: 12 },
  markdownStream: { parses: 1, writes: 4, renders: 6, notified: 3 },
  toolStream: { writes: 14, renders: 25, notified: 17 },
  terminalChunk: { writes: 6, renders: 7, notified: 4, layoutReads: 17 },
  // A new line in a full viewport reads layout 16 times (17 under StrictMode, which binds the new line twice). The
  // line that first fills the 10-line case's viewport both grows and scrolls it, which the virtualizer reads twice more.
  terminalLine: { writes: 8, renders: 9, notified: 5, layoutReads: 19 },
  // The fixture's segments fit on one line and their header has a set height, so how many are in view doesn't depend
  // on the platform's fonts.
  transcriptWord: { writes: 3, renders: 3, notified: 3, layoutReads: 4 },
  transcriptSegment: { writes: 32, renders: 32, notified: 35, layoutReads: 9 },
  transcriptSearch: { writes: 72, renders: 201, notified: 140, layoutReads: 2 },
  // The fixture's chips are all 120px wide, whatever the fonts, so the same two show at 10 and 200.
  // Widths come from a ResizeObserver's entries, so fitting the chips reads no layout.
  contextChip: { writes: 27, renders: 8, notified: 9, layoutReads: 0 },
  remount: { nodes: 0, listeners: 0 },
};
const SIZES = [10, 500];

type Counts = { writes: number; renders: number; notified: number; layoutReads: number };
type Fixture = {
  kindCounts: { reset(): void; read(): Counts };
  kindConversation: { append(n?: number): void; stream(chunk: string): void };
  kindMarkdown: { records: { parses: number }[]; append(chunk: string): void };
  kindRemount(): void;
  kindTerminal: { append(id: string, text: string): void };
  kindTranscript: { set(id: string, next: Record<string, unknown>): void };
  kindContext: { add(): void };
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
  // UI SDK reads each attribute of a shown part it notifies before it writes, so the elements read are those parts.
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

  // React DevTools' global hook: a function component rendered when it performed work (a render that bails
  // out on equal state did not), and an unchanged subtree keeps its children. A `memo` with a compare
  // function (tag 14) is left out, since the component inside it counts.
  const performedWork = 1;
  const components = new Set([0, 11, 15]);
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

  // UI SDK's `announce` empties its shared live region at once and writes the text in a 100 ms timer, which a later
  // `announce` cancels. Whether those writes land in a run depends on how long the page takes, so they're left out.
  const announcer = (node: Node) => node instanceof Element && node.hasAttribute("data-ui-sdk-announcer");
  const counted = (records: MutationRecord[]) =>
    records.filter((record) => !announcer(record.target) && ![...record.addedNodes].some(announcer)).length;
  const observer = new MutationObserver((records) => {
    writes += counted(records);
  });
  observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  Object.assign(window, {
    kindCounts: {
      reset() {
        observer.takeRecords();
        read = new WeakSet();
        writes = renders = notified = layoutReads = 0;
      },
      read: () => ({ writes: writes + counted(observer.takeRecords()), renders, notified, layoutReads }),
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
    // WebKit fires the opening scroll-to-end's scroll event late; let it land before counting.
    await page.evaluate(frames);
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

  test(`streamed input in one of ${size} tools`, async ({ page }) => {
    await page.goto(`/?c=tool&case=many-${size}`);
    await expect(page.locator("#tool-0")).toHaveAttribute("data-open", "");
    // A step drops `data-mounting` in its second frame; stream once it's at rest.
    await expect(page.locator("[data-mounting]")).toHaveCount(0);
    const counts = await most(
      page,
      20,
      `kindTool.setCall("tool-0", { input: { state: "streaming", value: { query: "q".repeat(window.kindChunk = (window.kindChunk ?? 0) + 1) } } })`,
    );
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.toolStream.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.toolStream.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.toolStream.notified);
  });
}

// A chunk that lengthens the last line, and one that starts a new line, cost the same at 10 lines as at 1,000: only
// the line parts the chunk changed render, and the lines in view are drawn, not the output.
for (const lines of [10, 1000]) {
  const openTerminal = async (page: Page) => {
    await page.goto(`/?c=terminal&case=stream-${lines}`);
    await expect(page.locator('[data-slot="kind-terminal-viewport"]')).toHaveAttribute("data-following", "");
    await expect(page.locator("[data-mounting]")).toHaveCount(0);
  };

  test(`a chunk on the last of ${lines} terminal lines`, async ({ page }) => {
    await openTerminal(page);
    const counts = await most(page, 20, 'kindTerminal.append("stream", " \\x1b[32mok\\x1b[0m")');
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.terminalChunk.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.terminalChunk.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.terminalChunk.notified);
    expect(counts.layoutReads).toBeLessThanOrEqual(BUDGETS.terminalChunk.layoutReads);
  });

  test(`a new line after ${lines} terminal lines`, async ({ page }) => {
    await openTerminal(page);
    const counts = await most(page, 20, 'kindTerminal.append("stream", "\\nnext line")');
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.terminalLine.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.terminalLine.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.terminalLine.notified);
    expect(counts.layoutReads).toBeLessThanOrEqual(BUDGETS.terminalLine.layoutReads);
  });
}

// Playback that moves to the next word or segment, and a search, cost the same at 100 segments as at 5,000: playback
// writes its marks without a render, following it mounts the one segment it scrolls into view, and a search renders
// only the segments in view.
for (const segments of [100, 5000]) {
  const openTranscript = async (page: Page) => {
    await page.goto(`/?c=transcript&case=many-${segments}`);
    await expect(page.locator('[data-slot="kind-transcript-segment"]').first()).toBeVisible();
    await expect(page.locator("[data-mounting]")).toHaveCount(0);
  };
  const budget = (counts: Counts, limit: Counts) => {
    expect(counts.writes).toBeLessThanOrEqual(limit.writes);
    expect(counts.renders).toBeLessThanOrEqual(limit.renders);
    expect(counts.notified).toBeLessThanOrEqual(limit.notified);
    expect(counts.layoutReads).toBeLessThanOrEqual(limit.layoutReads);
  };

  test(`playback moving to the next word among ${segments} segments`, async ({ page }) => {
    await openTranscript(page);
    // Each segment's words run from its start for about 6 s, a word every 0.7 s or so.
    const counts = await most(
      page,
      20,
      'kindTranscript.set("many", { currentTime: 20 + ((window.kindStep = (window.kindStep ?? 0) + 1) % 8) * 0.7 })',
    );
    budget(counts, BUDGETS.transcriptWord);
  });

  test(`playback moving to the next of ${segments} segments`, async ({ page }) => {
    await openTranscript(page);
    const counts = await most(
      page,
      20,
      'kindTranscript.set("many", { currentTime: (window.kindStep = (window.kindStep ?? 0) + 1) * 10 + 0.1 })',
    );
    budget(counts, BUDGETS.transcriptSegment);
  });

  test(`a search over ${segments} segments`, async ({ page }) => {
    await openTranscript(page);
    const counts = await most(
      page,
      20,
      'kindTranscript.set("many", { query: ["rollout", "agenda", "follow", ""][(window.kindStep = (window.kindStep ?? 0) + 1) % 4] })',
    );
    budget(counts, BUDGETS.transcriptSearch);
  });
}

// Adding a chip renders the new chip and the parts around the list, not every chip: at 10 chips as at 200.
for (const chips of [10, 200]) {
  test(`adding a chip among ${chips}`, async ({ page }) => {
    await page.goto(`/?c=context-bar&case=many-${chips}`);
    await expect(page.locator('[data-context-bar-part="overflow"]')).toHaveText(`+${chips - 2}`);
    const counts = await most(page, 5, "kindContext.add()");
    expect(counts.writes).toBeLessThanOrEqual(BUDGETS.contextChip.writes);
    expect(counts.renders).toBeLessThanOrEqual(BUDGETS.contextChip.renders);
    expect(counts.notified).toBeLessThanOrEqual(BUDGETS.contextChip.notified);
    expect(counts.layoutReads).toBeLessThanOrEqual(BUDGETS.contextChip.layoutReads);
  });
}

test("mounting and unmounting a conversation leaves no nodes or listeners behind", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "DOM and listener counters come from CDP, which only Chromium has");
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
