/** One rendered message to paint: its row, the text its matches index into, and the matches. */
export type PaintedRow = {
  row: HTMLElement;
  text: string;
  matches: readonly { start: number; end: number; current: boolean }[];
};

// Text the Markdown view renders beside a message's own: Code Block's and the table's headers and buttons.
const CHROME =
  "button, [data-slot='kind-code-block-header'], [data-slot='kind-markdown-table-header'], [aria-hidden='true']";

const MARKDOWN = "[data-slot='kind-markdown']";

type Span = { node: Text; start: number };

/**
 * Lines each of the row's text nodes up with `text`, in order: a node sits at the next place `text` continues with
 * it, past the line breaks between blocks, and a node it doesn't continue with (a message's author or time, a button)
 * is left out. Only nodes inside the row's Markdown count, when it has any.
 */
function spansOf(row: HTMLElement, text: string): Span[] {
  const scoped = row.querySelector(MARKDOWN) !== null;
  const walker = row.ownerDocument.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  const spans: Span[] = [];
  let cursor = 0;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const { data, parentElement } = node;
    if (!data || !parentElement || parentElement.closest(CHROME)) continue;
    if (scoped && !parentElement.closest(MARKDOWN)) continue;
    let at = cursor;
    while (text[at] === "\n" && !text.startsWith(data, at)) at += 1;
    if (!text.startsWith(data, at)) continue;
    spans.push({ node, start: at });
    cursor = at + data.length;
  }
  return spans;
}

/** The span holding `offset`, as a range's start (`end` false) or end (`end` true) would sit in it. */
const spanAt = (spans: readonly Span[], offset: number, end: boolean) =>
  spans.find(({ node, start }) =>
    end ? offset > start && offset <= start + node.length : offset >= start && offset < start + node.length,
  );

/*
 * Every match, and the current one stronger. The current match is dark text on amber (6.9:1 in light, 9.8:1 in dark);
 * other matches keep the page's text over a dim amber (12.9:1 in light, 6.6:1 in dark). These rules join the page
 * here, not in `conversation-search.css`: Tailwind before 4.3.5 optimizes an app's CSS with Lightning CSS 1.32, which
 * warns on every `::highlight()`. In `components`, the stylesheets' layer, so a page's unlayered rule or utility wins.
 */
const STYLES = `@layer components {
  ::highlight(kind-search) {
    background-color: color-mix(in oklab, var(--kind-color-warning) 35%, transparent);
    color: var(--kind-color-fg);
  }
  ::highlight(kind-search-current) {
    background-color: var(--kind-color-warning);
    color: var(--kind-color-on-warning);
  }
  @media (forced-colors: active) {
    ::highlight(kind-search) {
      background-color: Mark;
      color: MarkText;
    }
    ::highlight(kind-search-current) {
      background-color: Highlight;
      color: HighlightText;
    }
  }
}`;

let sheet: CSSStyleSheet | undefined;

function adoptStyles(): void {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLES);
  }
  if (!document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }
}

let owner: object | undefined;

/**
 * Paints `rows` with the CSS Custom Highlight API (spec §2 "Conversation search highlights"): `kind-search` for every
 * match and `kind-search-current` for the current one, over the rendered text nodes, writing no DOM. `by` names the
 * search that paints, so one search's `clear` leaves another's paint alone. A browser without the API paints nothing.
 */
export function paintMatches(by: object, rows: readonly PaintedRow[]): void {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  adoptStyles();
  const all = new Highlight();
  const current = new Highlight();
  current.priority = 1;
  for (const { row, text, matches } of rows) {
    const spans = spansOf(row, text);
    for (const match of matches) {
      const from = spanAt(spans, match.start, false);
      const to = spanAt(spans, match.end, true);
      if (!from || !to) continue;
      const range = row.ownerDocument.createRange();
      range.setStart(from.node, match.start - from.start);
      range.setEnd(to.node, match.end - to.start);
      all.add(range);
      if (match.current) current.add(range);
    }
  }
  owner = by;
  CSS.highlights.set("kind-search", all);
  CSS.highlights.set("kind-search-current", current);
}

/** Removes the paint `by` left, if it's still the last search that painted. */
export function clearMatches(by: object): void {
  if (owner !== by || typeof CSS === "undefined" || !("highlights" in CSS)) return;
  owner = undefined;
  CSS.highlights.delete("kind-search");
  CSS.highlights.delete("kind-search-current");
}
