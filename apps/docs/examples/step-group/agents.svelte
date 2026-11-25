<script lang="ts">
  import type { StepStatus } from "@kind-ui/agent-ui";
  import { StepGroup } from "@/components/ui/svelte/step-group/index.js";
  import { Subagent } from "@/components/ui/svelte/subagent/index.js";

  let rows: { id: string; name: string; status: StepStatus }[] = $state([
    { id: "reviewer", name: "Code reviewer", status: "running" },
    { id: "writer", name: "Docs writer", status: "running" },
    { id: "tester", name: "Test runner", status: "complete" },
  ]);
</script>

<StepGroup
  items={rows.map(({ id, status }) => ({ id, status, group: "agent" }))}
  groupLabels={{ agent: (count: number) => `${count} agents` }}
  onCancel={() => {
    rows = rows.map((row) => (row.status === "running" ? { ...row, status: "cancelled" } : row));
  }}
>
  {#each rows as row (row.id)}
    <Subagent agentName={row.name} status={row.status} agentConfirm={false} />
  {/each}
</StepGroup>
