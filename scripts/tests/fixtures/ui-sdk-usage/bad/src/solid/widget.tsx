import { widgetPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/solid/primitive";

export const Widget = createParts(widgetPrimitive, { root: "div" });
export const rowProps = { tabIndex: 0 };
export const fieldProps = { onFocusIn: () => undefined };
