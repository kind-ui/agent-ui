<!-- Holds Previous and Next, unless you pass children, and hides them while every suggestion fits. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import SuggestionNext from "./SuggestionNext.svelte";
  import SuggestionPrevious from "./SuggestionPrevious.svelte";

  let { children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div data-suggestion-controls="" {...props}>
  {#if children}
    {@render children()}
  {:else}
    <SuggestionPrevious
    /><SuggestionNext />
  {/if}
</div>
