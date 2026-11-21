<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import type { SettingsValues } from "@kind-ui/agent-ui";
import type { CSSProperties } from "vue";
import { shallowRef } from "vue";
import { AddMenu } from "../../../../src/vue/add-menu.js";
import { ApprovalMode } from "../../../../src/vue/approval-mode.js";
import { Composer, ComposerInput, ComposerRestored, ComposerSubmit } from "../../../../src/vue/composer.js";
import { ContextBar } from "../../../../src/vue/context-bar.js";
import { Dictation } from "../../../../src/vue/dictation.js";
import { ModelControl } from "../../../../src/vue/model-control.js";
import { SettingsMenu } from "../../../../src/vue/settings-menu.js";
import { addItems } from "../../shared/add-menu.js";
import { initialValue, modes } from "../../shared/approval-mode.js";
import { draftOptions } from "../../shared/composer.js";
import { contextChips } from "../../shared/context-bar.js";
import { dictationHost } from "../../shared/dictation.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";
import { initialValues, settings } from "../../shared/settings-menu.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { source } = dictationHost();
const drafts = draftOptions(props.params);
const chips = shallowRef(contextChips(4));
const mode = shallowRef(initialValue);
const values = shallowRef<SettingsValues>(initialValues);
const chipWidth = { "--kind-context-chip-max-width": "120px" } as CSSProperties;

const removeChip = (id: string) => {
  chips.value = chips.value.filter((chip) => chip.id !== id);
};
const ignore = () => undefined;
</script>

<template>
  <div class="p-4">
    <Composer aria-label="Message" :on-submit="ignore" v-bind="drafts">
      <ContextBar :chips="chips" :style="chipWidth" :on-remove="removeChip" />
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <div :style="controls">
        <AddMenu :items="addItems" :on-action="ignore" />
        <ModelControl :models="models" :levels="levels" default-model="opus" default-effort="high" />
        <ApprovalMode v-model:value="mode" :modes="modes" />
        <SettingsMenu v-model:values="values" :settings="settings" />
      </div>
      <ComposerRestored />
      <Dictation :source="source" />
      <ComposerSubmit />
    </Composer>
  </div>
</template>
