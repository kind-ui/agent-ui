import { daySeparatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(daySeparatorPrimitive, { root: "div", label: "time" });
