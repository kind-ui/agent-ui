import { h } from "vue";
import { Subagent } from "../components/ui/vue/subagent.js";

export default () =>
  h(
    Subagent,
    { agentName: "Code reviewer", status: "complete", result: "No issues found.", defaultOpen: true },
    () => h("p", "Read two files."),
  );
