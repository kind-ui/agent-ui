import { h } from "vue";
import { Selection } from "../components/ui/vue/selection.js";

export default () =>
  h(Selection, { actions: [{ id: "ask", label: "Ask" }], onAction: () => {} }, () =>
    h("p", null, "Retry with backoff."),
  );
