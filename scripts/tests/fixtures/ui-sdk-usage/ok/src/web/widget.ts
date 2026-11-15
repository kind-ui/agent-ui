import { widgetPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";

export const widget = createParts(widgetPrimitive, { root: "kind-widget" });
