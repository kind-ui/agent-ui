<!--
  The prompt, a Token Input. Props go to its editor: name it with `aria-label`. Put `ComposerTriggerMenu` inside.
  To cancel a key, like Enter, use `onkeydowncapture`: the Token Input handles keys before `onkeydown` runs.
-->
<script lang="ts">
  import type { ComposerInputState } from "@kind-ui/agent-ui/core";
  import {
    type Token,
    TokenInput,
    TokenInputEditor,
    TokenInputToken,
    TokenInputTokenRemove,
  } from "@ui-sdk/svelte/token-input";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  let {
    children: content,
    ...props
  }: ComponentProps<typeof TokenInputEditor> & { children?: Snippet } = $props();
</script>

{#snippet token(token: Token)}
  <TokenInputToken>{token.label}<TokenInputTokenRemove /></TokenInputToken>
{/snippet}

<parts.Input>
  {#snippet children({ tokenInput })}
    <TokenInput {...tokenInput} {token}>
      <TokenInputEditor {...props} />
      {@render content?.()}
    </TokenInput>
  {/snippet}
</parts.Input>
