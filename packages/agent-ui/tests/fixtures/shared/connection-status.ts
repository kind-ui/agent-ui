import type { ConnectionState } from "@kind-ui/agent-ui/core";

export const messages = [
  { id: "m0", text: "Can you summarize the open pull requests?" },
  { id: "m1", text: "There are three: two fix flaky tests and one adds a docs page." },
  { id: "m2", text: "Which one should I review first?" },
  { id: "m3", text: "The docs page, since the other two wait on CI." },
];

export type ConnectionHost = {
  retries: number;
  /** Settles the pending retry. */
  resolve(): void;
  set(state: ConnectionState, options?: { retryAt?: string; resuming?: boolean }): void;
};

/** Counts each retry and keeps it pending until `resolve`. */
export function connectionHost() {
  let settle = () => {};
  const host = {
    retries: 0,
    resolve: () => settle(),
  };
  const retried = () => {
    host.retries++;
    return new Promise<void>((resolve) => {
      settle = resolve;
    });
  };
  return { host, retried };
}
