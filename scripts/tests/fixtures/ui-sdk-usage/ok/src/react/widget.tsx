import { widgetPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";

export const Widget = createParts(widgetPrimitive, { root: "div" });
