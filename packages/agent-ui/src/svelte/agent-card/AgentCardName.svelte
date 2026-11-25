<!-- The agent's name, a link with an `href`, unless you pass children. -->
<script lang="ts">
  import type { AgentCardNameState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Name> = $props();
</script>

{#snippet name({ name, href }: AgentCardNameState)}{#if href}<a {href}>{name}</a>{:else}{name}{/if}{/snippet}

<parts.Name {...props} children={children ?? name} />
