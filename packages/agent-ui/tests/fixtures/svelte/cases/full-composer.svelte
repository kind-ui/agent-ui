<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import type { SettingsValues } from "@kind-ui/agent-ui";
  import { AddMenu } from "../../../../src/svelte/add-menu/index.js";
  import { ApprovalMode } from "../../../../src/svelte/approval-mode/index.js";
  import {
    Composer,
    ComposerInput,
    ComposerRestored,
    ComposerSubmit,
  } from "../../../../src/svelte/composer/index.js";
  import { ContextBar } from "../../../../src/svelte/context-bar/index.js";
  import { Dictation } from "../../../../src/svelte/dictation/index.js";
  import { ModelControl } from "../../../../src/svelte/model-control/index.js";
  import { SettingsMenu } from "../../../../src/svelte/settings-menu/index.js";
  import { addItems } from "../../shared/add-menu.js";
  import { initialValue, modes } from "../../shared/approval-mode.js";
  import { draftOptions } from "../../shared/composer.js";
  import { contextChips } from "../../shared/context-bar.js";
  import { dictationHost } from "../../shared/dictation.js";
  import { levels, models } from "../../shared/model-control.js";
  import { initialValues, settings } from "../../shared/settings-menu.js";

  let { params }: { variant: string; params: URLSearchParams } = $props();

  const { source } = dictationHost();
  const drafts = $derived(draftOptions(params));
  let chips = $state.raw(contextChips(4));
  let mode = $state(initialValue);
  let values: SettingsValues = $state.raw(initialValues);
</script>

<div class="p-4">
  <Composer aria-label="Message" onSubmit={() => undefined} {...drafts}>
    <ContextBar
      {chips}
      style="--kind-context-chip-max-width: 120px"
      onRemove={(id: string) => (chips = chips.filter((chip) => chip.id !== id))}
    /><ComposerInput aria-label="Prompt" placeholder="Ask anything"
    /><div style="grid-area: attach; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0">
      <AddMenu items={addItems} onAction={() => undefined}
      /><ModelControl {models} {levels} defaultModel="opus" defaultEffort="high"
      /><ApprovalMode {modes} bind:value={mode}
      /><SettingsMenu {settings} bind:values />
    </div
    ><ComposerRestored
    /><Dictation {source}
    /><ComposerSubmit />
  </Composer>
</div>
