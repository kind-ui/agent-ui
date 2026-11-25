<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import { AgentCard } from "../../../../src/svelte/agent-card/index.js";
  import { agentCardHost, minimal, planner, reviewer } from "../../shared/agent-card.js";
  import { expose } from "../../shared/expose.js";

  const host = agentCardHost();
  expose({ kindHost: host });
</script>

<div class="flex w-[28rem] flex-col gap-3 p-6"
  ><section id="planner"
    ><AgentCard
      agent={planner}
      status="running"
      href="https://example.com/agents/planner"
      onAction={host.record}
    /></section
  ><section id="reviewer"
    ><AgentCard agent={reviewer} status="complete" level={2} actionLabel="Start" onAction={host.record} /></section
  ><section id="minimal"><AgentCard agent={minimal} href="data:text/html,Scout" /></section
></div>
