import { typingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(typingIndicatorPrimitive, {
  root: "span",
  label: "span",
  dots: "span",
  dot: "span",
});

export { default as TypingIndicator } from "./TypingIndicator.svelte";
