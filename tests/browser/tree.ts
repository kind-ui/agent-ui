import type { Page } from "@playwright/test";
import { settled } from "./agent-conformance.js";

/**
 * The page's body as lines a diff reads (plan D6): element names with custom element wrappers dropped, `role`,
 * every `aria-*` and `data-*` attribute, `hidden`, `inert`, `disabled`, sorted classes and text, adjacent text nodes
 * joined. Whitespace at a text node's ends counts only where it renders, so a space between inline siblings that one
 * layer shows and another collapses is a difference, and template whitespace that collapses isn't. Ids are compared by reference: each becomes `#<n>` in document order, and so does any attribute value that
 * names one. Inline styles, `tabindex`, scripts, the announcer region and the fixture root's mount markers are left
 * out.
 */
export function normalizedTree(page: Page, omit: readonly Omitted[] = []): Promise<string[]> {
  return page.evaluate((omit) => {
    const skip = "script, style, template, vite-error-overlay, [data-ui-sdk-announcer]";
    const kept = /^(role|aria-.+|data-.+|class|hidden|inert|disabled|id)$/;
    const ids = new Map<string, string>();
    for (const el of document.body.querySelectorAll("[id]"))
      if (!el.closest(skip) && el.id !== "root") ids.set(el.id, `#${ids.size}`);
    const reference = (value: string) =>
      value
        .split(/\s+/)
        .map((token) => ids.get(token) ?? token)
        .join(" ");
    const lines: string[] = [];
    const range = document.createRange();
    const shows = (node: Text, start: number, end: number) => {
      range.setStart(node, start);
      range.setEnd(node, end);
      return [...range.getClientRects()].some((rect) => rect.width > 0);
    };
    // A text node's text with its leading and trailing whitespace kept as one space only where it renders. Text
    // that doesn't render (hidden, in a closed popup) keeps its whitespace and is trimmed as a run.
    let shown = false;
    const boxed = (node: Text) => {
      let el = node.parentElement;
      while (el && getComputedStyle(el).display === "contents") el = el.parentElement;
      return el?.checkVisibility() ?? false;
    };
    // Whitespace beside another text node is inside a run, so it always reads as a space: a layer that splits a
    // run into nodes may put it at a line wrap, where it takes no width.
    const besideText = (node: Node, side: "previousSibling" | "nextSibling") => {
      let next = node[side];
      while (next?.nodeType === Node.COMMENT_NODE) next = next[side];
      return next?.nodeType === Node.TEXT_NODE;
    };
    const rendered = (node: Text) => {
      const value = node.data;
      if (!boxed(node)) return value;
      shown = true;
      const lead = /^\s*/.exec(value)?.[0].length ?? 0;
      const trail = /\s*$/.exec(value)?.[0].length ?? 0;
      const end = Math.max(lead, value.length - trail);
      const before = lead > 0 && (besideText(node, "previousSibling") || shows(node, 0, lead));
      if (lead === value.length) return before || besideText(node, "nextSibling") ? " " : "";
      const after = trail > 0 && (besideText(node, "nextSibling") || shows(node, end, value.length));
      return `${before ? " " : ""}${value.slice(lead, end)}${after ? " " : ""}`;
    };
    // Text nodes with no element line between them read as one, since layers split text differently: React
    // renders `Pressed {n}` as two nodes, Svelte as one.
    let text = "";
    const flush = (depth: number) => {
      const joined = shown ? text.replace(/\s+/g, " ") : text.replace(/\s+/g, " ").trim();
      if (joined) lines.push(`${"  ".repeat(depth)}"${joined}"`);
      text = "";
      shown = false;
    };
    const walk = (node: Node, depth: number) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += rendered(child as Text);
          continue;
        }
        if (!(child instanceof Element) || child.matches(skip)) continue;
        const name = child.localName;
        if (name.includes("-")) {
          walk(child, depth);
          continue;
        }
        flush(depth);
        const attributes = [...child.attributes]
          .filter(
            (attribute) =>
              kept.test(attribute.name) &&
              !["data-ssr", "data-v-app"].includes(attribute.name) &&
              !omit.some(
                ({ selector, attributes }) => attributes.includes(attribute.name) && child.matches(selector),
              ),
          )
          .map(({ name: key, value }) =>
            key === "class"
              ? `class="${value.split(/\s+/).filter(Boolean).sort().join(" ")}"`
              : `${key}="${reference(value)}"`,
          )
          .sort();
        lines.push(`${"  ".repeat(depth)}<${[name, ...attributes].join(" ")}>`);
        walk(child, depth + 1);
        flush(depth + 1);
      }
    };
    walk(document.body, 0);
    flush(0);
    return lines;
  }, omit);
}

/** Attributes left out of a tree on the elements `selector` matches. */
export type Omitted = { selector: string; attributes: readonly string[] };

/** The tree once animations have settled and two reads a frame apart agree. */
export async function stableTree(page: Page, omit: readonly Omitted[] = []) {
  await settled(page);
  let previous = await normalizedTree(page, omit);
  for (let tries = 0; tries < 20; tries++) {
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const next = await normalizedTree(page, omit);
    if (JSON.stringify(next) === JSON.stringify(previous)) return next;
    previous = next;
  }
  return previous;
}
