import { loaderPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(loaderPrimitive, { root: "span", label: "span", dots: "span", dot: "span" });

export { default as Loader } from "./Loader.svelte";
