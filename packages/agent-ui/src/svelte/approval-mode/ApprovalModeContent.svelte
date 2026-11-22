<!--
  The menu: UI SDK's `MenuContent` holding one radio group, headed by the `label`, of the modes unless you pass
  children, then a Learn more item (a link with `learnMoreHref`). Props go to the content.
-->
<script lang="ts">
  import { APPROVAL_MODE_GROUP, APPROVAL_MODE_LEARN_MORE, type ApprovalModeContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import {
    KindMenuContent,
    KindMenuGroupLabel,
    KindMenuItem,
    KindMenuRadioGroup,
    KindMenuSeparator,
  } from "../internal/menu/index.js";
  import ApprovalModeRows from "./ApprovalModeRows.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof KindMenuContent> & {
    /** What the radio group holds after its header, from the content's state: the modes by default. */
    children?: Snippet<[ApprovalModeContentState]>;
  };

  type LinkArgs = Parameters<NonNullable<ComponentProps<typeof KindMenuItem>["render"]>>[0];

  let { children: content, ...props }: Props = $props();

  // The primitive owns the value: a Svelte component keeps a change to a prop that isn't bound, so it's bound to a
  // setter that keeps nothing, and the new value arrives with the content's state.
  const keep = () => {};
</script>

<parts.Content>
  {#snippet children(state: ApprovalModeContentState)}
    {#snippet link({ props, state: item, children }: LinkArgs)}
      <a {...props} href={state.learnMoreHref}>{@render children?.(item)}</a>
    {/snippet}
    <KindMenuContent align="start" sideOffset={6} {...props}>
      <KindMenuRadioGroup name={APPROVAL_MODE_GROUP} bind:value={() => state.value, keep}>
        <div data-approval-mode-header="">
          <KindMenuGroupLabel>{state.label}</KindMenuGroupLabel>
        </div
        >{#if content}{@render content(state)}{:else}<ApprovalModeRows rows={state.rows} />{/if}
      </KindMenuRadioGroup
      >{#if state.learnMore}
        <KindMenuSeparator data-approval-mode-learn-more=""
        /><KindMenuItem
          value={APPROVAL_MODE_LEARN_MORE}
          data-approval-mode-learn-more=""
          data-menu-inset=""
          render={state.learnMoreHref ? link : undefined}
        >
          Learn more
        </KindMenuItem>
      {/if}
    </KindMenuContent>
  {/snippet}
</parts.Content>
