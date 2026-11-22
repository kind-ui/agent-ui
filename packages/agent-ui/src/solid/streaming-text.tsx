import { streamingTextPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For } from "solid-js";

const parts = createParts(streamingTextPrimitive, { root: "span", chunk: "span", caret: "span" });

export type StreamingTextProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/** Streamed plain text: each appended chunk fades in, and `caret` shows a caret after it. */
export function StreamingText(props: StreamingTextProps) {
  return (
    <parts.Root {...props}>
      {(state) => (
        <>
          <For each={state.chunks} keyed={(chunk) => chunk.id}>
            {(chunk) => <parts.Chunk value={chunk().id}>{chunk().text}</parts.Chunk>}
          </For>
          <parts.Caret />
        </>
      )}
    </parts.Root>
  );
}
