import { attachmentsPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(attachmentsPrimitive, { root: "ul", item: "li", remove: "span" });
