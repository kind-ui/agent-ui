import { h } from "vue";
import { Tool } from "../components/ui/vue/tool.js";

export default () =>
  h(Tool, {
    call: {
      toolCallId: "t1",
      name: "search_docs",
      dynamic: false,
      input: { state: "ready", value: { query: "steps" } },
      output: { state: "available", value: 0 },
    },
    defaultOpen: true,
  });
