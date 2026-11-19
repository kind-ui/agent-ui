import type { ConversationRetryDetails, ConversationStatus } from "@kind-ui/agent-ui/core";

export type ConversationStates = {
  set(status: ConversationStatus, count?: number, error?: string): void;
  resolveRetry(): void;
  rejectRetry(): void;
  retries: { reason: string; source: string }[];
};

export function retryRecorder() {
  const retries: ConversationStates["retries"] = [];
  let settle: { resolve(): void; reject(reason: unknown): void } | undefined;
  return {
    retries,
    onRetry: (details: ConversationRetryDetails) => {
      retries.push({ reason: details.reason, source: details.source });
      return new Promise<void>((resolve, reject) => {
        settle = { resolve, reject };
      });
    },
    resolveRetry: () => settle?.resolve(),
    rejectRetry: () => settle?.reject(new Error("still failing")),
  };
}
