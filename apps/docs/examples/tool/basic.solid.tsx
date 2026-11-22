import { fromUIMessagePart } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { createSignal, For } from "solid-js";
import { Tool } from "@/components/ui/solid/tool";

const parts = [
  {
    type: "tool-search_docs",
    toolCallId: "call_1",
    state: "output-available",
    input: { query: "retry with backoff" },
    output: { hits: 3, top: "guides/retries.md" },
  },
  {
    type: "tool-run_tests",
    toolCallId: "call_2",
    state: "input-available",
    input: { filter: "client" },
  },
  {
    type: "tool-delete_branch",
    toolCallId: "call_3",
    state: "approval-requested",
    input: { branch: "old-retry" },
    approval: { id: "approval_1" },
  },
  {
    type: "tool-fetch_url",
    toolCallId: "call_4",
    state: "output-error",
    input: { url: "https://example.com/status" },
    errorText: "Request timed out after 30 s.",
  },
] as const;

// How long each finished call took, which the host knows from its own timing.
const durations: Record<string, number> = { call_1: 1.2, call_4: 30 };

export default function ToolExample() {
  const [approved, setApproved] = createSignal<boolean>();
  const steps = () =>
    parts.flatMap((part, index) => {
      const answer = approved();
      const answered =
        part.state === "approval-requested" && answer !== undefined
          ? {
              ...part,
              state: "approval-responded" as const,
              approval: { id: part.approval.id, approved: answer },
            }
          : part;
      const mapped = fromUIMessagePart(answered, { messageId: "message_1", index });
      if (mapped?.type !== "step" || mapped.step.kind !== "tool") return [];
      return [{ step: mapped.step, durationSeconds: durations[part.toolCallId] }];
    });
  return (
    <div class="flex flex-col gap-1">
      <For each={steps()} keyed={(entry) => entry.step.id}>
        {(entry) => (
          <Tool
            call={entry().step.call}
            error={entry().step.error}
            durationSeconds={entry().durationSeconds}
            onApprove={() => setApproved(true)}
            onDeny={() => setApproved(false)}
          />
        )}
      </For>
    </div>
  );
}
