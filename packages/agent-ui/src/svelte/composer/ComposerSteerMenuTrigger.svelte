<!-- Opens the menu of send modes: UI SDK's `MenuTrigger`, a chevron unless you pass children. -->
<script lang="ts">
  import type { ComposerSteerMenuTriggerState } from "@kind-ui/agent-ui/core";
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof MenuTrigger> = $props();
</script>

<parts.SteerMenuTrigger>
  {#snippet children(trigger: ComposerSteerMenuTriggerState)}
    <!-- Hidden from agents, which use the composer's `steer` and `queue`. -->
    <MenuTrigger
      aria-label={trigger["aria-label"]}
      disabled={trigger.disabled}
      data-agent-hidden=""
      data-kind-icon-button=""
      data-kind-size="lg"
      {...props}
    >
      {#snippet children(state)}
        {#if content}{@render content(state)}{:else}<span data-composer-chevron="" aria-hidden="true"></span>{/if}
      {/snippet}
    </MenuTrigger>
  {/snippet}
</parts.SteerMenuTrigger>
