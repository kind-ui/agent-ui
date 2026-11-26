<!-- A UI SDK Avatar of the `to` agent, its initials until the image loads, unless you pass children. Agents only. -->
<script lang="ts">
  import type { HandoffAvatarState } from "@kind-ui/agent-ui/core";
  import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/svelte/avatar";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ToAvatar> = $props();
</script>

{#snippet avatar({ src, initials }: HandoffAvatarState)}<Avatar
    >{#if src}<AvatarImage {src} alt="" />{/if}<AvatarFallback>{initials}</AvatarFallback></Avatar
  >{/snippet}

<parts.ToAvatar {...props} children={children ?? avatar} />
