<!-- Why the last create or revoke failed, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Error> & { children?: Snippet<[{ message: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Error {...props}>
  {#snippet children(state: { message: string })}
    {#if content}{@render content(state)}{:else}{state.message}{/if}
  {/snippet}
</parts.Error>
