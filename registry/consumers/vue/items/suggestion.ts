import { h } from "vue";
import { Suggestion } from "../components/ui/vue/suggestion.js";

export default () =>
  h(Suggestion, { suggestions: [{ id: "a", label: "Summarize this thread" }], onPick: () => {} });
