"use client";

import type { StepGroupItem, ToolCall } from "@kind-ui/agent-ui";
import { useState } from "react";
import { StepGroup } from "@/components/ui/step-group";
import { Tool } from "@/components/ui/tool";

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
  const [done, setDone] = useState(1);
  const items: StepGroupItem[] = steps.map((step, index) => ({
    ...step,
    status: index < done ? "complete" : index === done ? "running" : "pending",
  }));
  return (
    <div className="flex flex-col items-start gap-3">
      <StepGroup items={items} kinds={kinds} durationSeconds={done === steps.length ? 41 : undefined}>
        {items.map((item, index) => {
          const kind = kinds[steps[index].kind];
          const call: ToolCall = {
            toolCallId: item.id,
            name: steps[index].name,
            title: `${item.status === "complete" ? kind.done : kind.live} \`${item.target}\``,
            dynamic: false,
            input: { state: "ready", value: { target: item.target } },
            ...(item.status === "complete" && { output: { state: "available", value: "Done" } }),
          };
          return item.status === "pending" ? null : (
            <Tool key={item.id} call={call} status={item.status} autoOpen="never" />
          );
        })}
      </StepGroup>
      <button
        type="button"
        data-kind-button="secondary"
        onClick={() => setDone((n) => (n === steps.length ? 1 : n + 1))}
      >
        {done === steps.length ? "Start again" : "Finish a step"}
      </button>
    </div>
  );
}
