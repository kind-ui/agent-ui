import { h } from "vue";
import { Action } from "../components/ui/vue/action.js";

export default () =>
  h(Action, {
    label: "Explain",
    quote: "Retry with backoff.",
    result: "Wait, then try again.",
    status: "complete",
  });
