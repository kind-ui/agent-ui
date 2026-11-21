<!-- "Bad response": a Toggle whose value is `"down"`. -->
<script lang="ts">
  import { Toggle, ToggleIcon, type ToggleState } from "@ui-sdk/svelte/toggle";
  import type { ComponentProps } from "svelte";

  let { children: custom, ...props }: ComponentProps<typeof Toggle> & { value?: never } = $props();
</script>

<Toggle
  value="down"
  aria-label="Bad response"
  data-kind-icon-button=""
  data-kind-size="sm"
  {...props}
>
  {#snippet children(state: ToggleState)}
    {#if custom}{@render custom(state)}{:else}<ToggleIcon data-feedback-icon="down" />{/if}
  {/snippet}
</Toggle>
