import type { ActionDetails } from "@ui-sdk/core";

export type Restore = { source: string; resolve(): void; reject(): void };

export function checkpointHost() {
  const restores: Restore[] = [];
  const host = { restores, permit: false };
  const restore = (details: ActionDetails) =>
    new Promise<void>((resolve, reject) => restores.push({ source: details.source, resolve, reject }));
  return { host, restore };
}
