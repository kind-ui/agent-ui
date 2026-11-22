import { streamingTextPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(streamingTextPrimitive, { root: "span", chunk: "span", caret: "span" });

export { default as StreamingText } from "./StreamingText.svelte";
