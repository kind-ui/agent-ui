<!--
  A thread's row, by its id: its link, which also opens the row's menu on a right-click or Shift+F10, how long ago it
  changed, and its More button, which takes the time's place on hover and focus.
-->
<script lang="ts">
  import type { ThreadListLinkState, ThreadListTimeState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";
  import ThreadListLink from "./ThreadListLink.svelte";

  type RowProps = ComponentProps<typeof parts.Row>;
  type Props = { [K in keyof RowProps as K extends "children" ? never : K]: RowProps[K] } & {
    /** What the link shows, a snippet of its `{ value, title }`. */
    children?: Snippet<[ThreadListLinkState]>;
  };

  let { children, ...props }: Props = $props();
</script>

<parts.Row {...props}>
  <parts.LinkCell value={props.value}>
    <ThreadListLink value={props.value} {children} />
    <parts.Editor value={props.value} type="text" />
    <parts.Time value={props.value}>
      {#snippet children({ label }: ThreadListTimeState)}{label}{/snippet}
    </parts.Time>
  </parts.LinkCell>
  <parts.MoreCell value={props.value}>
    <parts.More value={props.value} data-kind-icon-button="" data-kind-size="sm">
      <span data-thread-list-icon="more" aria-hidden="true"></span>
    </parts.More>
  </parts.MoreCell>
</parts.Row>
