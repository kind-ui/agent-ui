import { h } from "vue";
import { InlineCitation } from "../components/ui/vue/inline-citation.js";

export default () =>
  h("p", null, [
    "Back off on a limit ",
    h(InlineCitation, {
      sources: [{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }],
    }),
  ]);
