<!-- The `alwaysDetail`, unless you pass children. Rendered under the choices while Always allow shows. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import WithCode from "./WithCode.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Detail> = $props();
</script>

<parts.Detail {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<WithCode
        text={state.text}
      />{/if}{/snippet}</parts.Detail>
