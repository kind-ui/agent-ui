import { h } from "vue";
import { Picker } from "../components/ui/vue/picker.js";

export default () =>
  h(Picker, {
    label: "Work in",
    items: [{ value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui" }],
    defaultValue: "agent-ui",
  });
