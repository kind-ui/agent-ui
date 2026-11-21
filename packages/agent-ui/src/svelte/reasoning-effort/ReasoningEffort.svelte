<!--
  How hard the model thinks, as a row of levels with a mark that slides to the chosen one. Any `children` replace the
  mark and the levels, inside the Segmented Control.
-->
<script lang="ts">
  import type { ReasoningEffortControlState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import {
    KindSegmentedControl,
    KindSegmentedControlIndicator,
    KindSegmentedControlItem,
  } from "../internal/segmented-control/index.js";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { value = $bindable(), children: content, ...props }: Props = $props();
  // The control stays uncontrolled: the primitive writes its value through the controller.
  const unbound = () => undefined;
  const keep = () => {};
</script>

<parts.Root bind:value {...props}>
  <!-- Hidden from agents, which use the Reasoning Effort's own `setValue`. -->
  {#snippet children(control: ReasoningEffortControlState)}
    <KindSegmentedControl
      controller={control.controller}
      defaultValue={control.defaultValue}
      bind:value={unbound, keep}
      disabled={control.disabled}
      aria-label={control["aria-label"]}
      data-agent-hidden=""
    >
      {#if content}{@render content()}{:else}
        <KindSegmentedControlIndicator />
        {#each control.levels as level (level.value)}
          <KindSegmentedControlItem value={level.value}>{level.label}</KindSegmentedControlItem>
        {/each}
      {/if}
    </KindSegmentedControl>
  {/snippet}
</parts.Root>
