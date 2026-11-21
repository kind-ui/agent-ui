<script module lang="ts">
  export const variants = ["default", "reduced", "none", "no-source"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { Dictation } from "../../../../src/svelte/dictation/index.js";
  import { dictationHost } from "../../shared/dictation.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, source, record } = dictationHost();
  expose({ kindDictation: host });

  const motion: MotionMode | undefined = $derived(
    variant === "reduced" ? "reduced" : variant === "none" ? "none" : undefined,
  );
</script>

<div class="p-6" style="width: 320px">
  {#if variant === "no-source"}
    <Dictation onText={record} {motion} />
  {:else}
    <Dictation {source} onText={record} {motion} />
  {/if}
</div>
