<!--
  A button showing the approval mode, named "Approvals, <mode>", that opens a menu of modes: radio items with a
  description each, a risky one marked, and an optional Learn more link after them. Any `children` replace the
  trigger and the content, inside UI SDK Menu.
-->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";
  import ApprovalModeContent from "./ApprovalModeContent.svelte";
  import ApprovalModeTrigger from "./ApprovalModeTrigger.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { open = $bindable(), value = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open bind:value {...props}>
  <!-- Part state can't be spread, so each key Menu takes is read by name. -->
  {#snippet children(menu: MenuPartState)}
    <KindMenu
      controller={menu.controller}
      presentation={menu.presentation}
      open={menu.open}
      onOpenChange={menu.onOpenChange}
      onAction={menu.onAction}
      onCheckedChange={menu.onCheckedChange}
      onValueChange={menu.onValueChange}
    >
      {#if content}{@render content()}{:else}<ApprovalModeTrigger /><ApprovalModeContent />{/if}
    </KindMenu>
  {/snippet}
</parts.Root>
