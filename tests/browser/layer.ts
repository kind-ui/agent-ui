import type { TestInfo } from "@playwright/test";

export type Layer = "react" | "web" | "vue" | "svelte" | "solid";

/** The render layer a project runs, from its name: `wave-2-web`, `wave-1-vue-firefox`, `wave-1-react-strict`, `root-svelte`, … */
export function layerOf(testInfo: TestInfo): Layer {
  const layer = /^(?:wave-\d+|root)-(react|web|vue|svelte|solid)(?:-|$)/.exec(testInfo.project.name)?.[1];
  if (!layer) throw new Error(`no layer in project name "${testInfo.project.name}"`);
  return layer as Layer;
}

/** Whether the page renders Web Components markup: `kind-*` custom elements with attributes for options. */
export const isWebElements = (testInfo: TestInfo): boolean => layerOf(testInfo) === "web";
