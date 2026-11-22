<!--
  A calm callout: its mark, its `label` as the title, `children` as its text, then `actions` and Dismiss while
  `onDismiss` is set. To arrange the parts yourself, use `NoticeRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { NoticeActions, NoticeDescription, NoticeDismiss, NoticeIcon, NoticeTitle, parts } from "./index.js";

  // `Omit` would drop the options: part props carry an index signature for attributes.
  type RootProps = ComponentProps<typeof parts.Root>;

  let {
    children,
    actions,
    ...props
  }: { [Key in keyof RootProps as Key extends "children" ? never : Key]: RootProps[Key] } & {
    /** The notice's text. */
    children?: Snippet;
    /** Buttons that act on the notice, like "Retry". */
    actions?: Snippet;
  } = $props();
</script>

<parts.Root {...props}>
  <NoticeIcon
  /><NoticeTitle
  /><NoticeDescription>{@render children?.()}</NoticeDescription
  ><NoticeActions>{@render actions?.()}</NoticeActions
  ><NoticeDismiss />
</parts.Root>
