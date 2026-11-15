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
        let drawn: readonly StreamingTextChunk[] = [];
        const draw = () => {
          const { chunks } = instance.get();
          if (chunks === drawn) return;
          // Chunks are only ever appended, or replaced all at once by a reset.
          const appended = drawn.length > 0 && chunks[0]?.id === drawn[0]?.id;
          if (!appended) el.replaceChildren(caret);
          for (const chunk of chunks.slice(appended ? drawn.length : 0)) {
            const part = document.createElement("kind-streaming-text-chunk");
            part.setAttribute("value", String(chunk.id));
            part.textContent = chunk.text;
            el.insertBefore(part, caret);
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
