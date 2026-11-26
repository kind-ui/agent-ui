<!--
  Calls `onAlwaysAllow`, which approves and asks the host to remember. Reads the `alwaysLabel` and `alwaysTarget`
  unless you pass children. Rendered only while `onAlwaysAllow` is set and `risk` isn't `"danger"`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import WithCode from "./WithCode.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Always> = $props();
</script>

<parts.Always {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<!-- The mark shows only while the button's call is pending (controls.css). --><span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span
      ><WithCode text={state.label} />{/if}{/snippet}</parts.Always>
