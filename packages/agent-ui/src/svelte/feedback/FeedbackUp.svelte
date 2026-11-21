<!-- "Good response": a Toggle whose value is `"up"`. -->
<script lang="ts">
  import { Toggle, ToggleIcon, type ToggleState } from "@ui-sdk/svelte/toggle";
  import type { ComponentProps } from "svelte";

  let { children: custom, ...props }: ComponentProps<typeof Toggle> & { value?: never } = $props();
</script>

<Toggle
  value="up"
  aria-label="Good response"
  data-kind-icon-button=""
  data-kind-size="sm"
  {...props}
>
  {#snippet children(state)}
    {#if custom}{@render custom(state)}{:else}<ToggleIcon data-feedback-icon="up" />{/if}
  {/snippet}
</Toggle>
