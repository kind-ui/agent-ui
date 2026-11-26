import { h } from "vue";
import { Trace } from "../components/ui/vue/trace.js";

export default () =>
  h(Trace, {
    label: "Agent run",
    spans: [
      { id: "run", name: "Answer the question", kind: "agent", status: "complete", start: 0, end: 1200 },
    ],
  });
