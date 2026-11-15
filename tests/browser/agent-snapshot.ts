import { expect, type Page } from "@playwright/test";

type Snapshot = { label?: string; actions: string[] }[];

export async function expectAgentActions(page: Page, label: string, actions: string[]): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate((name) => {
        const agent = (window as unknown as { agent?: { snapshot(): Snapshot } }).agent;
        const entry = agent?.snapshot().find((component) => component.label === name);
        return entry ? [...entry.actions].sort() : null;
      }, label),
    )
    .toEqual([...actions].sort());
}
