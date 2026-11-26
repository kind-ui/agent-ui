<!--
  One summary row over the host's own steps: their count in words, their status, and "Stop all" while `onCancel`
  is set and they run. Its `children` are the steps; to arrange the parts yourself, use `StepGroupRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";
  import StepGroupCancel from "./StepGroupCancel.svelte";
  import StepGroupMeta from "./StepGroupMeta.svelte";
  import StepGroupTitle from "./StepGroupTitle.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } & {
    /** The steps, like a `StepList` of `Tool`s or `Subagent`s. */
    children?: Snippet;
  };

  let { children: steps, open = $bindable(), ...props }: Props = $props();
</script>

<parts.Root {...props} bind:open
  ><parts.Trigger
    ><parts.Icon
    /><StepGroupTitle
    /><StepGroupMeta
  /></parts.Trigger
  ><parts.Content
    ><parts.Children>{@render steps?.()}</parts.Children
  ></parts.Content
  ><StepGroupCancel
/></parts.Root>
