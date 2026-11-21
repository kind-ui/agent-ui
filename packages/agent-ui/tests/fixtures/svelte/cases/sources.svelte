<script module lang="ts">
  export const variants = ["all", "reduced", "refused"];
</script>

<script lang="ts">
  import type { MotionMode, SourcesOpenChangeReason } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { Sources } from "../../../../src/svelte/sources/index.js";
  import { expose } from "../../shared/expose.js";
  import { sources as initial, nextSources } from "../../shared/sources.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let sources = $state.raw(initial);
  const openings: string[] = [];
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  expose({
    kindHost: {
      add: () => (sources = nextSources.add(sources)),
      rename: () => (sources = nextSources.rename(sources)),
      openings,
    },
  });

  const record = (_open: boolean, details: ChangeDetails<SourcesOpenChangeReason>) => openings.push(details.reason);
</script>

<div class="w-[30rem] p-6">
  {#if variant === "refused"}
    <Sources id="sources" {sources} {motion} bind:open={() => false, () => {}} onOpenChange={record} />
  {:else}
    <Sources id="sources" {sources} {motion} />
  {/if}
</div>
