<!--
  A notice that a guardrail blocked or filtered content: its mark and title, the `reason`, "Why?" with the `detail`
  while there is one, any `children`, then `actions` and Dismiss while `onDismiss` is set. To arrange the parts
  yourself, use `GuardrailNoticeRoot`.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import {
    GuardrailNoticeActions,
    GuardrailNoticeDescription,
    GuardrailNoticeDetail,
    GuardrailNoticeDetailTrigger,
    GuardrailNoticeDismiss,
    GuardrailNoticeIcon,
    GuardrailNoticeReason,
    GuardrailNoticeTitle,
    parts,
  } from "./index.js";

  // `Omit` would drop the options: part props carry an index signature for attributes.
  type RootProps = ComponentProps<typeof parts.Root>;

  let {
    children,
    actions,
    ...props
  }: { [Key in keyof RootProps as Key extends "children" ? never : Key]: RootProps[Key] } & {
    /** More text under the reason. */
    children?: Snippet;
    /** Buttons that act on the notice, like "Rephrase". */
    actions?: Snippet;
  } = $props();
</script>

<parts.Root {...props}>
  <GuardrailNoticeIcon
  /><GuardrailNoticeTitle
  /><GuardrailNoticeReason
  /><GuardrailNoticeDetailTrigger
  /><GuardrailNoticeDetail
  />{#if children}<GuardrailNoticeDescription>{@render children()}</GuardrailNoticeDescription>{/if}<GuardrailNoticeActions
  >{@render actions?.()}</GuardrailNoticeActions
  ><GuardrailNoticeDismiss />
</parts.Root>
