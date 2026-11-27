<!-- The `heading`, the `label`, the call's `title` or the tool's name as words, with code as `code`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import WithCode from "../confirmation/WithCode.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

<parts.Title {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<WithCode text={state.title}
    />{/if}{/snippet}</parts.Title>
