import type { PlanItem, QueueItem, TaskItem, ToolCall } from "@kind-ui/agent-ui";
import type { AttachmentItem, ChainOfThoughtStep, UploadItem } from "@kind-ui/agent-ui/core";
import { uploadHost } from "./uploader.js";

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

export const thoughts = "The upstream times out under load, so **retrying** with backoff should help.";

export const toolCalls: ToolCall[] = ["search_docs", "read_file"].map((name) => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { query: name === "search_docs" ? "retry policy" : "client.ts" } },
  output: { state: "available", value: { matches: name === "search_docs" ? 3 : 1 } },
}));

export const approvalCall: ToolCall = {
  toolCallId: "delete_file",
  name: "delete_file",
  dynamic: false,
  input: { state: "ready", value: { path: "notes.md" } },
  approval: { approvalId: "delete", generation: 1, state: "requested" },
};

export const chainSteps: ChainOfThoughtStep[] = [
  { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
  { id: "search", status: "complete", title: "Search the docs", durationSeconds: 3 },
];

export const taskItems: TaskItem[] = [
  { id: "read", status: "complete", title: "Read the client" },
  { id: "patch", status: "running", title: "Add the backoff" },
  { id: "test", status: "pending", title: "Run the tests" },
];

export const planItems: PlanItem[] = [
  { id: "audit", status: "pending", title: "Audit the retries" },
  { id: "cap", status: "pending", title: "Cap the attempts" },
];

export const queueItems: QueueItem[] = [
  { id: "a", status: "pending", title: "Write the migration" },
  { id: "b", status: "pending", title: "Update the docs" },
  { id: "c", status: "pending", title: "Run the tests" },
];

export const moveItem = (items: readonly QueueItem[], id: string, index: number): QueueItem[] => {
  const rest = items.filter((item) => item.id !== id);
  rest.splice(index, 0, items.find((item) => item.id === id) as QueueItem);
  return rest;
};

export function agentHost() {
  let release = () => {};
  const host = {
    permit: true,
    refuse: false,
    hold: false,
    confirm: (_on: boolean) => {},
    changes: [] as string[],
    calls: [] as string[],
    sources: [] as string[],
    change: (component: string, details: { source: string; cancel: () => void }): boolean => {
      host.changes.push(`${component}:${details.source}`);
      if (host.refuse) details.cancel();
      return !host.refuse;
    },
    decide:
      (name: string) =>
      (...args: unknown[]): Promise<void> => {
        const details = args.at(-1) as { source?: string } | undefined;
        host.calls.push(name);
        if (details?.source) host.sources.push(`${name}:${details.source}`);
        return Promise.resolve();
      },
    submit: (draft: { text: string }) => {
      host.calls.push(`submit:${draft.text}`);
      return host.hold ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve();
    },
    stop: () => {
      host.calls.push("stop");
      release();
    },
    uploads: (update: (change: (items: readonly UploadItem[]) => UploadItem[]) => void) => {
      const { onCancel, onRetry } = uploadHost(update);
      return {
        onCancel: (id: string) => {
          host.calls.push(`cancel:${id}`);
          onCancel(id);
        },
        onRetry: (id: string) => {
          host.calls.push(`retry:${id}`);
          onRetry(id);
        },
      };
    },
  };
  Object.assign(window, { kindAgent: host });
  return host;
}
