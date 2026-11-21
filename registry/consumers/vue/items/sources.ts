import { h } from "vue";
import { Sources } from "../components/ui/vue/sources.js";

export default () =>
  h(Sources, { sources: [{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }] });
