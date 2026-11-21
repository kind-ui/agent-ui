import { h } from "vue";
import { ContextMeter } from "../components/ui/vue/context-meter.js";

export default () => h(ContextMeter, { used: 57_600, total: 128_000, usage: { input: 40_000 }, cost: 0.42 });
