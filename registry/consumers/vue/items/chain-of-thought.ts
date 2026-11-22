import { h } from "vue";
import { ChainOfThought } from "../components/ui/vue/chain-of-thought.js";

export default () =>
  h(ChainOfThought, {
    label: "Researching flights",
    status: "complete",
    steps: [{ id: "search", status: "complete", title: "Search flights", durationSeconds: 3 }],
    defaultOpen: true,
  });
