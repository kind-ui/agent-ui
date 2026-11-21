import type { AgentAction } from "@ui-sdk/svelte/agent";
import type { Component } from "svelte";

export type CaseModule = {
  default: Component<{ variant: string; params: URLSearchParams }>;
  variants: readonly string[];
  allow?: (step: AgentAction) => boolean;
};

const modules = import.meta.glob<CaseModule>("./cases/*.svelte");

export const casePath = (name: string) =>
  modules[`./cases/${name}.svelte`] ? `/cases/${name}.svelte` : undefined;

export async function loadCase(name: string, variant: string) {
  const fixture = await modules[`./cases/${name}.svelte`]?.();
  return fixture?.variants.includes(variant) ? fixture : undefined;
}

export const noCase = "<p data-no-case>No case</p>";
