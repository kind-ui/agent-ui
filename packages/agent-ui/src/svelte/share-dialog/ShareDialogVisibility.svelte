<!-- "Only you" or "Anyone with the link", a UI SDK Segmented Control, unless you pass children. -->
<script lang="ts">
  import type { ShareDialogVisibilityState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import {
    KindSegmentedControl,
    KindSegmentedControlIndicator,
    KindSegmentedControlItem,
  } from "../internal/segmented-control/index.js";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Visibility> & { children?: Snippet<[ShareDialogVisibilityState]> };

  let { children: content, ...props }: Props = $props();
  // The control stays uncontrolled: the primitive writes its value through the controller.
  const unbound = () => undefined;
  const keep = () => {};
</script>

<parts.Visibility {...props}>
  {#snippet children(control: ShareDialogVisibilityState)}
    {#if content}{@render content(control)}{:else}
      <!-- Hidden from agents, which use the Share Dialog's own `setVisibility`. -->
      <KindSegmentedControl
        controller={control.controller}
        defaultValue={control.defaultValue}
        bind:value={unbound, keep}
        aria-label={control["aria-label"]}
        data-agent-hidden=""
      >
        <KindSegmentedControlIndicator />
        {#each control.options as option (option.value)}
          <KindSegmentedControlItem value={option.value}>{option.label}</KindSegmentedControlItem>
        {/each}
      </KindSegmentedControl>
    {/if}
  {/snippet}
</parts.Visibility>
