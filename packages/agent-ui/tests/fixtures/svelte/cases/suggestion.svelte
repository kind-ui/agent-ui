<script module lang="ts">
  export const variants = ["all", "overflow", "reduced", "static", "form", "custom", "wrap"];
</script>

<script lang="ts">
  import type { SuggestionItem as Item } from "@kind-ui/agent-ui";
  import {
    Suggestion,
    SuggestionControls,
    SuggestionItem,
    SuggestionNext,
    SuggestionPrevious,
    SuggestionViewport,
  } from "../../../../src/svelte/suggestion/index.js";
  import { expose } from "../../shared/expose.js";
  import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = suggestionHost();

  const many = $derived(variant === "overflow" || variant === "wrap");
  let items: Item[] = $derived(many ? manySuggestions : suggestions);
  const width = $derived(many ? 360 : undefined);
  const motion = $derived(variant === "reduced" ? ("reduced" as const) : undefined);
  const pickable = $derived(variant !== "static");

  expose({
    kindHost: {
      ...host,
      add: () => (items = [...items, added]),
      remove: () => (items = items.filter((item) => item.id !== "b")),
      rename: () => (items = items.map((item) => (item.id === "a" ? { ...item, label: "Summarize it" } : item))),
    },
  });

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    host.submits.push("submit");
  };
</script>

{#snippet suggestion()}
  <Suggestion
    id="suggestion"
    suggestions={items}
    onPick={pickable ? record : undefined}
    {motion}
    layout={variant === "wrap" ? "wrap" : undefined}
    children={variant === "custom" ? custom : undefined}
  />
{/snippet}

{#snippet custom()}
  <SuggestionViewport>
    {#each items as item (item.id)}
      <SuggestionItem value={item.id} />
    {/each}
  </SuggestionViewport
  ><SuggestionControls>
    <SuggestionPrevious
    /><SuggestionNext />
  </SuggestionControls>
{/snippet}

<div class="flex flex-col gap-4 p-6" style:width={width ? `${width}px` : undefined}>
  <p id="above">Above</p
  >{#if variant === "form"}
    <form onsubmit={submit}>
      {@render suggestion()}
    </form>
  {:else}
    {@render suggestion()}
  {/if}<p id="below"
  >Below</p>
</div>
