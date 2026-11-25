import { h } from "vue";
import { UsageMeter } from "../components/ui/vue/usage-meter.js";

export default () => h(UsageMeter, { used: 3.2, limit: 5, period: "This month" });
