<script lang="ts">
export const variants = ["all", "plain", "groups", "logos", "composer", "reduced", "refusing"] as const;
</script>

<script setup lang="ts">
import type { ChangeDetails } from "@ui-sdk/core";
import { h, onMounted, type VNode } from "vue";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorTrigger,
} from "../../../../src/vue/model-selector.js";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/vue/composer.js";
import { ReasoningEffort } from "../../../../src/vue/reasoning-effort.js";
import { expose } from "../../shared/expose.js";
import { controls } from "../../shared/full-composer.js";
import { iconModels, levels, modelActions, models, selectionHost } from "../../shared/model-selector.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = selectionHost();
const refusing = props.variant === "refusing";
const plain = props.variant === "plain";
const motion = props.variant === "reduced" ? "reduced" : undefined;
const pages = props.variant === "groups" ? "groups" : undefined;

/** A logo's markup as an `svg` node, its attributes as they are and its contents as its inner HTML. */
const logo = (markup: string): VNode => {
  const [, attributes = "", contents = ""] = /^<svg([^>]*)>(.*)<\/svg>$/s.exec(markup) ?? [];
  const attrs: Record<string, string> = {};
  for (const [, name = "", value = ""] of attributes.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[name] = value;
  return h("svg", { ...attrs, innerHTML: contents });
};

const logoModels = iconModels(logo);
const onLogoModel = record("model");
const onSecond = record("second");
const onEffort = record("effort");
const ignore = () => undefined;

function onModel(value: string | null, details: ChangeDetails) {
  record("model")(value, details);
  if (refusing) details.cancel();
}
function onAction(id: string, details: ChangeDetails) {
  record("action")(id, details);
  if (refusing) details.cancel();
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div v-if="variant === 'composer'" class="p-4">
    <Composer aria-label="Message" :on-submit="ignore">
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <div :style="controls">
        <ModelSelector id="model" :models="logoModels" default-value="claude-sonnet-5.5" />
        <ReasoningEffort id="effort" :levels="levels" default-value="medium" />
      </div>
      <ComposerSubmit />
    </Composer>
  </div>
  <div v-else-if="variant === 'logos'" class="flex flex-col gap-4 p-6">
    <ModelSelector
      id="model"
      :models="logoModels"
      default-value="claude-sonnet-5.5"
      @value-change="onLogoModel"
    />
    <div class="ps-32">
      <ModelSelector
        id="second"
        :models="logoModels"
        default-value="mai-code-2"
        @value-change="onSecond"
      />
    </div>
    <div class="ps-64">
      <ModelSelector id="third" :models="logoModels" default-value="gpt-6-astra">
        <ModelSelectorTrigger id="mine" />
        <ModelSelectorContent />
      </ModelSelector>
    </div>
  </div>
  <div v-else class="flex flex-col gap-4 p-6">
    <p id="above">Above</p>
    <div id="toolbar" class="flex items-center gap-2">
      <ModelSelector
        v-if="plain"
        id="model"
        :models="models"
        :pages="pages"
        :value="refusing ? 'gpt-5' : undefined"
        :default-value="refusing ? undefined : 'gpt-5'"
        :motion="motion"
        @value-change="onModel"
      />
      <ModelSelector
        v-else
        id="model"
        :models="models"
        :pages="pages"
        :value="refusing ? 'gpt-5' : undefined"
        :default-value="refusing ? undefined : 'gpt-5'"
        :actions="modelActions"
        :motion="motion"
        @value-change="onModel"
        @action="onAction"
      />
      <ReasoningEffort
        id="effort"
        :levels="levels"
        :value="refusing ? 'medium' : undefined"
        :default-value="refusing ? undefined : 'medium'"
        :motion="motion"
        @value-change="onEffort"
      />
      <span id="beside">Beside</span>
    </div>
  </div>
</template>
