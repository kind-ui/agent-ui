import { h } from "vue";
import { Reasoning } from "../components/ui/vue/reasoning.js";

export default () =>
  h(Reasoning, {
    status: "complete",
    durationSeconds: 3,
    text: "Checked **two** sources.",
    defaultOpen: true,
  });
