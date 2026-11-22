<!-- A UI SDK Avatar of the source's `favicon`, showing a link glyph until it loads or without one. -->
<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/svelte/avatar";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Icon> = $props();
</script>

{#snippet fallback({ favicon }: { favicon: string | undefined })}
  <Avatar>{#if favicon}<AvatarImage src={favicon} alt="" />{/if}<AvatarFallback /></Avatar>
{/snippet}

<parts.Icon {...props} children={children ?? fallback} />
