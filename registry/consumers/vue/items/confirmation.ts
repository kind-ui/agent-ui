import { h } from "vue";
import { Confirmation } from "../components/ui/vue/confirmation.js";

export default () =>
  h(Confirmation, {
    label: "Run search_docs?",
    approval: { approvalId: "a1", generation: 1, state: "requested" },
    onApprove: () => {},
    onDeny: () => {},
    reason: true,
  });
