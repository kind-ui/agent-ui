import type { Page } from "@playwright/test";
import { settled } from "./agent-conformance.js";

/**
 * The page's body as lines a diff reads (plan D6): element names with custom element wrappers dropped, `role`,
 * every `aria-*` and `data-*` attribute, `hidden`, `inert`, `disabled`, sorted classes and text. Ids are compared by
 * reference: each becomes `#<n>` in document order, and so does any attribute value that names one. Inline styles,
 * `tabindex`, scripts, the announcer region and the fixture root's mount markers are left out.
 */
export function normalizedTree(page: Page): Promise<string[]> {
  return page.evaluate(() => {
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
    const walk = (node: Node, depth: number) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.replace(/\s+/g, " ").trim();
          if (text) lines.push(`${"  ".repeat(depth)}"${text}"`);
          continue;
        }
        if (!(child instanceof Element) || child.matches(skip)) continue;
        const name = child.localName;
        if (name.includes("-")) {
          walk(child, depth);
          continue;
        }
        const attributes = [...child.attributes]
          .filter(
            (attribute) => kept.test(attribute.name) && !["data-ssr", "data-v-app"].includes(attribute.name),
          )
          .map(({ name: key, value }) =>
            key === "class"
              ? `class="${value.split(/\s+/).filter(Boolean).sort().join(" ")}"`
              : `${key}="${reference(value)}"`,
          )
          .sort();
        lines.push(`${"  ".repeat(depth)}<${[name, ...attributes].join(" ")}>`);
        walk(child, depth + 1);
      }
    };
    walk(document.body, 0);
    return lines;
  });
}

/** The tree once animations have settled and two reads a frame apart agree. */
export async function stableTree(page: Page) {
  await settled(page);
  let previous = await normalizedTree(page);
  for (let tries = 0; tries < 20; tries++) {
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const next = await normalizedTree(page);
    if (JSON.stringify(next) === JSON.stringify(previous)) return next;
    previous = next;
  }
  return previous;
}
