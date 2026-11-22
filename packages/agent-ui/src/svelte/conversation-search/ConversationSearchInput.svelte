<!-- The search field with its count, unless you pass a `children` snippet. Pass its state to UI SDK Input. -->
<script lang="ts">
  import type { ConversationSearchInputState } from "@kind-ui/agent-ui/core";
  import { Input, InputGroup } from "@ui-sdk/svelte/input";
  import type { ComponentProps } from "svelte";
  import ConversationSearchCount from "./ConversationSearchCount.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Input> = $props();
</script>

{#snippet field(state: ConversationSearchInputState)}
  <InputGroup
    ><Input
      type="search"
      controller={state.controller}
      defaultValue={state.defaultValue}
      aria-label={state.label}
      aria-describedby={state.describedBy}
      placeholder="Find…"
      data-agent-hidden=""
    /><ConversationSearchCount /></InputGroup
  >
{/snippet}

<parts.Input {...props} children={children ?? field} />
