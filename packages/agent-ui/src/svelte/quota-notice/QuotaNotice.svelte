<!--
  A notice about a quota: its mark and title, a bar with the amounts in words, when it resets, any `children`, then
  Upgrade while `onUpgrade` is set, `actions` and Dismiss while `onDismiss` is set. To arrange the parts yourself,
  use `QuotaNoticeRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import {
    parts,
    QuotaNoticeActions,
    QuotaNoticeDescription,
    QuotaNoticeDismiss,
    QuotaNoticeIcon,
    QuotaNoticeMeter,
    QuotaNoticeReset,
    QuotaNoticeTitle,
    QuotaNoticeUpgrade,
  } from "./index.js";

  // `Omit` would drop the options: part props carry an index signature for attributes.
  type RootProps = ComponentProps<typeof parts.Root>;

  let {
    children,
    actions,
    ...props
  }: { [Key in keyof RootProps as Key extends "children" ? never : Key]: RootProps[Key] } & {
    /** More text under the bar. */
    children?: Snippet;
    /** Buttons after Upgrade, like "View usage". */
    actions?: Snippet;
  } = $props();
</script>

<parts.Root {...props}>
  <QuotaNoticeIcon
  /><QuotaNoticeTitle
  /><QuotaNoticeMeter
  /><QuotaNoticeReset
  />{#if children}<QuotaNoticeDescription>{@render children()}</QuotaNoticeDescription>{/if}<QuotaNoticeActions
  ><QuotaNoticeUpgrade />{@render actions?.()}</QuotaNoticeActions
  ><QuotaNoticeDismiss />
</parts.Root>
