<script lang="ts">
  import type { StepGroupItem } from "@kind-ui/agent-ui";
  import { StepGroup } from "@/components/ui/svelte/step-group/index.js";
  import { Subagent } from "@/components/ui/svelte/subagent/index.js";

  const kinds = { agent: { live: "Running", done: "Ran", one: "agent", many: "agents" } };

  const agents = [
    { id: "reviewer", name: "Code reviewer", status: "complete" },
    { id: "writer", name: "Test writer", status: "running" },
    { id: "docs", name: "Docs updater", status: "pending" },
  ] as const;

  const items: StepGroupItem[] = agents.map(({ id, status }) => ({ id, status, kind: "agent" }));
</script>

<StepGroup {items} {kinds}>
  {#each agents as agent (agent.id)}
    <Subagent agentName={agent.name} status={agent.status} autoOpen="never" />
  {/each}
</StepGroup>
