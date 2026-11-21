<script module lang="ts">
  export const variants = ["owned", "all", "reduced", "refusing", "sheet", "server"];
</script>

<script lang="ts">
  import { ThreadSearch } from "../../../../src/svelte/thread-search/index.js";
  import { expose } from "../../shared/expose.js";
  import { NOW, results, threadSearchHost, threads } from "../../shared/thread-search.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = threadSearchHost();
  let status = $state<"idle" | "loading" | "error">("loading");
  expose({ kindHost: { ...host, setStatus: (next: typeof status) => (status = next) } });

  const motion = $derived(variant === "reduced" ? "reduced" : undefined);
  const presentation = $derived(variant === "sheet" ? "sheet" : undefined);
</script>

{#if variant === "server"}
  <div class="p-6">
    <ThreadSearch
      id="search"
      threads={results}
      now={NOW}
      filter={false}
      {status}
      onSelect={record("select")}
      onQueryChange={record("query")}
    />
  </div>
{:else if variant === "owned"}
  <div class="p-6">
    <ThreadSearch id="search" {threads} now={NOW} bind:query={() => "", () => {}} onQueryChange={record("query")} />
  </div>
{:else}
  <div class="flex flex-col gap-4 p-6">
    <p id="above">Above</p>
    <ThreadSearch
      id="search"
      {threads}
      now={NOW}
      timeZone="UTC"
      shortcut="mod+k"
      onSelect={record("select", variant === "refusing")}
      onNew={record("new")}
      onQueryChange={record("query")}
      {motion}
      {presentation}
    />
  </div>
{/if}
