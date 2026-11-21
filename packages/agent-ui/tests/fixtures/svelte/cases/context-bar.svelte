<script module lang="ts">
  export const variants = ["all", "reduced", "none", "refusing", "written", "many-10", "many-200"];
</script>

<script lang="ts">
  import type { ChangeDetails } from "@ui-sdk/core";
  import { untrack } from "svelte";
  import { ContextBar } from "../../../../src/svelte/context-bar/index.js";
  import { contextChips, contextHost } from "../../shared/context-bar.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = contextHost();
  const count = $derived(variant.startsWith("many-") ? Number(variant.slice(5)) : 6);
  const motion = $derived(variant === "reduced" || variant === "none" ? variant : undefined);
  const refusing = $derived(variant === "refusing");

  let added = untrack(() => count);
  let chips = $state.raw(contextChips(added));
  expose({
    kindHost: host,
    kindContext: {
      add: () => {
        added++;
        chips = [...chips, { id: `added-${added}`, label: `notes/added-${added}.md and more`, kind: "file" }];
      },
    },
  });
</script>

<div class="p-6" style="width: 360px; box-sizing: content-box">
  <ContextBar
    id="context"
    {chips}
    {motion}
    style="--kind-context-chip-max-width: 120px"
    onRemove={(id: string, details: ChangeDetails<string>) => {
      record(id, details);
      if (refusing) details.cancel();
      else chips = chips.filter((chip) => chip.id !== id);
    }}
  />
  <textarea id="below" aria-label="Message"></textarea>
</div>
