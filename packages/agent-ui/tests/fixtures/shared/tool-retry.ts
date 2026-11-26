import type { ToolCall } from "@kind-ui/agent-ui";
import type { ToolRetryDetails } from "@kind-ui/agent-ui/core";

/** The page's clock, which the spec installs, and the instant the retrying call counts down to. */
export const RETRY_NOW = "2026-11-25T12:00:00Z";
export const RETRY_AT = "2026-11-25T12:00:04Z";

export type Retried = {
  id: string;
  toolCallId: string | undefined;
  reason: ToolRetryDetails["reason"];
  source: string;
  resolve(): void;
  reject(): void;
};

/** Records each Retry with its deferred promise, which the spec settles. */
export function retryHost() {
  const retries: Retried[] = [];
  const retry =
    (id: string) =>
    (call: ToolCall | undefined, details: ToolRetryDetails): Promise<void> =>
      new Promise((resolve, reject) =>
        retries.push({
          id,
          toolCallId: call?.toolCallId,
          reason: details.reason,
          source: details.source,
          resolve,
          reject,
        }),
      );
  return { retries, retry };
}

const call = (name: string, fields: Partial<ToolCall> = {}): ToolCall => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { query: "steps" } },
  ...fields,
});

/** Two failed calls that retry on their own, and one retrying while it runs. */
export const retryRows = {
  failed: {
    call: call("search_docs", { outcome: "error" }),
    error: { message: "Request timed out after 30 s." },
    defaultOpen: true,
  },
  other: {
    call: call("read_file", { outcome: "error" }),
    error: { message: "File not found." },
    defaultOpen: true,
  },
  retrying: {
    call: call("fetch_url", {
      retry: { attempt: 2, maxAttempts: 5, retryAt: RETRY_AT, reason: "Rate limited" },
    }),
  },
} satisfies Record<string, { call: ToolCall; error?: { message: string }; defaultOpen?: boolean }>;
