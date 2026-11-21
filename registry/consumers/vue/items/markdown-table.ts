import { h } from "vue";
import { MarkdownTable } from "../components/ui/vue/markdown-table.js";

export default () =>
  h(MarkdownTable, { "aria-label": "Table" }, () => [
    h("thead", [h("tr", [h("th", "Name")])]),
    h("tbody", [h("tr", [h("td", "Step")])]),
  ]);
