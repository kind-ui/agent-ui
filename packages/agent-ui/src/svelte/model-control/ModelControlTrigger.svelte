<!-- Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, the model and the effort. -->
<script lang="ts">
  import type { ModelControlTriggerState } from "@kind-ui/agent-ui/core";
  import { MenuTrigger } from "@ui-sdk/svelte/menu";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenuItemIcon } from "../internal/menu/index.js";
  import { parts } from "./parts.js";

  type Props = Omit<ComponentProps<typeof MenuTrigger>, "children"> & {
    /** What the button shows: the model's icon and name, then its effort, by default. */
    children?: Snippet<[ModelControlTriggerState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Trigger>
  {#snippet children(trigger: ModelControlTriggerState)}
    <!-- Hidden from agents, which use the Model Control's own actions. -->
    <MenuTrigger
      aria-label={trigger["aria-label"]}
      disabled={trigger.disabled}
      data-kind-trigger={trigger["data-kind-trigger"]}
      data-kind-icon-button={trigger["data-kind-icon-button"]}
      data-agent-hidden=""
      {...props}
    >
      {#if content}{@render content(trigger)}{:else}
        {@const icon = trigger.model.icon as string | Snippet | undefined}
        {@const effort = trigger.effort}
        {#if icon !== undefined}
          <KindMenuItemIcon>{#if typeof icon === "string"}<img src={icon} alt="" />{:else}{@render icon()}{/if}</KindMenuItemIcon>
        {/if}
        <span data-model-control-model="">{trigger.model.label}</span>
        {#if effort}
          <!-- Spaces around the "·", so the accessible name reads "GPT-5 · High"; the trigger's gap spaces it on screen. -->
          <span data-model-control-separator="">·</span>
          <!-- Every level's label shares one cell and only the chosen one shows, so the trigger keeps its width. -->
          <span data-model-control-effort=""
            >{#each effort.options as option (option.value)}<span
                data-current={option.value === effort.value ? "" : undefined}>{option.label}</span
              >{/each}</span
          >
        {/if}
        <span data-menu-chevron=""></span>
      {/if}
    </MenuTrigger>
  {/snippet}
</parts.Trigger>
