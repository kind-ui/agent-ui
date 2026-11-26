<!-- Opens Send's menu: UI SDK's `MenuTrigger`, a chevron unless you pass children. -->
<script lang="ts">
  import type { ComposerSendMenuTriggerState } from "@kind-ui/agent-ui/core";
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof MenuTrigger> = $props();
</script>

<parts.SendMenuTrigger>
  {#snippet children(trigger: ComposerSendMenuTriggerState)}
    <!-- Hidden from agents, which use the composer's `steer`, `queue` and `stopAndSend`. -->
    <MenuTrigger aria-label={trigger["aria-label"]} disabled={trigger.disabled} data-agent-hidden="" {...props}>
      {#snippet children(state)}
        {#if content}{@render content(state)}{:else}<span data-composer-chevron="" aria-hidden="true"></span>{/if}
      {/snippet}
    </MenuTrigger>
  {/snippet}
</parts.SendMenuTrigger>
