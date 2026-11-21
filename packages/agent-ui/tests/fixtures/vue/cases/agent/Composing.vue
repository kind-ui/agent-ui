<script setup lang="ts">
import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { AddMenu } from "../../../../../src/vue/add-menu.js";
import { ApprovalMode } from "../../../../../src/vue/approval-mode.js";
import {
  Composer,
  ComposerInput,
  ComposerRestored,
  ComposerSubmit,
} from "../../../../../src/vue/composer.js";
import { ContextBar } from "../../../../../src/vue/context-bar.js";
import { Dictation } from "../../../../../src/vue/dictation.js";
import { KindToolbar, KindToolbarButton } from "../../../../../src/vue/internal/toolbar.js";
import {
  Message,
  MessageContent,
  MessageCopy,
  MessageRegenerate,
  MessageToolbar,
} from "../../../../../src/vue/message.js";
import { ModelControl } from "../../../../../src/vue/model-control.js";
import { Picker } from "../../../../../src/vue/picker.js";
import { SettingsMenu } from "../../../../../src/vue/settings-menu.js";
import { addItems } from "../../../shared/add-menu.js";
import { draftKey, replies } from "../../../shared/agent.js";
import { learnMoreHref, modes } from "../../../shared/approval-mode.js";
import { contextChips } from "../../../shared/context-bar.js";
import { expose } from "../../../shared/expose.js";
import { regenerateOptions } from "../../../shared/message.js";
import {
  levels as controlLevels,
  models as controlModels,
  settings as controlSettings,
} from "../../../shared/model-control.js";
import { modelActions } from "../../../shared/model-selector.js";
import { placeActions, places } from "../../../shared/picker.js";
import { initialValues, settings } from "../../../shared/settings-menu.js";
import { type Details, dictation, drafts, host } from "./host.js";

defineProps<{ confirm: boolean }>();

const settingValues = shallowRef(initialValues);
const mode = shallowRef("ask");
const chips = shallowRef(contextChips(4));
const change = (component: string) => (_value: unknown, details: Details) => host.change(component, details);

const onValues = (next: typeof initialValues, details: Details) => {
  if (host.change("settings", details)) settingValues.value = next;
};
const onMode = (next: string, details: Details) => {
  if (host.change("approval", details)) mode.value = next;
};
const onRemoveChip = (id: string, details: Details) => {
  if (host.change("context-bar", details)) chips.value = chips.value.filter((chip) => chip.id !== id);
};
const onRegenerate = (text: string, details: MessageRegenerateDetails) => {
  host.decide(`regenerate:${details.optionId ?? ""}`)(text, details);
};
const onDraft = (_value: unknown, details: Details & { reason: string }) => {
  if (details.reason !== "restore") host.change("draft", details);
};

onMounted(() => expose({ kindDictation: dictation.host }));
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section id="picker" data-case="picker">
      <Picker
        label="Work in"
        :items="places"
        :actions="placeActions"
        default-value="kind-ui/agent-ui"
        :onValueChange="change('picker')"
        :onAction="host.decide('picker-action')"
      />
    </section>
    <section id="add-menu" data-case="add-menu">
      <AddMenu :items="addItems" :onAction="host.decide('add')" />
    </section>
    <section id="settings-menu" data-case="settings-menu">
      <SettingsMenu :settings="settings" :values="settingValues" :onValuesChange="onValues" />
    </section>
    <section id="approval-mode" data-case="approval-mode">
      <ApprovalMode
        :modes="modes"
        :value="mode"
        :learn-more-href="learnMoreHref"
        :agent-confirm="confirm"
        :onValueChange="onMode"
      />
    </section>
    <section id="model-control" data-case="model-control">
      <ModelControl
        :models="controlModels"
        :levels="controlLevels"
        :settings="controlSettings"
        default-model="opus"
        default-effort="medium"
        :default-values="{ fast: false, context: '1m' }"
        :onModelChange="change('model-control')"
        :onEffortChange="change('model-control')"
        :onValuesChange="change('model-control')"
        :actions="modelActions"
        :onAction="host.decide('model-control-action')"
      />
    </section>
    <section id="context-bar" data-case="context-bar" :style="{ width: '360px' }">
      <ContextBar
        :chips="chips"
        :style="{ '--kind-context-chip-max-width': '120px' }"
        :onRemove="onRemoveChip"
      />
    </section>
    <section id="dictation" data-case="dictation" :style="{ width: '320px' }">
      <Dictation :source="dictation.source" :agent-confirm="confirm" :onText="host.decide('dictate')" />
    </section>
    <section id="answer" data-case="message">
      <Message
        aria-label="Answer"
        message-role="assistant"
        :text="replies[0]"
        :regenerate-options="regenerateOptions"
        :onRegenerate="onRegenerate"
      >
        <MessageContent>{{ replies[0] }}</MessageContent>
        <MessageToolbar>
          <KindToolbar aria-label="Answer actions">
            <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
            <MessageRegenerate><KindToolbarButton aria-label="Regenerate" /></MessageRegenerate>
          </KindToolbar>
        </MessageToolbar>
      </Message>
    </section>
    <section id="draft" data-case="composer">
      <Composer
        aria-label="Draft"
        :draft-key="draftKey"
        :draft-storage="drafts"
        :onSubmit="host.submit"
        :onValueChange="onDraft"
      >
        <ComposerInput aria-label="Draft prompt" />
        <ComposerRestored />
        <ComposerSubmit />
      </Composer>
    </section>
  </div>
</template>
