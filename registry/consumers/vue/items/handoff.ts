import { h } from "vue";
import { Handoff } from "../components/ui/vue/handoff.js";

export default () =>
  h(Handoff, {
    from: { id: "support", name: "Support" },
    to: { kind: "person", name: "Dana" },
    reason: "Refunds need a person",
    status: "accepted",
  });
