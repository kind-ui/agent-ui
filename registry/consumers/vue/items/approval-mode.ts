import { h } from "vue";
import { ApprovalMode } from "../components/ui/vue/approval-mode.js";

export default () =>
  h(ApprovalMode, { modes: [{ value: "ask", label: "Ask every time" }], defaultValue: "ask" });
