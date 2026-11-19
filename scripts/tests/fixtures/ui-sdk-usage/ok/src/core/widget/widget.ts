import { definePrimitive } from "@ui-sdk/core";

export const widgetPrimitive = definePrimitive({ name: "kind-widget" });
export const follow = (stick: { scrollToBottom(): void }) => stick.scrollToBottom();
export const item = (roving: { tabIndex(): "0" | "-1" }) => ({ tabindex: roving.tabIndex() });
const slot = <T>(definition: T) => definition;
export const scroller = slot({ focus: "tab-stop", attrs: () => ({ tabindex: "0" }) });
const createInputController = () => ({ focus() {} });
const controller = createInputController();
export const focusField = () => controller.focus();
