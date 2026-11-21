import type { TestInfo } from "@playwright/test";
import { layerOf } from "./layer.js";

// framework-svelte-8: conformance. `@ui-sdk/svelte` 0.1.0-beta.1 keys a root part by the host's `id`, which unnames a
// component the agent bridge names by its root (AGENTS.md "Svelte chat core"). Every check that needs that name skips
// through `rootIdGap`; delete this file and its callers together once UI SDK fixes it.
export const ROOT_ID_GAP = "@ui-sdk/svelte keys a root by its id";

export const rootIdGap = (testInfo: TestInfo): boolean => layerOf(testInfo) === "svelte";
