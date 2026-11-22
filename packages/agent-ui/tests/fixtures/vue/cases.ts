import type { AgentAction } from "@ui-sdk/vue/agent";
import { type Component, createSSRApp, h, Suspense } from "vue";

export type CaseModule = {
  default: Component<{ variant: string; params: URLSearchParams }>;
  variants: readonly string[];
  allow?: (step: AgentAction) => boolean;
};

const modules = import.meta.glob<CaseModule>("./cases/*.vue");

export const casePath = (name: string) => (modules[`./cases/${name}.vue`] ? `/cases/${name}.vue` : undefined);

export async function loadCase(name: string, variant: string) {
  const fixture = await modules[`./cases/${name}.vue`]?.();
  return fixture?.variants.includes(variant) ? fixture : undefined;
}

export const noCase = "<p data-no-case>No case</p>";

export const hydratedApp = (
  component: CaseModule["default"],
  props: { variant: string; params: URLSearchParams },
) => createSSRApp({ render: () => h(Suspense, null, { default: () => h(component, props) }) });
