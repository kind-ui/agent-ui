<!-- A UI SDK Avatar of the agent's `avatarUrl`, showing its initials until it loads, unless you pass children. -->
<script lang="ts">
  import type { AgentCardAvatarState } from "@kind-ui/agent-ui/core";
  import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/svelte/avatar";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Avatar> = $props();
</script>

{#snippet avatar({ initials, src }: AgentCardAvatarState)}<Avatar
    >{#if src}<AvatarImage {src} alt="" />{/if}<AvatarFallback>{initials}</AvatarFallback></Avatar
  >{/snippet}

<parts.Avatar {...props} children={children ?? avatar} />
