<!-- A UI SDK Avatar of `avatarSrc`, unless you pass children. Rendered only with an `avatarSrc`. -->
<script lang="ts">
  import { Avatar, AvatarImage } from "@ui-sdk/svelte/avatar";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Avatar> = $props();
</script>

<parts.Avatar {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <Avatar>
        <AvatarImage src={state.src} alt="" />
      </Avatar>
    {/if}
  {/snippet}
</parts.Avatar>
