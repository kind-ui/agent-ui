import { h } from "vue";
import { QuotaNotice } from "../components/ui/vue/quota-notice.js";

export default () => h(QuotaNotice, { used: 800, limit: 1000, period: "this month" });
