import { type StreamingTextChunk, streamingTextPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";

/**
 * `<kind-streaming-text>` renders its `text` property (or attribute) as chunks, each appended one fading in.
 * `caret` shows a caret after it.
 */
export function defineStreamingText(): void {
  if (customElements.get("kind-streaming-text")) return;
  createParts(streamingTextPrimitive, {
    root: {
      tag: "kind-streaming-text",
      render: (el, instance) => {
        const caret =
          el.querySelector("kind-streaming-text-caret") ??
          document.createElement("kind-streaming-text-caret");
        // Text written as children before upgrade is redrawn as chunks.
        for (const node of [...el.childNodes]) if (node.nodeType === Node.TEXT_NODE) node.remove();
        let drawn: readonly StreamingTextChunk[] = [];
        const draw = () => {
          const { chunks } = instance.get();
          if (chunks === drawn) return;
          const ids = new Set(chunks.map((chunk) => String(chunk.id)));
          const parts = new Map<string, Element>();
          for (const child of [...el.children]) {
            if (child === caret) continue;
            const value = child.getAttribute("value") ?? "";
            if (ids.has(value)) parts.set(value, child);
            else child.remove();
          }
          if (caret.parentNode !== el) el.append(caret);
          for (const chunk of chunks) {
            let part = parts.get(String(chunk.id));
            if (!part) {
              part = document.createElement("kind-streaming-text-chunk");
              part.setAttribute("value", String(chunk.id));
              el.insertBefore(part, caret);
            }
            if (part.textContent !== chunk.text) part.textContent = chunk.text;
          }
          drawn = chunks;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    chunk: "kind-streaming-text-chunk",
    caret: "kind-streaming-text-caret",
  });
}
