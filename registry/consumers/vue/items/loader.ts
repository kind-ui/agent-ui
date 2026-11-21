import { h } from "vue";
import { Loader } from "../components/ui/vue/loader.js";

export default () => h(Loader, { label: "Loading conversation…" });
