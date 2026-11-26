import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import { createMemo, createSignal, For, Show } from "solid-js";
import { StepGroup } from "@/components/ui/solid/step-group";
import { Tool } from "@/components/ui/solid/tool";

// How each kind of step reads, live and done.
const kinds = {
  read: { live: "Reading", done: "Read", one: "file", many: "files" },
  run: { live: "Running", done: "Ran", one: "command", many: "commands" },
};

const steps = [
  { id: "a", kind: "read", target: "sign-in.ts", name: "read_file" },
  { id: "b", kind: "read", target: "session.ts", name: "read_file" },
  { id: "c", kind: "run", target: "npm test", name: "run_command" },
] as const;

export default function StepGroupExample() {
  const [done, setDone] = createSignal(1);
  const items = createMemo(() =>
    steps.map((step, index) => {
      const status: StepStatus = index < done() ? "complete" : index === done() ? "running" : "pending";
      return { ...step, status };
    }),
  );
  return (
    <div class="flex flex-col items-start gap-3">
      <StepGroup items={items()} kinds={kinds} durationSeconds={done() === steps.length ? 41 : undefined}>
        <For each={items()} keyed={(item) => item.id}>
          {(item) => {
            const call = (): ToolCall => {
              const kind = kinds[item().kind];
              return {
                toolCallId: item().id,
                name: item().name,
                title: `${item().status === "complete" ? kind.done : kind.live} \`${item().target}\``,
                dynamic: false,
                input: { state: "ready", value: { target: item().target } },
                ...(item().status === "complete" && { output: { state: "available", value: "Done" } }),
              };
            };
            return (
              <Show when={item().status !== "pending"}>
                <Tool call={call()} status={item().status} autoOpen="never" />
              </Show>
            );
          }}
        </For>
      </StepGroup>
      <button
        type="button"
        data-kind-button="secondary"
        onClick={() => setDone((n) => (n === steps.length ? 1 : n + 1))}
      >
        {done() === steps.length ? "Start again" : "Finish a step"}
      </button>
    </div>
  );
}
