<!-- Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a settings icon unless you pass children. -->
<script lang="ts">
  import type { MenuTriggerState } from "@kind-ui/agent-ui/core";
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof MenuTrigger> = $props();
</script>

<parts.Trigger>
  {#snippet children(trigger: MenuTriggerState)}
    <!-- Hidden from agents, which use the Settings Menu's own actions. -->
    <MenuTrigger
      aria-label={trigger["aria-label"]}
      disabled={trigger.disabled}
      data-kind-trigger={trigger["data-kind-trigger"]}
      data-kind-icon-button={trigger["data-kind-icon-button"]}
      data-agent-hidden=""
      {...props}
    >
      {#snippet children(state)}
        {#if content}{@render content(state)}{:else}<span data-menu-trigger-icon="" aria-hidden="true"></span>{/if}
      {/snippet}
    </MenuTrigger>
  {/snippet}
</parts.Trigger>
