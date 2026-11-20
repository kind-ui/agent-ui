import { createParts } from "@ui-sdk/vue/primitive";
import { h } from "vue";
import { widgetPrimitive } from "../../core/widget/widget.js";
import { Widget as ReactWidget } from "../react/widget.js";

export const Widget = createParts(widgetPrimitive, { root: "div" });
export const Row = () => h("div", { onKeydown: () => undefined });
export { ReactWidget };
