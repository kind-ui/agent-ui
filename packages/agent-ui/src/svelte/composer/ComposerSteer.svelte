<!-- Send while a turn runs: "Steer" or "Queue" by `steerMode`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Steer> = $props();
</script>

<parts.Steer {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.label}<span
        data-kind-pending-mark=""
        data-status-mark=""
        data-status="running"
        aria-hidden="true"
      ></span>{/if}{/snippet}</parts.Steer>
