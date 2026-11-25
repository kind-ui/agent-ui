<!--
  An agent's identity: its avatar, name, model, status, description and capabilities, and one action while
  `onAction` is set. To arrange the parts yourself, use `AgentCardRoot`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import AgentCardAction from "./AgentCardAction.svelte";
  import AgentCardAvatar from "./AgentCardAvatar.svelte";
  import AgentCardCapabilities from "./AgentCardCapabilities.svelte";
  import AgentCardDescription from "./AgentCardDescription.svelte";
  import AgentCardModel from "./AgentCardModel.svelte";
  import AgentCardName from "./AgentCardName.svelte";
  import AgentCardStatus from "./AgentCardStatus.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] };

  let props: Props = $props();
</script>

<parts.Root {...props}
  ><AgentCardAvatar
  /><AgentCardName
  /><AgentCardStatus
  /><AgentCardModel
  /><AgentCardAction
  /><AgentCardDescription
  /><AgentCardCapabilities
/></parts.Root>
