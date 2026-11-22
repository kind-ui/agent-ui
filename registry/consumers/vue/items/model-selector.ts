import { h } from "vue";
import { ModelSelector } from "../components/ui/vue/model-selector.js";

export default () =>
  h(ModelSelector, {
    models: [{ id: "sonnet-4", name: "Sonnet 4", group: "Anthropic" }],
    defaultValue: "sonnet-4",
  });
