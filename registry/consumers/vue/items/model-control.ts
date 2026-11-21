import { h } from "vue";
import { ModelControl } from "../components/ui/vue/model-control.js";

export default () =>
  h(ModelControl, {
    models: [{ id: "gpt-5", name: "GPT-5" }],
    levels: [{ value: "high", label: "High" }],
    defaultModel: "gpt-5",
  });
