<!--
  A long job: its status, title and time, a progress bar of its stage, its log as `children`, and Cancel or Retry
  while `onCancel` or `onRetry` is set. To arrange the parts yourself, use `JobProgressRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import JobProgressCancel from "./JobProgressCancel.svelte";
  import JobProgressMeta from "./JobProgressMeta.svelte";
  import JobProgressProgress from "./JobProgressProgress.svelte";
  import JobProgressRetry from "./JobProgressRetry.svelte";
  import JobProgressTitle from "./JobProgressTitle.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } & {
    /** The job's log, like a `Terminal`, shown when the job is open. */
    children?: Snippet;
  };

  let { children: log, open = $bindable(), ...props }: Props = $props();
</script>

<parts.Root {...props} bind:open
  ><parts.Trigger
    ><parts.Icon
    /><JobProgressTitle
    /><JobProgressMeta
  /></parts.Trigger
  ><JobProgressProgress
  /><parts.Content
    ><parts.Children>{@render log?.()}</parts.Children
  ></parts.Content
  ><JobProgressCancel
  /><JobProgressRetry
/></parts.Root>
