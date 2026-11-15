import type { AttachmentItem } from "@kind-ui/agent-ui/core";

export const steps = [
  { id: "logs", title: "Read the logs", body: "Three timeouts in the last hour.", open: false },
  { id: "docs", title: "Search the docs", body: "The client retries twice by default.", open: true },
];

export const question = "How should the client handle a flaky upstream?";

export const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];

export const filler = Array.from({ length: 12 }, (_, index) => `Earlier note ${index + 1}.`);

export const files: AttachmentItem[] = [
  { id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" },
  { id: "trace", name: "trace.log", size: 4096, mediaType: "text/plain" },
];

export function agentHost() {
  const host = {
    permit: true,
    refuse: false,
    changes: [] as string[],
    calls: [] as string[],
    change: (component: string, details: { source: string; cancel: () => void }): boolean => {
      host.changes.push(`${component}:${details.source}`);
      if (host.refuse) details.cancel();
      return !host.refuse;
    },
    submit: (draft: { text: string }) => {
      host.calls.push(`submit:${draft.text}`);
      return new Promise<void>(() => {});
    },
  };
  Object.assign(window, { kindAgent: host });
  return host;
}
