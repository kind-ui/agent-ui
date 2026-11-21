<!-- With an `author`, a UI SDK Avatar of their image, showing their initials until it loads, unless you pass children. -->
<script lang="ts">
  import type { MessageAvatarState } from "@kind-ui/agent-ui/core";
  import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/svelte/avatar";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Avatar> = $props();
</script>

{#snippet avatar({ name, initials, src }: MessageAvatarState)}
  {#if name}
    <Avatar>
      {#if src}<AvatarImage {src} alt="" />{/if}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  {/if}
{/snippet}

<parts.Avatar {...props} children={children ?? avatar} />
