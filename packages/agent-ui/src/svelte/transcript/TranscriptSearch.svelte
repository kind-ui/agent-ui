<!-- A search field with the match count and a clear button, unless you pass children. Pass the state to UI SDK Input. -->
<script lang="ts">
  import type { TranscriptSearchState } from "@kind-ui/agent-ui/core";
  import { Input, InputClear, InputGroup } from "@ui-sdk/svelte/input";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TranscriptCount from "./TranscriptCount.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Search> = $props();
</script>

{#snippet fallback({ controller, defaultValue, label }: TranscriptSearchState)}
  <InputGroup
    ><Input
      type="search"
      {controller}
      {defaultValue}
      aria-label={label}
      placeholder="Search"
      data-agent-hidden=""
    /><TranscriptCount /><InputClear aria-label="Clear search" data-agent-hidden="" /></InputGroup
  >
{/snippet}

<parts.Search {...props} children={children ?? fallback} />
