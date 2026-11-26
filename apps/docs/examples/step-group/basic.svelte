<script lang="ts">
  import type { StepGroupItem, ToolCall } from "@kind-ui/agent-ui";
  import { StepGroup } from "@/components/ui/svelte/step-group/index.js";
  import { Tool } from "@/components/ui/svelte/tool/index.js";

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

  let done = $state(1);
  const statusOf = (index: number) => (index < done ? "complete" : index === done ? "running" : "pending");
  const items: StepGroupItem[] = $derived(steps.map((step, index) => ({ ...step, status: statusOf(index) })));

  const callOf = (step: (typeof steps)[number], status: string): ToolCall => {
    const kind = kinds[step.kind];
    return {
      toolCallId: step.id,
      name: step.name,
      title: `${status === "complete" ? kind.done : kind.live} \`${step.target}\``,
      dynamic: false,
      input: { state: "ready", value: { target: step.target } },
      ...(status === "complete" && { output: { state: "available", value: "Done" } }),
    };
  };
</script>

<div class="flex flex-col items-start gap-3">
  <StepGroup {items} {kinds} durationSeconds={done === steps.length ? 41 : undefined}>
    {#each steps as step, index (step.id)}
      {@const status = statusOf(index)}
      {#if status !== "pending"}
        <Tool call={callOf(step, status)} {status} autoOpen="never" />
      {/if}
    {/each}
  </StepGroup>
  <button
    type="button"
    data-kind-button="secondary"
    onclick={() => (done = done === steps.length ? 1 : done + 1)}
  >
    {done === steps.length ? "Start again" : "Finish a step"}
  </button>
</div>
