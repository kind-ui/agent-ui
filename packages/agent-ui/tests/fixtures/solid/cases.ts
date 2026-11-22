import type { JSX } from "@solidjs/web";
import type { AgentAction } from "@ui-sdk/solid/agent";

export type CaseModule = {
  cases: Record<string, (params: URLSearchParams) => JSX.Element>;
  allow?: (step: AgentAction) => boolean;
};

const modules = import.meta.glob<CaseModule>("./cases/*.tsx");

export const casePath = (name: string) => (modules[`./cases/${name}.tsx`] ? `/cases/${name}.tsx` : undefined);

export async function loadCase(name: string, variant: string) {
  const fixture = await modules[`./cases/${name}.tsx`]?.();
  const render = fixture?.cases[variant];
  return fixture && render ? { ...fixture, render } : undefined;
}

export const noCase = "<p data-no-case>No case</p>";
