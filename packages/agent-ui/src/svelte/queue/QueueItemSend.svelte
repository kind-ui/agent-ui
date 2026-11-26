<!-- Sends a queued item now, shown while `onSend` is set: "Send now" unless you pass children. Pointer only: Mod+Enter on the item sends it too. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemSend> = $props();
</script>

<parts.ItemSend {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}Send now<span
        data-kind-pending-mark=""
        data-status-mark=""
        data-status="running"
        aria-hidden="true"
      ></span>{/if}{/snippet}</parts.ItemSend>
