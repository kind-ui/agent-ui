<!--
  The prompt, a Token Input. Props go to its editor: name it with `aria-label`. Put `ComposerTriggerMenu` inside.
  To cancel a key, like Enter, use `onkeydowncapture`: the Token Input handles keys before `onkeydown` runs.
-->
<script lang="ts">
  import {
    type Token,
    TokenInput,
    TokenInputEditor,
    TokenInputToken,
    TokenInputTokenRemove,
  } from "@ui-sdk/svelte/token-input";
  import type { ComponentProps, Snippet } from "svelte";
  import ComposerEditorBound from "./ComposerEditorBound.svelte";
  import { parts } from "./parts.js";

  type InputProps = ComponentProps<typeof parts.Input>;

  let {
    children: content,
    ...props
  }: ComponentProps<typeof TokenInputEditor> & { children?: Snippet } = $props();

  // UI SDK Svelte's editor holds Svelte's anchors until it binds, and reads them as typed text when the value changed
  // before then, which emptied a restored draft. The input part syncs the draft into the editor, so it binds only once
  // the editor has.
  let editorBound = $state(false);
  // Leaves out the symbol-keyed attachment UI SDK binds the element with.
  const unbound = <Attrs extends object>(attrs: Attrs) => Object.fromEntries(Object.entries(attrs)) as Attrs;
</script>

{#snippet token(token: Token)}
  <TokenInputToken>{token.label}<TokenInputTokenRemove /></TokenInputToken>
{/snippet}

<parts.Input>
  {#snippet render(handed: Parameters<NonNullable<InputProps["render"]>>[0])}
    <div {...editorBound ? handed.props : unbound(handed.props)}>{@render handed.children?.(handed.state)}</div>
  {/snippet}
  {#snippet children({ tokenInput })}
    <TokenInput {...tokenInput} {token}>
      <TokenInputEditor {...props}
      />{@render content?.()}
    </TokenInput><ComposerEditorBound onbound={() => (editorBound = true)} onunbound={() => (editorBound = false)} />
  {/snippet}
</parts.Input>
