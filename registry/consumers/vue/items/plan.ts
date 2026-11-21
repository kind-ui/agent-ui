import { h } from "vue";
import { Plan } from "../components/ui/vue/plan.js";

export default () =>
  h(Plan, {
    label: "Migration plan",
    items: [{ id: "audit", status: "complete", title: "Audit the current schema" }],
    defaultOpen: true,
  });
