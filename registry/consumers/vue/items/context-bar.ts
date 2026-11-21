import { h } from "vue";
import { ContextBar } from "../components/ui/vue/context-bar.js";

export default () => h(ContextBar, { chips: [{ id: "readme", label: "README.md", kind: "file" }] });
