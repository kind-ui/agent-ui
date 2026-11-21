import { h } from "vue";
import { Dictation } from "../components/ui/vue/dictation.js";

export default () => h(Dictation, { source: { async *start() {} } });
