import { h } from "vue";
import { GuardrailNotice } from "../components/ui/vue/guardrail-notice.js";

export default () =>
  h(GuardrailNotice, {
    blocking: true,
    label: "Model output withheld",
    reason: "The response included personal data.",
    detail: "Your organization's policy blocks email addresses.",
  });
