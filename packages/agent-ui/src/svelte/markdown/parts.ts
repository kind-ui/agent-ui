import { markdownViewPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(markdownViewPrimitive, { root: "div" });
