import { widgetPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";

export const Widget = createParts(widgetPrimitive, { root: "div" });
