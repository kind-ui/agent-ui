import type { CheckpointOptions, CheckpointRestoreDetails } from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";

export type Restore = { source: string; scope: string; resolve(): void; reject(): void };

/** The `scoped` variant's options: three scopes, what each loses, and Compare. */
export const SCOPED = {
  description: "Before \u201cSwitch to the session table\u201d, 4 min ago.",
  scopes: ["both", "code", "conversation"],
  changes: { files: 3, additions: 12, deletions: 40 },
  laterMessages: 4,
  unrestorableMessages: 2,
} satisfies CheckpointOptions;

export function checkpointHost() {
  const restores: Restore[] = [];
  const compares: string[] = [];
  const host = { restores, compares, permit: false };
  const restore = (details: CheckpointRestoreDetails) =>
    new Promise<void>((resolve, reject) =>
      restores.push({ source: details.source, scope: details.scope, resolve, reject }),
    );
  const compare = (details: ActionDetails) => {
    compares.push(details.source);
  };
  return { host, restore, compare };
}
