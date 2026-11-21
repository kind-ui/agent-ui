<script module lang="ts">
  export const variants = ["all", "plain", "groups", "logos", "reduced", "refusing"];
</script>

<script lang="ts">
  import type { ChangeDetails } from "@ui-sdk/core";
  import { createRawSnippet } from "svelte";
  import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorTrigger,
  } from "../../../../src/svelte/model-selector/index.js";
  import { ReasoningEffort } from "../../../../src/svelte/reasoning-effort/index.js";
  import { expose } from "../../shared/expose.js";
  import { iconModels, levels, modelActions, models, selectionHost } from "../../shared/model-selector.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = selectionHost();
  expose({ kindHost: host });

  const refusing = $derived(variant === "refusing");
  const plain = $derived(variant === "plain");
  const motion = $derived(variant === "reduced" ? "reduced" : undefined);

  /** A logo's markup as an `svg` element. */
  const logo = (markup: string) => createRawSnippet(() => ({ render: () => markup }));
  const logoModels = iconModels(logo);
</script>

{#if variant === "logos"}
  <div class="flex flex-col gap-4 p-6">
    <ModelSelector
      id="model"
      models={logoModels}
      defaultValue="claude-sonnet-5.5"
      onValueChange={record("model")}
    />
    <div class="ps-32">
      <ModelSelector
        id="second"
        models={logoModels}
        defaultValue="mai-code-2"
        onValueChange={record("second")}
      />
    </div>
    <div class="ps-64">
      <ModelSelector id="third" models={logoModels} defaultValue="gpt-6-astra">
        <ModelSelectorTrigger id="mine" />
        <ModelSelectorContent />
      </ModelSelector>
    </div>
  </div>
{:else}
  <div class="flex flex-col gap-4 p-6">
    <p id="above">Above</p>
    <div id="toolbar" class="flex items-center gap-2">
      <ModelSelector
        id="model"
        {models}
        pages={variant === "groups" ? "groups" : undefined}
        {...refusing ? { value: "gpt-5" } : { defaultValue: "gpt-5" }}
        onValueChange={(value: string | null, details: ChangeDetails<string>) => {
          record("model")(value, details);
          if (refusing) details.cancel();
        }}
        {...plain
          ? {}
          : {
              actions: modelActions,
              onAction: (id: string, details: { reason: string; cancel(): void }) => {
                record("action")(id, details);
                if (refusing) details.cancel();
              },
            }}
        {motion}
      />
      {#if refusing}
        <ReasoningEffort
          id="effort"
          {levels}
          bind:value={() => "medium", () => {}}
          onValueChange={record("effort")}
          {motion}
        />
      {:else}
        <ReasoningEffort id="effort" {levels} defaultValue="medium" onValueChange={record("effort")} {motion} />
      {/if}
      <span id="beside">Beside</span>
    </div>
  </div>
{/if}
