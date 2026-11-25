<!--
  Calls `onAlwaysAllow`, which approves and tells the host to remember. Reads the `alwaysLabel` unless you pass
  children. Rendered only while `onAlwaysAllow` is set.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Always> = $props();
</script>

<parts.Always {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<!-- The mark shows only while the button's call is pending (controls.css). --><span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span
      >{state.label}{/if}{/snippet}</parts.Always>
