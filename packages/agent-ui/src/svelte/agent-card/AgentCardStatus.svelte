<!-- The status mark and its words, like "Working", unless you pass children. Rendered only with a `status`. -->
<script lang="ts">
  import type { AgentCardStatusState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Status> = $props();
</script>

{#snippet mark({ label }: AgentCardStatusState)}<parts.StatusIcon />{label}{/snippet}

<parts.Status {...props} children={children ?? mark} />
