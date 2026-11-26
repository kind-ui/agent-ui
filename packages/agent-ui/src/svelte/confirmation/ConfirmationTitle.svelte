<!-- The `label`, unless you pass children. Rendered only while `label` is set, and hidden inside a Tool. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import WithCode from "./WithCode.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

<parts.Title {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<WithCode text={state.label} />{/if}{/snippet}</parts.Title>
