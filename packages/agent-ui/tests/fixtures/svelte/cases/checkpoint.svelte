<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";
  import { checkpointHost } from "../../shared/checkpoint.js";

  export const variants = ["all", "reduced"];

  const { host, restore } = checkpointHost();

  export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script lang="ts">
  import { Checkpoint } from "../../../../src/svelte/checkpoint/index.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let restored = $state(false);

  expose({ kindHost: host, kindCheckpoint: { restore: (next: boolean) => (restored = next) } });
</script>

<div class="flex w-[28rem] flex-col gap-4 p-6">
  <p id="above">Above</p>
  <Checkpoint
    id="checkpoint"
    description="Before editing auth.ts"
    onRestore={restore}
    {restored}
    motion={variant === "reduced" ? "reduced" : undefined}
  />
  <p id="below">Below</p>
</div>
