<script module lang="ts">
  export const variants = ["default", "reduced", "none", "no-source", "composer", "composer-cancel"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/svelte/composer/index.js";
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

{#if variant === "composer" || variant === "composer-cancel"}
  <div class="p-4" style="width: 480px">
    <Composer aria-label="Message">
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      {#if variant === "composer-cancel"}
        <Dictation
          {source}
          onText={(text: string, details: ChangeDetails<string>) => {
            details.cancel();
            record(text, details);
          }}
        />
      {:else}
        <Dictation {source} />
      {/if}
      <ComposerSubmit />
    </Composer>
  </div>
{:else}
<div class="p-6" style="width: 320px">
  {#if variant === "no-source"}
    <Dictation onText={record} {motion} />
  {:else}
    <Dictation {source} onText={record} {motion} />
  {/if}
</div>
{/if}
