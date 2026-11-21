<!-- Opens the menu: UI SDK's `MenuTrigger`, named by the `label` and the mode. Props go to it. -->
<script lang="ts">
  import type { ApprovalModeTriggerState } from "@kind-ui/agent-ui/core";
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type TriggerProps = ComponentProps<typeof MenuTrigger>;
  type Props = { [K in keyof TriggerProps as K extends "children" ? never : K]: TriggerProps[K] } & {
    /** What the button shows, from its state: a shield, the mode's label and a risky mode's mark. */
    children?: Snippet<[ApprovalModeTriggerState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Trigger>
  {#snippet children(trigger: ApprovalModeTriggerState)}
    <!-- Hidden from agents, which use the Approval Mode's own actions. -->
    <MenuTrigger
      aria-label={trigger["aria-label"]}
      disabled={trigger.disabled}
      data-kind-trigger={trigger["data-kind-trigger"]}
      data-kind-icon-button={trigger["data-kind-icon-button"]}
      data-agent-hidden=""
      {...props}
    >
      {#if content}{@render content(trigger)}{:else}<span data-menu-trigger-icon="" aria-hidden="true"
        ></span>{#if trigger.mode}<span data-approval-mode-value="">{trigger.mode.label}</span>{/if}{#if trigger.mode?.danger}<span
            data-status-mark=""
            data-status="warning"
            aria-hidden="true"
          ></span>{/if}{/if}
    </MenuTrigger>
  {/snippet}
</parts.Trigger>
