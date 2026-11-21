import type { TestInfo } from "@playwright/test";
import { manifests } from "../../registry/layers/index.mjs";

export type Layer = "react" | "web" | "vue" | "svelte" | "solid";

/** The render layer a project runs, from its name: `wave-2-web`, `wave-1-vue-firefox`, `wave-1-react-strict`, `root-svelte`, … */
export function layerOf(testInfo: TestInfo): Layer {
  const layer = /^(?:wave-\d+|root)-(react|web|vue|svelte|solid)(?:-|$)/.exec(testInfo.project.name)?.[1];
  if (!layer) throw new Error(`no layer in project name "${testInfo.project.name}"`);
  return layer as Layer;
}

/** Whether the page renders Web Components markup: `kind-*` custom elements with attributes for options. */
export const isWebElements = (testInfo: TestInfo): boolean => layerOf(testInfo) === "web";

/** Whether the project's layer renders `component`: React and Web render every one, the others those their manifest lists. */
export function layerHas(testInfo: TestInfo, component: string): boolean {
  const manifest = (manifests as Record<string, { components: string[] }>)[layerOf(testInfo)];
  return !manifest || manifest.components.includes(component);
}
