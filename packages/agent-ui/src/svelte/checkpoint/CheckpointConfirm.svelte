<!-- Calls `onRestore`. Reads "Restore", with a running mark while the restore is pending, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Confirm> = $props();
</script>

{#if children}
  <parts.Confirm {...props} {children} />
{:else}
  <!-- The mark shows only while the restore is pending (controls.css). -->
  <parts.Confirm {...props}
    ><span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span
    >Restore</parts.Confirm
  >
{/if}
