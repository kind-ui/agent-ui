<!--
  A subagent's run: its status, name and avatar, then its own steps, a Stop button while `onCancel` is set, and
  its `result` once complete. Its `children` are the steps; to arrange the parts yourself, use `SubagentRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";
  import SubagentAvatar from "./SubagentAvatar.svelte";
  import SubagentCancel from "./SubagentCancel.svelte";
  import SubagentMeta from "./SubagentMeta.svelte";
  import SubagentResult from "./SubagentResult.svelte";
  import SubagentTitle from "./SubagentTitle.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } & {
    /** The subagent's own steps, like a `StepList` of `Tool`s. */
    children?: Snippet;
  };

  let { children: steps, open = $bindable(), ...props }: Props = $props();
</script>

<parts.Root {...props} bind:open
  ><parts.Trigger
    ><parts.Icon
    /><SubagentAvatar
    /><SubagentTitle
    /><SubagentMeta
  /></parts.Trigger
  ><parts.Content
    ><parts.Children>{@render steps?.()}</parts.Children
  ></parts.Content
  ><SubagentCancel
  /><SubagentResult
/></parts.Root>
