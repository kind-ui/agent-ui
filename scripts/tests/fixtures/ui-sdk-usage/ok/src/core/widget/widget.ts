import { definePrimitive } from "@ui-sdk/core";

export const widgetPrimitive = definePrimitive({ name: "kind-widget" });
export const follow = (stick: { scrollToBottom(): void }) => stick.scrollToBottom();
