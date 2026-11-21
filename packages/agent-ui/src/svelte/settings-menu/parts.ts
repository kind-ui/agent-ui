import { settingsMenuPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(settingsMenuPrimitive, { root: "div", trigger: "span", content: "div" });
