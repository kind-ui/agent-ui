<!--
  One button for the model and its effort, reading "GPT-5 · High", that opens one menu: the models, grouped with
  their icons, then the effort levels the model supports, then your own choices and toggles. Any `children` replace
  the trigger and the content, inside UI SDK Menu.
-->
<script lang="ts">
  import type { MenuPartState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindMenu } from "../internal/menu/index.js";
  import type { SettingsMenuSetting } from "../settings-menu/index.js";
  import type { ModelControlAction, ModelControlModel } from "./index.js";
  import ModelControlContent from "./ModelControlContent.svelte";
  import ModelControlTrigger from "./ModelControlTrigger.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = {
    [K in keyof RootProps as K extends "children" | "models" | "actions" | "settings" ? never : K]: RootProps[K];
  } & {
    models?: ModelControlModel[];
    /** Items after the models, like "More models". */
    actions?: ModelControlAction[];
    /** More rows after Model and Effort: choices, then toggles. */
    settings?: SettingsMenuSetting[];
    children?: Snippet;
  };

  let {
    open = $bindable(),
    values = $bindable(),
    model = $bindable(),
    effort = $bindable(),
    children: content,
    ...props
  }: Props = $props();
</script>

<parts.Root bind:open bind:values bind:model bind:effort {...props}>
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
      {#if content}{@render content()}{:else}<ModelControlTrigger /><ModelControlContent />{/if}
    </KindMenu>
  {/snippet}
</parts.Root>
