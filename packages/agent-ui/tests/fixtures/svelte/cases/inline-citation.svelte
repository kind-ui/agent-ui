<script module lang="ts">
  export const variants = ["all", "reduced", "refused"];
</script>

<script lang="ts">
  import type { InlineCitationOpenChangeReason, MotionMode } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { InlineCitation } from "../../../../src/svelte/inline-citation/index.js";
  import { expose } from "../../shared/expose.js";
  import { lateSource, sources } from "../../shared/sources.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const openings: string[] = [];
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  expose({ kindHost: { openings } });

  const record = (_open: boolean, details: ChangeDetails<InlineCitationOpenChangeReason>) =>
    openings.push(details.reason);
</script>

<div class="w-[40rem] p-6 text-sm leading-6">
  <p id="prose">
    Back off when you hit a limit <InlineCitation id="many" {sources} {motion} /> and read the header
    {#if variant === "refused"}<InlineCitation
        id="one"
        sources={[lateSource]}
        label="1"
        {motion}
        bind:open={() => false, () => {}}
        onOpenChange={record}
      />{:else}<InlineCitation id="one" sources={[lateSource]} label="1" {motion} />{/if}.
  </p>
</div>
