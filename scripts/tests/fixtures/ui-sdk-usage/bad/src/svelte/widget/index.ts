import { widgetPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const Widget = createParts(widgetPrimitive, { root: "div" });
